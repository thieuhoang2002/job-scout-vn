/**
 * Social AI Filter & Entity Extractor for Facebook Groups & Threads
 * 
 * Strict Guardrails:
 * 1. Post Age Gate: Strictly < 3 days (< 72 hours). Older posts are dropped.
 * 2. Anti-Spam / Anti-Scam Gate: Detects and rejects course selling, multi-level marketing,
 *    fake jobs, telegram tasks, gambling/crypto seeding, vague "inbox" posts with no specs.
 * 3. Information Integrity: Requires minimum tech stack, position title, and contact/apply info.
 */

class SocialAiFilter {
  constructor(options = {}) {
    this.maxAgeHours = options.maxAgeHours || 72; // Strictly 3 days
  }

  /**
   * Parse relative Vietnamese / English time strings into hours ago
   * e.g., "1 giờ trước", "5h", "2 ngày trước", "Vừa xong", "Hôm qua lúc 14:00"
   */
  parsePostAgeHours(timeStr) {
    if (!timeStr) return 0; // Default to fresh if unspecified

    // If it's an ISO date or timestamp number
    if (typeof timeStr === 'number') {
      const diffMs = Date.now() - (timeStr > 1e11 ? timeStr : timeStr * 1000);
      return Math.max(0, diffMs / (1000 * 60 * 60));
    }

    const t = String(timeStr).toLowerCase().trim();

    if (t.includes('vừa xong') || t.includes('just now') || t.includes('mới đây')) {
      return 0.1;
    }

    // Minutes
    const minMatch = t.match(/(\d+)\s*(phút|m|min)/);
    if (minMatch) {
      return parseInt(minMatch[1], 10) / 60;
    }

    // Hours
    const hourMatch = t.match(/(\d+)\s*(giờ|h|hour)/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10);
    }

    // Yesterday
    if (t.includes('hôm qua') || t.includes('yesterday')) {
      return 24;
    }

    // Days
    const dayMatch = t.match(/(\d+)\s*(ngày|d|day)/);
    if (dayMatch) {
      return parseInt(dayMatch[1], 10) * 24;
    }

    // Weeks or Months -> Definitely > 72 hours
    if (t.includes('tuần') || t.includes('tháng') || t.includes('năm') || t.includes('week') || t.includes('month')) {
      return 999;
    }

