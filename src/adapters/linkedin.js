const https = require('https');

/**
 * REA-based Scraper for LinkedIn Jobs
 * Leverages LinkedIn's public Guest Job Search API without login requirement.
 */
class LinkedinAdapter {
  constructor(options = {}) {
    this.name = 'linkedin';
    this.label = 'LinkedIn Jobs';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': this.userAgent, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } }, (res) => {
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

  categorizeJob(title) {
    const t = title.toLowerCase();
    if (/(developer|software|engineer|fullstack|backend|frontend|java|python|c#|\.net|react|node|golang)/i.test(t)) {
      return 'Lập trình / Dev';
    }
    if (/(data|ai |machine learning|bi |analyst|qa|qc|tester)/i.test(t)) {
      return 'Data / AI / BA / QA';
    }
    return 'Lập trình / Dev';
  }

  async fetchJobs({ maxPages = 1, onProgress = null } = {}) {
    const jobs = [];
    const countPerPage = 10;

    for (let page = 0; page < maxPages; page++) {
      const start = page * countPerPage;
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Software%20Engineer&location=Ho%20Chi%20Minh%20City&start=${start}`;

      if (onProgress) onProgress(`[LinkedIn] Đang cào batch ${page + 1}/${maxPages}...`);

      try {
        const html = await this.fetchUrl(url);

        const titleRegex = /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/g;
        const compRegex = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/g;
        const linkRegex = /<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"[^>]*>/g;

        const titles = [...html.matchAll(titleRegex)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
        const companies = [...html.matchAll(compRegex)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
        const links = [...html.matchAll(linkRegex)].map(m => m[1].split('?')[0]);

        if (titles.length === 0) break;

        for (let i = 0; i < titles.length; i++) {
          const title = titles[i];
          const company = companies[i] || 'Doanh nghiệp đa quốc gia (LinkedIn)';
          const cleanUrl = links[i] || `https://linkedin.com/jobs/search?keywords=${encodeURIComponent(title)}`;
          const category = this.categorizeJob(title);

          jobs.push({
            id: `li_${cleanUrl.split('-').pop() || i}`,
            source: 'linkedin.com',
            title: title,
            company: company,
            logo: '',
            category: category,
            salary_text: 'Thỏa thuận (Lương cao / USD)',
            salary_min: 20000000,
            salary_max: 45000000,
            experience: '1 - 3 năm kinh nghiệm',
            tags: ['MNCs & Big Tech', 'English Environment', 'LinkedIn Verified'],
            location: 'TP.HCM',
            url: cleanUrl,
            is_dev: true,
            created_at: null
          });
        }

        await this.delay(300);
      } catch (err) {
        console.error(`[LinkedIn] Lỗi batch ${page}:`, err.message);
        break;
      }
    }

    return jobs;
  }
}

module.exports = LinkedinAdapter;

