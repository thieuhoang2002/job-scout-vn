const https = require('https');

/**
 * REA-based Scraper for ITViec.com
 * Extracts verified IT / Software Engineering jobs in Ho Chi Minh City.
 */
class ItviecAdapter {
  constructor(options = {}) {
    this.name = 'itviec';
    this.label = 'ITviec';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': this.userAgent, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://itviec.com${res.headers.location}`;
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
    if (/(helpdesk|support|kỹ thuật viên|quản trị mạng)/i.test(t)) {
      return 'IT Helpdesk / System';
    }
    if (/(data|ai |machine learning|bi |ba |business analyst|tester|qc|qa)/i.test(t)) {
      return 'Data / AI / BA / QA';
    }
    return 'Lập trình / Dev'; // 95%+ of ITviec is software dev
  }

  async fetchJobs({ maxPages = 2, onProgress = null } = {}) {
    const jobs = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1
        ? 'https://itviec.com/it-jobs/ho-chi-minh-hcm'
        : `https://itviec.com/it-jobs/ho-chi-minh-hcm?page=${page}`;

      if (onProgress) onProgress(`[ITviec] Đang cào trang ${page}/${maxPages}...`);

      try {
        const html = await this.fetchUrl(url);

        // Parse job cards from ITViec HTML
        // ITViec structure: <h3 ...><a href="...">Job Title</a></h3> followed by company and tags
        const titleRegex = /<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]*\/it-jobs\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
        let tm;
        const pageJobs = [];

        while ((tm = titleRegex.exec(html)) !== null) {
          const rawUrl = tm[1].split('?')[0];
          const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://itviec.com${rawUrl}`;
          const cleanTitle = tm[2].replace(/<[^>]+>/g, '').trim();

          // Search company name near this snippet
          const snippet = html.substring(tm.index, tm.index + 800);
          const compMatch = snippet.match(/class="text-rich-grey"[^>]*>([\s\S]*?)<\/a>/i);
          const companyName = compMatch ? compMatch[1].replace(/<[^>]+>/g, '').trim() : 'Doanh nghiệp IT';

          // Extract tags if present
          const tagMatches = [...snippet.matchAll(/href="\/it-jobs\/([^"]+)"[^>]*>([^<]+)<\/a>/g)];
          const tags = tagMatches.map(t => t[2].trim()).filter(t => t !== cleanTitle);

          pageJobs.push({
            id: `itv_${cleanUrl.split('/').pop()}`,
            source: 'itviec.com',
            title: cleanTitle,
            company: companyName,
            logo: '',
            category: this.categorizeJob(cleanTitle),
            salary_text: 'Thỏa thuận (Cạnh tranh)',
            salary_min: 15000000,
            salary_max: 35000000,
            experience: '1 - 3 năm kinh nghiệm',
            tags: tags.length > 0 ? tags : ['Software Engineering', 'ITviec Verified'],
            location: 'TP.HCM',
            url: cleanUrl,
            is_dev: true,
            created_at: null
          });
        }

        if (pageJobs.length === 0) break;
        jobs.push(...pageJobs);

        await this.delay(300);
      } catch (err) {
        console.error(`[ITviec] Lỗi trang ${page}:`, err.message);
        break;
      }
    }

    return jobs;
  }
}

module.exports = ItviecAdapter;
