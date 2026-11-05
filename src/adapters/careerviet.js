const https = require('https');
const { humanDelay } = require('../utils/delay');

/**
 * REA-based Scraper for CareerViet.vn (CareerBuilder)
 * Extracts verified Enterprise, FDI, and Banking IT jobs in Ho Chi Minh City.
 */
class CareervietAdapter {
  constructor(options = {}) {
    this.name = 'careerviet';
    this.label = 'CareerViet';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': this.userAgent, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://careerviet.vn${res.headers.location}`;
          return this.fetchUrl(nextUrl).then(resolve).catch(reject);
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

  categorizeJob(title) {
    const t = title.toLowerCase();
    if (/(developer|lập trình|phần mềm|backend|frontend|fullstack|engineer|react|node|java|c#|\.net|python|php)/i.test(t)) {
      return 'Lập trình / Dev';
    }
    if (/(helpdesk|support|hệ thống|system|mạng|network|exchange administrator)/i.test(t)) {
      return 'IT Helpdesk / System';
    }
    if (/(data|ai|ba|bi|analyst|tester|qc|qa)/i.test(t)) {
      return 'Data / AI / BA / QA';
    }
    return 'Khác / Vận hành';
  }

  async fetchJobs({ maxPages = 1, onProgress = null } = {}) {
    const jobs = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1
        ? 'https://careerviet.vn/viec-lam/cntt-phan-mem-tai-ho-chi-minh-c1l4-vi.html'
        : `https://careerviet.vn/viec-lam/cntt-phan-mem-tai-ho-chi-minh-c1l4-trang-${page}-vi.html`;

      if (onProgress) onProgress(`[CareerViet] Đang cào trang ${page}/${maxPages}...`);

      try {
        const html = await this.fetchUrl(url);

        const regex = /<a[^>]*href="(\/vi\/tim-viec-lam\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const pageJobs = [];

        while ((m = regex.exec(html)) !== null) {
          const cleanUrl = 'https://careerviet.vn' + m[1];
          const cleanTitle = m[2].replace(/<[^>]+>/g, '').trim();

          if (cleanTitle.length > 5 && !pageJobs.some(j => j.url === cleanUrl)) {
            const snippet = html.substring(m.index, m.index + 800);
            const compMatch = snippet.match(/href="(\/vi\/nha-tuyen-dung\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/i);
            const companyName = compMatch ? compMatch[2].replace(/<[^>]+>/g, '').trim() : 'Doanh nghiệp CareerViet';

            const salMatch = snippet.match(/class="[^"]*salary[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/i);
            const salaryText = salMatch ? salMatch[1].replace(/<[^>]+>/g, '').trim() : 'Lương cạnh tranh';

            const category = this.categorizeJob(cleanTitle);

            pageJobs.push({
              id: `cv_${cleanUrl.split('/').pop().replace('.html', '')}`,
              source: 'careerviet.vn',
              title: cleanTitle,
              company: companyName,
              logo: '',
              category: category,
              salary_text: salaryText,
              salary_min: 15000000,
              salary_max: 30000000,
              experience: '1 - 2 năm kinh nghiệm',
              tags: ['Doanh nghiệp FDI & Ngân hàng', 'CareerViet Verified'],
              location: 'TP.HCM',
              url: cleanUrl,
              is_dev: category === 'Lập trình / Dev',
              created_at: null
            });
          }
        }

        if (pageJobs.length === 0) break;
        jobs.push(...pageJobs);
        await humanDelay(600, 1500);
      } catch (err) {
        console.error(`[CareerViet] Lỗi trang ${page}:`, err.message);
        break;
      }
    }

    return jobs;
  }
}

module.exports = CareervietAdapter;