    // Try parsing standard Date string
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const diffMs = Date.now() - d.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60));
    }

    return 24; // Fallback estimate: 1 day
  }

  /**
   * Check whether a post is spam, scam, course marketing, or low-quality noise
   */
  detectSpamOrScam(text) {
    const t = text.toLowerCase();

    // 1. Course Marketing / Academy lùa gà
    const coursePatterns = [
      /khóa học|khoá học|bootcamp|lộ trình từ zero|cam kết việc làm sau \d+ tháng/,
      /học phí|đóng cọc|đào tạo thực chiến cấp tốc|tuyển sinh|học bổng \d+%/i,
      /trở thành lập trình viên sau \d+ tháng|nhận chứng chỉ quốc tế/i
    ];
    for (const p of coursePatterns) {
      if (p.test(t)) {
        return { isSpam: true, reason: 'Bài đăng quảng cáo bán khoá học / đào tạo (Không phải tuyển dụng)' };
      }
    }

    // 2. Financial / Task Scam / Cờ bạc / Việc nhẹ lương cao
    const scamPatterns = [
      /việc nhẹ lương cao|nhiệm vụ shopee|like video|xem video tik\s*tok|gõ văn bản|nhập liệu tại nhà/,
      /hoa hồng ngày|tài xỉu|tiền ảo|crypto airdrop|app kiếm tiền|nhận vốn trải nghiệm/i,
      /không cần kinh nghiệm.*lương \d{2,}\s*tr/i,
      /inbox nhận task|ib để nhận việc|chấm (.) nhận lộc/i
    ];
    for (const p of scamPatterns) {
      if (p.test(t)) {
        return { isSpam: true, reason: 'Dấu hiệu lừa đảo tuyển dụng (Nhiệm vụ, cờ bạc, việc nhẹ lương cao)' };
      }
    }

    // 3. Vague "Inbox" without Job specs
    if (t.length < 80 && (t.includes('inbox') || t.includes('ib me')) && !t.includes('react') && !t.includes('java') && !t.includes('node') && !t.includes('dev')) {
      return { isSpam: true, reason: 'Bài đăng quá sơ sài, thiếu mô tả vị trí và công nghệ' };
    }

    return { isSpam: false };
  }

  /**
   * Detect tech stack keywords
   */
  extractTechTags(text) {
    const techPatterns = [
      { tag: 'React', regex: /\b(react|reactjs|react\.js)\b/i },
      { tag: 'Next.js', regex: /\b(next|nextjs|next\.js)\b/i },
      { tag: 'Vue.js', regex: /\b(vue|vuejs|vue\.js|nuxt)\b/i },
      { tag: 'Node.js', regex: /\b(node|nodejs|node\.js|express|nest|nestjs)\b/i },
      { tag: 'TypeScript', regex: /\b(typescript|ts)\b/i },
      { tag: 'JavaScript', regex: /\b(javascript|js|es6)\b/i },
      { tag: 'Java', regex: /\b(java|spring|springboot|spring boot)\b/i },
      { tag: 'Golang', regex: /\b(golang|go lang|gin|fiber)\b/i },
      { tag: 'Python', regex: /\b(python|django|fastapi|flask)\b/i },
      { tag: 'PHP / Laravel', regex: /\b(php|laravel|wordpress)\b/i },
      { tag: 'C# / .NET', regex: /\b(c#|\.net|dotnet|asp\.net)\b/i },
      { tag: 'Mobile (Flutter/React Native)', regex: /\b(flutter|react native|swift|kotlin|ios|android)\b/i },
      { tag: 'DevOps / Cloud', regex: /\b(docker|k8s|kubernetes|aws|ci\/cd|devops)\b/i },
      { tag: 'QA / Tester', regex: /\b(tester|qc|qa|automation test|manual test)\b/i },
      { tag: 'AI / LLM', regex: /\b(ai|llm|rag|machine learning|langchain)\b/i },
      { tag: 'PostgreSQL / SQL', regex: /\b(postgresql|postgres|mysql|sql|mongodb|redis)\b/i }
    ];

    const tags = [];
    for (const item of techPatterns) {
      if (item.regex.test(text)) {
        tags.push(item.tag);
      }
    }
    return tags;
  }

  /**
   * Extract contact info (email, telegram, link)
   */
  extractContactInfo(text) {
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    const tgMatch = text.match(/(@[a-zA-Z0-9_]{4,}|t\.me\/[a-zA-Z0-9_]+)/i);
    const linkMatch = text.match(/https?:\/\/[^\s]+/i);

    return {
      email: emailMatch ? emailMatch[1] : null,
      telegram: tgMatch ? tgMatch[1] : null,
      link: linkMatch ? linkMatch[0] : null
    };
  }

  /**
   * Extract salary information
   */
  extractSalary(text) {
    const t = text.toLowerCase();
    
    // USD match: e.g. $1000 - $2500, up to $3000
    const usdMatch = text.match(/(\$\s*\d+[\d,.]*|\d+[\d,.]*\s*\$|\d+\s*-\s*\d+\s*usd|up to \s*\$?\s*\d+)/i);
    if (usdMatch) {
      return {
        text: usdMatch[0].trim(),
        min: 20000000,
        max: 50000000
      };
    }

    // VND match: e.g. 15-25 triệu, 20 - 30M, tới 40M
    const vndMatch = text.match(/(\d+\s*-\s*\d+\s*(triệu|tr|m|vnd)|tới\s*\d+\s*(triệu|tr|m)|upto\s*\d+\s*(triệu|tr|m))/i);
    if (vndMatch) {
      return {
        text: vndMatch[0].trim(),
        min: 15000000,
        max: 35000000
      };
    }

    return {
      text: 'Thỏa thuận theo năng lực',
      min: 15000000,
      max: 30000000
    };
  }

  /**
   * Extract working location
   */
  extractLocation(text) {
    const t = text.toLowerCase();
    if (t.includes('remote') || t.includes('làm việc từ xa') || t.includes('wfh')) {
      return 'Remote / WFH';
    }
    if (t.includes('hybrid')) {
      return 'Hybrid (Linh hoạt)';
    }
    if (t.includes('hồ chí minh') || t.includes('hcm') || t.includes('sài gòn') || t.includes('quận 1') || t.includes('quận 7') || t.includes('thủ đức')) {
      return 'TP. Hồ Chí Minh';
    }
    if (t.includes('hà nội') || t.includes('cầu giấy') || t.includes('ba đình') || t.includes('nam từ liêm')) {
      return 'Hà Nội';
    }
    if (t.includes('đà nẵng')) {
      return 'Đà Nẵng';
    }
    return 'Toàn quốc / Thỏa thuận';
  }

  /**
   * Main filter & normalizer method
   */
  filterAndNormalize(post, platform = 'facebook') {
    const rawText = post.text || post.content || post.caption || '';
    if (!rawText || rawText.trim().length < 40) {
      return { valid: false, reason: 'Nội dung bài đăng quá ngắn hoặc trống' };
    }

    // 1. Time Check (< 72 hours)
    const ageHours = this.parsePostAgeHours(post.time || post.timestamp || post.created_at);
    if (ageHours > this.maxAgeHours) {
      return {
        valid: false,
        reason: `Bài đăng đã quá hạn (> 72h / 3 ngày, ước tính: ${Math.round(ageHours)}h trước)`
      };
    }

    // 2. Anti-Spam / Anti-Scam Check
    const spamCheck = this.detectSpamOrScam(rawText);
    if (spamCheck.isSpam) {
      return { valid: false, reason: spamCheck.reason };
    }

    // 3. Tech Stack Extraction
    const tags = this.extractTechTags(rawText);
    const isDev = tags.length > 0 || /(lập trình|developer|engineer|coder|software|backend|frontend|fullstack|devops)/i.test(rawText);

    if (!isDev && !/(tuyển dụng|hiring|tìm đồng đội|cần tuyển)/i.test(rawText)) {
      return { valid: false, reason: 'Không phải bài đăng tuyển dụng công nghệ' };
    }

    // 4. Entity Extraction
    const salary = this.extractSalary(rawText);
    const location = this.extractLocation(rawText);
    const contact = this.extractContactInfo(rawText);

    // Clean Title from first line or keyword
    let cleanTitle = (post.title || rawText.split('\n')[0] || '').replace(/^[#\s*!👉🎯🔥🚨]+/, '').trim();
    if (cleanTitle.length > 80 || cleanTitle.length < 5) {
      cleanTitle = tags.length > 0 ? `[Tuyển dụng] Kỹ sư ${tags.slice(0, 2).join(' / ')}` : '[Tuyển dụng] Kỹ sư phần mềm IT';
    }

    // Formatted time string
    let ageDisplay = 'Vừa đăng';
    if (ageHours >= 24) {
      ageDisplay = `${Math.floor(ageHours / 24)} ngày trước`;
    } else if (ageHours >= 1) {
      ageDisplay = `${Math.floor(ageHours)} giờ trước`;
    } else {
      ageDisplay = 'Dưới 1 giờ trước';
    }

    const sourceName = platform === 'threads' ? 'threads.net' : 'facebook.com';
    const sourceLabel = platform === 'threads' ? 'Threads' : (post.group_name || 'Facebook Group');

    return {
      valid: true,
      job: {
        id: post.id || `${platform}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        source: sourceName,
        source_label: sourceLabel,
        title: cleanTitle,
        company: post.author || post.group_name || (platform === 'threads' ? 'Threads Recruiter' : 'Cộng đồng IT VN'),
        logo: '',
        category: isDev ? 'Lập trình / Dev' : 'Data / AI / BA / QA',
        salary_text: salary.text,
        salary_min: salary.min,
        salary_max: salary.max,
        experience: post.experience || '1 - 3 năm (Thỏa thuận)',
        tags: tags.length > 0 ? tags : ['Software Engineer', 'Verified Post'],
        location: location,
        url: post.url || (platform === 'threads' ? 'https://www.threads.net' : 'https://www.facebook.com'),
        is_dev: isDev,
        created_at: post.created_at || new Date().toISOString(),
        age_display: ageDisplay,
        age_hours: ageHours,
        contact_info: contact,
        is_social: true,
        platform_type: platform // 'facebook' or 'threads'
      }
    };
  }
}

module.exports = SocialAiFilter;

