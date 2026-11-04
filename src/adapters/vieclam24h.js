const https = require('https');

/**
 * REA-based Scraper for Vieclam24h.vn
 * Reverse-engineers Next.js SSR (__NEXT_DATA__) to fetch jobs instantly with zero browser overhead.
 */
class Vieclam24hAdapter {
  constructor(options = {}) {
    this.name = 'vieclam24h';
    this.label = 'Việc Làm 24h';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': this.userAgent } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  formatSalary(min, max) {
    if (!min && !max) return 'Thỏa thuận';
    if (min && !max) return `Từ ${(min / 1000000).toFixed(0)} triệu`;
    if (!min && max) return `Lên tới ${(max / 1000000).toFixed(0)} triệu`;
    return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu`;
  }

  categorizeJob(title, tags) {
    const t = (title + ' ' + (tags || []).join(' ')).toLowerCase();
    if (/(developer|lập trình viên|lập trình|frontend|backend|fullstack|react|node|php|java|c#|\.net|flutter|mobile|software engineer|kỹ sư phần mềm)/i.test(t)) {
      return 'Lập trình / Dev';
    }
    if (/(helpdesk|hỗ trợ kỹ thuật|quản trị hệ thống|system admin|mạng|phần cứng|kỹ thuật it|it support|vận hành hệ thống)/i.test(t)) {
      return 'IT Helpdesk / System';
    }
    if (/(kinh doanh|tư vấn|phát triển kd|bán hàng|sales|cskh|tư vấn phần mềm)/i.test(t)) {
      return 'Sales / Tư vấn IT';
    }
    if (/(plc|tự động hoá|tự động hóa|điện &|cơ điện)/i.test(t)) {
      return 'Tự động hóa / PLC';
    }
    if (/(data|dữ liệu|ai |erp|sap|ba|business analyst|bi |tester|qa|qc|kiểm thử)/i.test(t)) {
      return 'Data / AI / BA / QA';
    }
    return 'Khác / Vận hành';
  }

  async fetchJobs({ maxPages = 8, onProgress = null } = {}) {
    const jobs = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1
        ? 'https://vieclam24h.vn/viec-lam-it-phan-mem-tai-ho-chi-minh-o8p210000187.html'
        : `https://vieclam24h.vn/viec-lam-it-phan-mem-tai-ho-chi-minh-o8p210000187.html?page=${page}`;

      if (onProgress) onProgress(`[Vieclam24h] Đang bóc tách trang ${page}/${maxPages}...`);

      try {
        const html = await this.fetchUrl(url);
        const startTag = '<script id="__NEXT_DATA__" type="application/json">';
        const endTag = '</script>';
        const startIdx = html.indexOf(startTag);
        
        if (startIdx === -1) {
          break;
        }

        const endIdx = html.indexOf(endTag, startIdx);
        const jsonStr = html.substring(startIdx + startTag.length, endIdx);
        const nextData = JSON.parse(jsonStr);
        const jobsResponse = nextData.props?.initialProps?.pageProps?.jobsResponse;
        const items = jobsResponse?.items || [];

        if (items.length === 0) break;

        for (const item of items) {
          const smartTags = (item.smart_tags || []).map(t => (typeof t === 'string' ? t : t.name)).filter(Boolean);
          const category = this.categorizeJob(item.title, smartTags);
          const companyName = item.employer_info?.name || 'Doanh nghiệp ẩn danh';
          const companyLogo = item.employer_info?.logo || '';
          const salaryText = this.formatSalary(item.salary_min, item.salary_max);
          const urlJob = `https://vieclam24h.vn/${item.title_slug}-c${item.id}.html`;

          let locationText = 'TP.HCM';
          if (Array.isArray(item.places) && item.places.length > 0) {
            locationText = item.places.map(p => p.district?.name || p.city?.name).filter(Boolean).join(', ') || 'TP.HCM';
          }

          jobs.push({
            id: `vl24h_${item.id}`,
            source: 'vieclam24h.vn',
            title: item.title,
            company: companyName,
            logo: companyLogo,
            category: category,
            salary_text: salaryText,
            salary_min: item.salary_min || 0,
            salary_max: item.salary_max || 0,
            experience: smartTags.find(t => t.includes('kinh nghiệm')) || 'Không yêu cầu',
            tags: smartTags,
            location: locationText,
            url: urlJob,
            is_dev: category === 'Lập trình / Dev',
            created_at: item.created_at || null
          });
        }

        await this.delay(200);
      } catch (err) {
        console.error(`Lỗi cào trang ${page}:`, err.message);
        break;
      }
    }

    return jobs;
  }
}

module.exports = Vieclam24hAdapter;
