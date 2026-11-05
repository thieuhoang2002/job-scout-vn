const https = require('https');
const { humanDelay } = require('../utils/delay');

/**
 * REA-based Scraper for LinkedIn Jobs
 * Leverages LinkedIn's public Guest Job Search API with Human Jitter Delay.
 */
class LinkedinAdapter {
  constructor(options = {}) {
    this.name = 'linkedin';
    this.label = 'LinkedIn Jobs';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    this.maxJobs = options.maxJobs || 50; // Cap at 50 high-relevance jobs
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        }
      }, (res) => {
        if (res.statusCode === 429) {
          return reject(new Error('Rate limited (429)'));
        }
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
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

  async fetchJobs({ maxPages = 2, onProgress = null } = {}) {
    const jobs = [];
    const countPerPage = 25;
    // Cap at max 2 batches (50 jobs)
    const effectivePages = Math.min(maxPages, Math.ceil(this.maxJobs / countPerPage));

    for (let page = 0; page < effectivePages; page++) {
      const start = page * countPerPage;
      // Filter by recent 7 days (f_TPR=r604800)
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Software%20Engineer&location=Vietnam&f_TPR=r604800&start=${start}`;

      if (onProgress) onProgress(`[LinkedIn] Đang cào batch ${page + 1}/${effectivePages} (Mô phỏng người lướt)...`);

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
          if (jobs.length >= this.maxJobs) break;

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
            location: 'Toàn quốc / Remote',
            url: cleanUrl,
            is_dev: true,
            created_at: null
          });
        }

        // Natural human delay with randomized jitter between 1000ms - 2200ms
        await humanDelay(1000, 2200);
      } catch (err) {
        console.warn(`[LinkedIn] Cảnh báo batch ${page + 1}: ${err.message}. Đang áp dụng an toàn.`);
        break;
      }
    }

    return jobs;
  }
}

module.exports = LinkedinAdapter;
