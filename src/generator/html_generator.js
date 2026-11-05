const fs = require('fs');
const path = require('path');

/**
 * Standalone HTML Dashboard Generator
 * Embeds all matched job data, multi-platform analytics (5 Zero-Login sources), and candidate profile
 * into a single interactive HTML file requiring zero backend server.
 */
class HtmlGenerator {
  generate({ profile, matchedJobs, stats, spotlightJobs }) {
    const salaryUnder10 = matchedJobs.filter(m => m.job.salary_max > 0 && m.job.salary_max < 10000000).length;
    const salary10to15 = matchedJobs.filter(m => m.job.salary_min >= 10000000 && m.job.salary_max <= 15000000).length;
    const salary15to25 = matchedJobs.filter(m => (m.job.salary_min >= 15000000 || m.job.salary_max > 15000000) && m.job.salary_max <= 25000000).length;
    const salary25to40 = matchedJobs.filter(m => m.job.salary_max > 25000000).length;
    const salaryNegotiable = matchedJobs.filter(m => m.job.salary_min === 0 && m.job.salary_max === 0).length;

    // Platform breakdown stats (5 Zero-Login sources)
    const itviecCount = matchedJobs.filter(m => m.job.source === 'itviec.com').length;
    const linkedinCount = matchedJobs.filter(m => m.job.source === 'linkedin.com').length;
    const careervietCount = matchedJobs.filter(m => m.job.source === 'careerviet.vn').length;
    const vieclam24hCount = matchedJobs.filter(m => m.job.source === 'vieclam24h.vn').length;
    const threadsCount = matchedJobs.filter(m => m.job.source === 'threads.net').length;

    const skillsHtml = (profile.skills || []).map(s => 
      `<span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs">${s}</span>`
    ).join(' ');

    function getPlatformBadge(source) {
      if (source === 'itviec.com') {
        return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">🔴 ITViec</span>';
      }
      if (source === 'linkedin.com') {
        return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">🔵 LinkedIn</span>';
      }
      if (source === 'careerviet.vn') {
        return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">🟠 CareerViet</span>';
      }
      if (source === 'threads.net') {
        return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">🧵 Threads</span>';
      }
      return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">🟣 ViệcLàm24h</span>';
    }

    const spotlightHtml = (spotlightJobs || []).map((item, idx) => {
      const j = item.job;
      return `
        <div class="bg-white rounded-2xl border-2 border-emerald-400 shadow-md p-5 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
            Khớp ${item.score}%
          </div>
          <div class="space-y-3">
            <div class="pr-14">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">#${idx + 1} Ưu tiên nộp</span>
                ${getPlatformBadge(j.source)}
                ${j.is_social ? `<span class="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">⏱️ ${j.age_display || '< 72h'}</span>` : ''}
              </div>
              <h3 class="text-base font-bold text-slate-900 mt-1 line-clamp-1">${j.title}</h3>
              <p class="text-xs text-slate-600 font-medium truncate">${j.company}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span class="text-slate-400 block text-[10px]">Mức lương</span>
                <span class="font-extrabold text-emerald-600 text-sm">${j.salary_text}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-400 block text-[10px]">Kinh nghiệm</span>
                <span class="font-bold text-slate-700">${j.experience}</span>
              </div>
            </div>
            ${item.matches.length > 0 ? `
              <p class="text-xs text-slate-600 leading-relaxed bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                <strong>Thế mạnh khớp:</strong> ${item.matches.join(', ')}
              </p>
            ` : ''}
            ${j.contact_info && (j.contact_info.email || j.contact_info.telegram) ? `
              <div class="text-[11px] bg-slate-100 p-2 rounded-lg text-slate-700 flex items-center justify-between">
                <span>💬 Liên hệ: <strong>${j.contact_info.email || j.contact_info.telegram}</strong></span>
              </div>
            ` : ''}
          </div>
          <div class="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">📍 ${j.location}</span>
            <a href="${j.url}" target="_blank" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition">
              Nộp Hồ Sơ Ngay →
            </a>
          </div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Phân Tích Việc Làm IT Đa Nền Tảng | Job Scout VN</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

  <!-- HEADER -->
  <header class="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
          JS
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-bold text-slate-900 leading-tight">Job Scout VN — Radar Việc Làm Đa Nền Tảng</h1>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">5 Nền Tảng (Zero-Login)</span>
          </div>
          <p class="text-xs text-slate-500">Quét đồng thời từ ITViec, LinkedIn, CareerViet, ViệcLàm24h & Threads (100% không cần tài khoản)</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Đã quét ${matchedJobs.length} Việc Làm
        </span>
        <a href="#job-list" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm">
          Khám Phá Jobs
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <!-- CANDIDATE PROFILE CARD -->
    <section class="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-2xl font-extrabold text-white">${profile.name || 'Ứng viên CNTT'}</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ${profile.experience_years ? profile.experience_years + ' Năm Kinh Nghiệm' : 'Đang tìm việc'}
            </span>
          </div>
          <p class="text-sm text-slate-300 mt-1 max-w-3xl">${profile.summary || profile.headline || 'Software Engineer'}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-center">
            <span class="text-[11px] text-slate-400 block font-medium">Việc Khớp Cao</span>
            <span class="text-xl font-black text-emerald-400">${stats.high_match_count || 0} Jobs</span>
          </div>
          <div class="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-center">
            <span class="text-[11px] text-slate-400 block font-medium">Lập Trình Thuần</span>
            <span class="text-xl font-black text-blue-400">${stats.dev_count || 0} Jobs</span>
          </div>
        </div>
      </div>
      <div class="pt-6">
        <h3 class="text-xs uppercase font-bold tracking-wider text-blue-400 mb-2">Kỹ Năng & Công Nghệ Bóc Tách:</h3>
        <div class="flex flex-wrap gap-1.5">${skillsHtml}</div>
      </div>
    </section>

    <!-- PLATFORM ANALYSIS METRICS (5 ZERO-LOGIN SOURCES) -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            🌐 Phân Tích 5 Nền Tảng (Zero-Login)
          </span>
          <h2 class="text-xl font-extrabold text-slate-900 mt-1">Cơ Cấu Việc Làm Theo Từng Nền Tảng Tuyển Dụng</h2>
          <p class="text-xs text-slate-500">So sánh nguồn việc giữa 4 cổng tuyển dụng lớn và mạng xã hội công nghệ Threads (< 72h)</p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- ITViec -->
        <div class="bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition bg-gradient-to-br from-red-50/30 to-transparent">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-red-600 uppercase tracking-wider">ITViec</span>
            <span class="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">Product & Outsource</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-red-600">${itviecCount}</span>
            <span class="text-xs text-slate-500">jobs</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">Chuyên sâu Software Dev, kiểm duyệt chất lượng cao.</p>
        </div>

        <!-- LinkedIn -->
        <div class="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm hover:shadow-md transition bg-gradient-to-br from-sky-50/30 to-transparent">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-sky-700 uppercase tracking-wider">LinkedIn</span>
            <span class="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">MNCs & Big Tech</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-sky-600">${linkedinCount}</span>
            <span class="text-xs text-slate-500">jobs</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">Tập đoàn đa quốc gia, môi trường tiếng Anh, mức lương USD.</p>
        </div>

        <!-- CareerViet -->
        <div class="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition bg-gradient-to-br from-amber-50/30 to-transparent">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">CareerViet</span>
            <span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Ngân hàng & FDI</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-amber-600">${careervietCount}</span>
            <span class="text-xs text-slate-500">jobs</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">Ngân hàng, tài chính & doanh nghiệp FDI chế độ phúc lợi lớn.</p>
        </div>

        <!-- Vieclam24h -->
        <div class="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition bg-gradient-to-br from-indigo-50/30 to-transparent">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider">ViệcLàm24h</span>
            <span class="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">SME Nội Địa</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-indigo-600">${vieclam24hCount}</span>
            <span class="text-xs text-slate-500">jobs</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">Doanh nghiệp nội địa, nhiều cơ hội Junior/Intern qua Next.js SSR.</p>
        </div>

        <!-- Threads -->
        <div class="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition bg-gradient-to-br from-zinc-50 to-transparent">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 uppercase tracking-wider">Threads (Meta)</span>
            <span class="text-[10px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">&lt; 72h Fresh</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-black text-zinc-900">${threadsCount}</span>
            <span class="text-xs text-slate-500">jobs</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">Mạng lưới Tech Lead & HR công nghệ tuyển trực tiếp (< 3 ngày).</p>
        </div>
      </div>
    </section>

    <!-- SPOTLIGHT TOP MATCHES -->
    <section class="space-y-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          🎯 Top Khuyến Nghị
        </span>
        <h2 class="text-xl font-extrabold text-slate-900 mt-1">Các Vị Trí Có Tỷ Lệ Đậu Cao Nhất</h2>
        <p class="text-xs text-slate-500">Được chấm điểm tương thích kết hợp giữa 5 nền tảng tuyển dụng lớn</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${spotlightHtml}
      </div>
    </section>

    <!-- CHARTS -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-base font-bold text-slate-900 mb-1">Phân Bổ Dải Lương</h3>
        <p class="text-xs text-slate-500 mb-4">Mức thu nhập tháng theo các kênh</p>
        <div class="h-64"><canvas id="salaryChart"></canvas></div>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-base font-bold text-slate-900 mb-1">Thị Phần Theo Nền Tảng</h3>
        <p class="text-xs text-slate-500 mb-4">Tỷ lệ số lượng công việc giữa 5 nguồn</p>
        <div class="h-64"><canvas id="platformChart"></canvas></div>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-base font-bold text-slate-900 mb-1">Cơ Cấu Vị Trí Thực Tế</h3>
        <p class="text-xs text-slate-500 mb-4">Phân hóa Dev vs Helpdesk & Data</p>
        <div class="h-64"><canvas id="categoryChart"></canvas></div>
      </div>
    </section>

    <!-- ALL JOBS LIST WITH PLATFORM FILTERS -->
    <section id="job-list" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Danh Sách Toàn Bộ Việc Làm</h2>
          <p class="text-xs text-slate-500" id="resultCount">Hiển thị ${matchedJobs.length} công việc</p>
        </div>
        <div class="w-full md:w-80 relative">
          <input type="text" id="searchInput" placeholder="Tìm theo chức danh, công ty, kỹ năng..." class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <!-- FILTER BUTTONS -->
      <div class="space-y-3">
        <!-- Row 1: Filter by Platform -->
        <div class="flex flex-wrap gap-2 items-center text-xs">
          <span class="text-slate-400 font-semibold mr-1">Lọc theo sàn:</span>
          <button onclick="setPlatformFilter('all')" class="platform-filter-btn px-3 py-1.5 rounded-lg font-bold bg-slate-900 text-white shadow-sm" data-platform="all">🌐 Tất cả (${matchedJobs.length})</button>
          <button onclick="setPlatformFilter('itviec.com')" class="platform-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" data-platform="itviec.com">🔴 ITViec (${itviecCount})</button>
          <button onclick="setPlatformFilter('linkedin.com')" class="platform-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100" data-platform="linkedin.com">🔵 LinkedIn (${linkedinCount})</button>
          <button onclick="setPlatformFilter('careerviet.vn')" class="platform-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100" data-platform="careerviet.vn">🟠 CareerViet (${careervietCount})</button>
          <button onclick="setPlatformFilter('vieclam24h.vn')" class="platform-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100" data-platform="vieclam24h.vn">🟣 ViệcLàm24h (${vieclam24hCount})</button>
          <button onclick="setPlatformFilter('threads.net')" class="platform-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300 hover:bg-zinc-200" data-platform="threads.net">🧵 Threads (${threadsCount})</button>
        </div>

        <!-- Row 2: Filter by Criteria -->
        <div class="flex flex-wrap gap-2 items-center text-xs pt-2 border-t border-slate-100">
          <span class="text-slate-400 font-semibold mr-1">Tiêu chí:</span>
          <button onclick="setCriteriaFilter('topMatch')" class="criteria-filter-btn px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-white shadow-sm" data-criteria="topMatch">🎯 Đề Xuất Phù Hợp (${stats.high_match_count || 0})</button>
          <button onclick="setCriteriaFilter('dev')" class="criteria-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200" data-criteria="dev">⭐ Việc Dev / Lập trình (${stats.dev_count || 0})</button>
          <button onclick="setCriteriaFilter('all')" class="criteria-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200" data-criteria="all">Tất cả</button>
          <button onclick="setCriteriaFilter('highSalary')" class="criteria-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200" data-criteria="highSalary">💰 Lương >= 15 Triệu</button>
          <button onclick="setCriteriaFilter('socialOnly')" class="criteria-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200" data-criteria="socialOnly">⚡ Threads Mới Đăng (&lt; 72h)</button>
        </div>
      </div>

      <div id="jobsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </section>

  </main>

  <script>
    const matchedData = ${JSON.stringify(matchedJobs)};

    // Charts
    new Chart(document.getElementById('salaryChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Dưới 10M', '10 - 15M', '15 - 25M', '25 - 40M', 'Thỏa thuận'],
        datasets: [{
          data: [${salaryUnder10}, ${salary10to15}, ${salary15to25}, ${salary25to40}, ${salaryNegotiable}],
          backgroundColor: ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#cbd5e1'],
          borderRadius: 8
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById('platformChart').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['ITViec', 'LinkedIn', 'CareerViet', 'ViệcLàm24h', 'Threads'],
        datasets: [{
          data: [${itviecCount}, ${linkedinCount}, ${careervietCount}, ${vieclam24hCount}, ${threadsCount}],
          backgroundColor: ['#ef4444', '#0284c7', '#f59e0b', '#6366f1', '#18181b']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    new Chart(document.getElementById('categoryChart').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Lập trình / Dev', 'IT Helpdesk', 'Data / AI / BA', 'Khác'],
        datasets: [{
          data: [${stats.dev_count || 0}, ${stats.helpdesk_count || 0}, ${stats.data_count || 0}, 10],
          backgroundColor: ['#2563eb', '#f59e0b', '#06b6d4', '#94a3b8']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    let currentPlatform = 'all';
    let currentCriteria = 'topMatch';
    let searchQuery = '';

    function getPlatformBadge(source) {
      if (source === 'itviec.com') return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">🔴 ITViec</span>';
      if (source === 'linkedin.com') return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">🔵 LinkedIn</span>';
      if (source === 'careerviet.vn') return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">🟠 CareerViet</span>';
      if (source === 'threads.net') return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">🧵 Threads</span>';
      return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">🟣 ViệcLàm24h</span>';
    }

    function renderJobs() {
      const container = document.getElementById('jobsContainer');
      const countEl = document.getElementById('resultCount');

      let filtered = matchedData.filter(item => {
        const j = item.job;
        // Platform filter
        if (currentPlatform !== 'all' && j.source !== currentPlatform) return false;

        // Criteria filter
        if (currentCriteria === 'topMatch' && item.score < 70) return false;
        if (currentCriteria === 'dev' && !j.is_dev) return false;
        if (currentCriteria === 'highSalary' && j.salary_max < 15000000 && j.salary_min < 15000000) return false;
        if (currentCriteria === 'socialOnly' && !j.is_social) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const match = j.title.toLowerCase().includes(q) ||
                        j.company.toLowerCase().includes(q) ||
                        (j.tags && j.tags.some(t => t.toLowerCase().includes(q))) ||
                        j.location.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      countEl.innerText = 'Hiển thị ' + filtered.length + ' / ' + matchedData.length + ' công việc';

      if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 font-semibold">Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại</div>';
        return;
      }

      container.innerHTML = filtered.map(item => {
        const j = item.job;
        const score = item.score;
        const isDev = j.is_dev;
        const scoreBadge = score >= 80 
          ? '<span class="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded shadow-sm">Khớp ' + score + '%</span>'
          : '<span class="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Khớp ' + score + '%</span>';

        const socialBadge = j.is_social 
          ? '<span class="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">⏱️ ' + (j.age_display || '< 72h') + '</span>'
          : '';

        const catBadge = '<span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ' + (isDev ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200') + '">' + j.category + '</span>';

        const matchBox = item.matches.length > 0
          ? '<div class="text-[11px] bg-blue-50 p-2 rounded text-blue-900"><strong>Khớp:</strong> ' + item.matches.join(', ') + '</div>'
          : '';

        const contactBox = (j.contact_info && (j.contact_info.email || j.contact_info.telegram))
          ? '<div class="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-600 flex items-center justify-between"><span>💬 ' + (j.contact_info.email || j.contact_info.telegram) + '</span><span class="text-[9px] text-emerald-600 font-semibold">🛡️ Không spam</span></div>'
          : '';

        return '<div class="bg-white rounded-xl border ' + (score >= 80 ? 'border-blue-300 ring-1 ring-blue-100 shadow-sm' : 'border-slate-200') + ' p-4 flex flex-col justify-between hover:shadow-md transition group">' +
          '<div class="space-y-3">' +
            '<div class="flex items-start gap-3">' +
              '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center gap-1.5 mb-1 flex-wrap">' +
                  getPlatformBadge(j.source) + ' ' +
                  scoreBadge + ' ' +
                  socialBadge + ' ' +
                  catBadge +
                '</div>' +
                '<h3 class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">' +
                  '<a href="' + j.url + '" target="_blank">' + j.title + '</a>' +
                '</h3>' +
                '<p class="text-xs text-slate-500 truncate mt-0.5">' + j.company + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-xs">' +
              '<div><span class="text-slate-400 block text-[10px]">Lương</span><span class="font-bold text-emerald-600">' + j.salary_text + '</span></div>' +
              '<div class="text-right"><span class="text-slate-400 block text-[10px]">Kinh nghiệm</span><span class="font-medium text-slate-700">' + j.experience + '</span></div>' +
            '</div>' +
            matchBox +
            contactBox +
          '</div>' +
          '<div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">' +
            '<span class="text-slate-400 text-[11px] truncate max-w-[140px]">📍 ' + j.location + '</span>' +
            '<a href="' + j.url + '" target="_blank" class="px-3 py-1.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">Ứng tuyển →</a>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function setPlatformFilter(platform) {
      currentPlatform = platform;
      document.querySelectorAll('.platform-filter-btn').forEach(btn => {
        if (btn.dataset.platform === platform) {
          btn.className = 'platform-filter-btn px-3 py-1.5 rounded-lg font-bold bg-slate-900 text-white shadow-sm';
        } else {
          btn.className = 'platform-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';
        }
      });
      renderJobs();
    }

    function setCriteriaFilter(criteria) {
      currentCriteria = criteria;
      document.querySelectorAll('.criteria-filter-btn').forEach(btn => {
        if (btn.dataset.criteria === criteria) {
          if (criteria === 'topMatch') {
            btn.className = 'criteria-filter-btn px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-white shadow-sm';
          } else {
            btn.className = 'criteria-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-900 text-white shadow-sm';
          }
        } else {
          btn.className = 'criteria-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';
        }
      });
      renderJobs();
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderJobs();
    });

    renderJobs();
  </script>
</body>
</html>`;
  }
}

module.exports = HtmlGenerator;
