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
    const candidateExp = profile.experience_years || 1.0;

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
      { name: 'Python / Automation', re: /(python|scraping|crawl|etl|data pipeline|fastapi)/i, check: candidateSkills.some(s => s.includes('python') || s.includes('scraping') || s.includes('selenium')) },
      { name: 'PHP / Laravel / WordPress', re: /(php|laravel|wordpress)/i, check: candidateSkills.some(s => s.includes('php') || s.includes('laravel') || s.includes('wordpress')) },
      { name: 'Golang', re: /(golang|go lang|gin|fiber)/i, check: candidateSkills.some(s => s.includes('golang') || s.includes('go')) },
      { name: 'Java / Spring', re: /(java|spring|springboot|spring boot)/i, check: candidateSkills.some(s => s.includes('java')) },
      { name: 'SQL / Database', re: /(sql|postgresql|postgres|mysql|mongodb|database|dữ liệu|redis)/i, check: candidateSkills.some(s => s.includes('sql') || s.includes('postgresql') || s.includes('mongodb') || s.includes('redis')) },
      { name: 'AI / RAG / LLM', re: /(ai|trí tuệ nhân tạo|rag|gemini|llm|giải pháp ai|langchain)/i, check: candidateSkills.some(s => s.includes('ai') || s.includes('rag') || s.includes('gemini') || s.includes('llm')) },
      { name: 'DevOps / Docker / K8s', re: /(docker|k8s|kubernetes|aws|ci\/cd|devops)/i, check: candidateSkills.some(s => s.includes('docker') || s.includes('kubernetes') || s.includes('aws') || s.includes('ci/cd')) },
      { name: 'QA / Automation Test', re: /(tester|qc|qa|automation test|playwright|selenium)/i, check: candidateSkills.some(s => s.includes('tester') || s.includes('qa') || s.includes('qc') || s.includes('playwright')) }
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

    if (jobExp.includes('không yêu cầu') || jobExp.includes('dưới 1 năm')) {
      score += 15;
      reasons.push('Kinh nghiệm: Không yêu cầu / Dưới 1 năm (Dư sức đáp ứng, +15đ)');
    } else if (jobExp.includes('1 năm') || jobExp.includes('1 - 2 năm')) {
      score += 20;
      reasons.push('Kinh nghiệm: 1-2 năm (Điểm rơi phù hợp, +20đ)');
    } else if (jobExp.includes('2 năm')) {
      score += (candidateExp >= 1.5 ? 15 : 8);
      reasons.push('Kinh nghiệm: 2 năm (Ứng tuyển tốt nhờ dự án thực chiến, +15đ)');
    } else if (jobExp.includes('3 năm') || jobExp.includes('5 năm')) {
      if (candidateExp >= 2.5) {
        score += 20;
        reasons.push('Kinh nghiệm: 3-5 năm (Thâm niên ứng viên hoàn toàn đáp ứng, +20đ)');
      } else {
        score -= 15;
        reasons.push('Kinh nghiệm: 3-5 năm (Yêu cầu thâm niên cao, -15đ)');
      }
    }

    // 4. Role Level fit
    if (jobText.includes('intern') || jobText.includes('thực tập sinh')) {
      score += (candidateExp < 1.0 ? 15 : -10);
    } else if (jobText.includes('junior')) {
      score += (candidateExp <= 2.0 ? 15 : 5);
      reasons.push('Cấp bậc: Junior (+15đ)');
    } else if (jobText.includes('senior') || jobText.includes('trưởng nhóm')) {
      if (candidateExp >= 3.0) {
        score += 15;
        reasons.push('Cấp bậc: Senior (Kinh nghiệm thâm niên khớp chuẩn, +15đ)');
      } else {
        score -= 15;
        reasons.push('Cấp bậc: Senior (Yêu cầu thâm niên cao, -15đ)');
      }
    }

    // 5. Freshness bonus for social recruitment posts (< 72h)
    if (job.is_social) {
      score += 5;
      reasons.push('Nguồn Mạng Xã Hội mới đăng (< 72h, tỷ lệ phản hồi nhanh, +5đ)');
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
