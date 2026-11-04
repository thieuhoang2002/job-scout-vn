/**
 * Compatibility Match Engine
 * Objectively scores jobs against candidate profile and highlights optimal matches.
 */
class MatchEngine {
  constructor(options = {}) {
    this.minScoreForSpotlight = options.minScoreForSpotlight || 75;
  }

  scoreJob(job, profile) {
    let score = 0;
    const matches = [];
    const reasons = [];

    const jobText = (job.title + ' ' + (job.tags || []).join(' ') + ' ' + job.category).toLowerCase();
    const candidateSkills = (profile.skills || []).map(s => s.toLowerCase());

    // 1. Category relevance
    if (job.is_dev) {
      score += 40;
      reasons.push('Vị trí Lập trình / Kỹ sư phần mềm đúng chuyên ngành (+40đ)');
    } else if (job.category === 'Data / AI / BA / QA') {
      score += 25;
      reasons.push('Vị trí Data / AI / Triển khai giải pháp (+25đ)');
    } else if (job.category === 'IT Helpdesk / System') {
      score += 10;
      reasons.push('Vị trí IT System / Helpdesk (Phù hợp làm bước đệm, +10đ)');
    }

    // 2. Candidate skill intersections
    const candidateTechPatterns = [
      { name: 'React / Next.js', re: /(react|next\.js|frontend|giao diện)/i, check: candidateSkills.some(s => s.includes('react') || s.includes('next')) },
      { name: 'TypeScript / JavaScript', re: /(typescript|javascript|frontend)/i, check: candidateSkills.some(s => s.includes('typescript') || s.includes('javascript')) },
      { name: 'Node.js / Express', re: /(node|node\.js|backend)/i, check: candidateSkills.some(s => s.includes('node')) },
      { name: 'C# / .NET', re: /(c#|\.net|dotnet|csharp)/i, check: candidateSkills.some(s => s.includes('c#') || s.includes('.net')) },
      { name: 'Python / Automation', re: /(python|scraping|crawl|etl|data pipeline)/i, check: candidateSkills.some(s => s.includes('python') || s.includes('scraping') || s.includes('selenium')) },
      { name: 'PHP / Laravel / WordPress', re: /(php|laravel|wordpress)/i, check: candidateSkills.some(s => s.includes('php') || s.includes('laravel') || s.includes('wordpress')) },
      { name: 'Golang', re: /(golang|go lang)/i, check: candidateSkills.some(s => s.includes('golang')) },
      { name: 'Java / Spring', re: /(java|spring)/i, check: candidateSkills.some(s => s.includes('java')) },
      { name: 'SQL / Database', re: /(sql|postgresql|mysql|mongodb|database|dữ liệu)/i, check: candidateSkills.some(s => s.includes('sql') || s.includes('postgresql') || s.includes('mongodb')) },
      { name: 'AI / RAG / LLM', re: /(ai|trí tuệ nhân tạo|rag|gemini|llm|giải pháp ai)/i, check: candidateSkills.some(s => s.includes('ai') || s.includes('rag') || s.includes('gemini')) }
    ];

    for (const pattern of candidateTechPatterns) {
      if (pattern.check && pattern.re.test(jobText)) {
        score += 15;
        matches.push(pattern.name);
        reasons.push(`Khớp công nghệ: ${pattern.name} (+15đ)`);
      }
    }

    // 3. Experience fit
    const jobExp = (job.experience || '').toLowerCase();
    const candidateExp = profile.experience_years || 1.0;

    if (jobExp.includes('không yêu cầu') || jobExp.includes('dưới 1 năm')) {
      score += 15;
      reasons.push('Kinh nghiệm: Không yêu cầu / Dưới 1 năm (Dư sức đáp ứng, +15đ)');
    } else if (jobExp.includes('1 năm')) {
      score += 20;
      reasons.push('Kinh nghiệm: 1 năm (Điểm rơi phù hợp, +20đ)');
    } else if (jobExp.includes('2 năm')) {
      score += (candidateExp >= 1.0 ? 12 : 5);
      reasons.push('Kinh nghiệm: 2 năm (Ứng tuyển tốt nhờ dự án thực chiến, +12đ)');
    } else if (jobExp.includes('3 năm') || jobExp.includes('5 năm')) {
      score -= 15;
      reasons.push('Kinh nghiệm: 3-5 năm (Yêu cầu thâm niên cao, -15đ)');
    }

    // 4. Role Level fit
    if (jobText.includes('intern') || jobText.includes('thực tập sinh')) {
      score += 5;
    } else if (jobText.includes('junior')) {
      score += 15;
      reasons.push('Cấp bậc: Junior (Chuẩn vị trí mục tiêu, +15đ)');
    } else if (jobText.includes('trưởng nhóm') || jobText.includes('lead') || jobText.includes('manager')) {
      score -= 20;
      reasons.push('Cấp bậc: Lead/Manager (Yêu cầu quản lý, -20đ)');
    }

    const finalScore = Math.min(100, Math.max(0, score));

    return {
      job,
      score: finalScore,
      matches: [...new Set(matches)],
      reasons
    };
  }

  matchAll(jobs, profile) {
    const scored = jobs.map(j => this.scoreJob(j, profile));
    scored.sort((a, b) => b.score - a.score);

    const spotlight = scored.filter(s => s.score >= this.minScoreForSpotlight).slice(0, 5);

    return {
      profile,
      total_jobs: jobs.length,
      matched_jobs: scored,
      spotlight_jobs: spotlight,
      stats: {
        dev_count: jobs.filter(j => j.is_dev).length,
        helpdesk_count: jobs.filter(j => j.category === 'IT Helpdesk / System').length,
        data_count: jobs.filter(j => j.category === 'Data / AI / BA / QA').length,
        sales_count: jobs.filter(j => j.category === 'Sales / Tư vấn IT').length,
        high_match_count: scored.filter(s => s.score >= this.minScoreForSpotlight).length
      }
    };
  }
}

module.exports = MatchEngine;
