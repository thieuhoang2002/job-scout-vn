const https = require('https');
const http = require('http');

/**
 * REA Web Extractor
 * Reverse-engineers any portfolio / developer personal site to extract
 * candidate bio, skills, stacks, and featured projects without a headless browser.
 */
class ReaWebExtractor {
  constructor(options = {}) {
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': this.userAgent } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).href;
          return this.fetchUrl(redirectUrl).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  detectKnownTechs(text) {
    const TECH_MAP = [
      { name: 'React', category: 'Frontend', regex: /\b(react|react\.js|reactjs)\b/i },
      { name: 'Next.js', category: 'Frontend', regex: /\b(next\.js|nextjs|next 1[4-6])\b/i },
      { name: 'Vue.js', category: 'Frontend', regex: /\b(vue|vue\.js|vuejs|nuxt)\b/i },
      { name: 'TypeScript', category: 'Language', regex: /\b(typescript|ts)\b/i },
      { name: 'JavaScript', category: 'Language', regex: /\b(javascript|es6)\b/i },
      { name: 'Tailwind CSS', category: 'Frontend', regex: /\b(tailwind|tailwindcss)\b/i },
      { name: 'Node.js', category: 'Backend', regex: /\b(node|node\.js|nodejs|express|nestjs)\b/i },
      { name: 'C# / .NET', category: 'Backend', regex: /\b(c#|\.net|\.net 8|dotnet|csharp)\b/i },
      { name: 'Python', category: 'Language', regex: /\b(python|django|fastapi|flask)\b/i },
      { name: 'PHP / Laravel', category: 'Backend', regex: /\b(php|laravel|wordpress)\b/i },
      { name: 'Golang', category: 'Backend', regex: /\b(golang|go lang)\b/i },
      { name: 'Java', category: 'Backend', regex: /\b(java|spring boot)\b/i },
      { name: 'PostgreSQL', category: 'Database', regex: /\b(postgresql|postgres)\b/i },
      { name: 'MongoDB', category: 'Database', regex: /\b(mongodb|mongo)\b/i },
      { name: 'Redis', category: 'Database', regex: /\b(redis|upstash)\b/i },
      { name: 'SQL', category: 'Database', regex: /\b(sql|mysql|sql server)\b/i },
      { name: 'Selenium / Scraping', category: 'Automation', regex: /\b(selenium|playwright|puppeteer|web scraping|crawler|crawl)\b/i },
      { name: 'RAG & AI LLM', category: 'AI', regex: /\b(rag|gemini api|openai|langchain|groq|llm|chatbot)\b/i },
      { name: 'Docker / Cloud', category: 'DevOps', regex: /\b(docker|kubernetes|aws|gcp|vercel|cloudflare)\b/i }
    ];

    const found = [];
    for (const item of TECH_MAP) {
      if (item.regex.test(text)) {
        found.push(item);
      }
    }
    return found;
  }

  async extractFromUrl(url) {
    const html = await this.fetchUrl(url);

    let candidateName = '';
    let jobTitle = 'Software Engineer';
    let summary = '';
    let projects = [];
    let detectedTechs = [];

    // 1. REA Probe: JSON-LD Structured Data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        const graph = jsonLd['@graph'] || [jsonLd];
        const person = graph.find(item => item['@type'] === 'Person');
        if (person) {
          candidateName = person.name || candidateName;
          jobTitle = person.jobTitle || jobTitle;
          summary = person.description || summary;
        }
      } catch (e) {}
    }

    // 2. REA Probe: OpenGraph & Meta
    if (!candidateName) {
      const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitle) candidateName = ogTitle[1].split('—')[0].split('|')[0].trim();
    }
    if (!summary) {
      const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<meta name="description" content="([^"]+)"/i);
      if (ogDesc) summary = ogDesc[1].trim();
    }

    // 3. REA Probe: Next.js App Router RSC chunks or __NEXT_DATA__
    const rscRegex = /self\.__next_f\.push\(\[1,"(.*?[^\\])"\]\)/gs;
    let rscPayload = '';
    let m;
    while ((m = rscRegex.exec(html)) !== null) {
      try {
        rscPayload += JSON.parse(`"${m[1]}"`) + ' ';
      } catch (e) {
        rscPayload += m[1] + ' ';
      }
    }

    // 4. Extract Project Titles from RSC or HTML
    const projectRegex = /"title":"([^"]+)","(?:type|description|slug)":"([^"]+)"/g;
    let pm;
    while ((pm = projectRegex.exec(rscPayload)) !== null) {
      if (!projects.some(p => p.title === pm[1]) && projects.length < 10) {
        projects.push({ title: pm[1], info: pm[2] });
      }
    }

    // 5. Detect Skills across Full Payload + HTML
    const fullCorpus = (html + ' ' + rscPayload).substring(0, 500000);
    detectedTechs = this.detectKnownTechs(fullCorpus);

    return {
      name: candidateName || 'Ứng viên CNTT',
      headline: jobTitle,
      summary: summary || 'Lập trình viên đam mê công nghệ & giải pháp thực tiễn.',
      portfolio_url: url,
      skills: detectedTechs.map(t => t.name),
      skill_details: detectedTechs,
      featured_projects: projects,
      experience_years: 1.5 // Default reasonable baseline for junior-mid
    };
  }
}

module.exports = ReaWebExtractor;
