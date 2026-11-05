#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { fetchAllJobs } = require('./src/adapters');
const ProfileParser = require('./src/parsers/profile_parser');
const MatchEngine = require('./src/engine/matcher');
const HtmlGenerator = require('./src/generator/html_generator');

function printHelp() {
  console.log(`
🎯 Job Scout VN - Personal AI Job Hunter & Reality Checker
=============================================================
Hỗ trợ 5 nền tảng Zero-Login (Mặc định) + 1 Cổng Facebook Targeted (Ải đầu tiên):
  🔴 ITViec.com         (Product & Startups - Zero-Login)
  🔵 LinkedIn Jobs      (MNCs & Big Tech - Zero-Login Guest Search)
  🟠 CareerViet.vn      (Ngân hàng & Tập đoàn FDI - Zero-Login)
  🟣 ViệcLàm24h.vn      (SME & Doanh nghiệp nội địa - Zero-Login)
  🧵 Threads (Meta)     (Kỹ sư & Tech Lead tuyển dụng < 72h - Zero-Login)
  📘 Facebook Groups    (Chỉ định nhóm cụ thể, Profile riêng, Fail-Fast)

Sử dụng:
  node cli.js [options]

Các tùy chọn:
  --url <url>           Đường dẫn website Portfolio của ứng viên (ví dụ: https://myportfolio.dev)
  --cv <file>           Đường dẫn file CV (.md, .txt, .json)
  --sources <list>      Danh sách nền tảng quét (mặc định: vieclam24h,itviec,careerviet,linkedin,threads)
  --fb-groups <urls>    Danh sách link Group Facebook mục tiêu (cách nhau bởi dấu phẩy)
  --pages <number>      Số trang cần quét trên các sàn lớn (mặc định: 6 trang)
  --output <file>       Đường dẫn file HTML xuất ra (mặc định: ./output/dashboard.html)
  --help                Hiển thị hướng dẫn này

Ví dụ:
  # 1. Quét nhanh 5 nguồn Zero-Login:
  node cli.js --url https://myportfolio.dev

  # 2. Quét chuyên biệt có Facebook (Facebook First):
  node cli.js --url https://myportfolio.dev --sources facebook,itviec,linkedin --fb-groups "https://facebook.com/groups/nodejsvietnam"
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  let profileInput = null;
  let maxPages = 6;
  let selectedSources = null;
  let facebookGroups = [];
  let outputPath = path.join(__dirname, 'output', 'dashboard.html');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      profileInput = args[i + 1];
      i++;
    } else if (args[i] === '--cv' && args[i + 1]) {
      profileInput = args[i + 1];
      i++;
    } else if (args[i] === '--pages' && args[i + 1]) {
      maxPages = parseInt(args[i + 1], 10) || 6;
      i++;
    } else if (args[i] === '--sources' && args[i + 1]) {
      selectedSources = args[i + 1].split(',').map(s => s.trim().toLowerCase());
      i++;
    } else if (args[i] === '--fb-groups' && args[i + 1]) {
      facebookGroups = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = path.resolve(args[i + 1]);
      i++;
    }
  }

  // Fallback to sample profile if no input is provided
  if (!profileInput) {
    console.log('ℹ️ Không có tham số --url hoặc --cv. Đang sử dụng hồ sơ mẫu (examples/sample_cv.md)...');
    profileInput = path.join(__dirname, 'examples', 'sample_cv.md');
  }

  console.log('\n🚀 [1/4] Đang phân tích hồ sơ ứng viên...');
  const parser = new ProfileParser();
  let profile;
  try {
    profile = await parser.parse(profileInput);
    console.log(`✅ Đã bóc tách ứng viên: ${profile.name} (${profile.skills.length} kỹ năng nhận diện)`);
  } catch (err) {
    console.error(`❌ Lỗi đọc hồ sơ: ${err.message}`);
    process.exit(1);
  }

  console.log(`\n📡 [2/4] Đang quét thị trường việc làm (Áp dụng chiến lược Fail-Fast)...`);
  let jobs = [];
  try {
    jobs = await fetchAllJobs({
      maxPages,
      sources: selectedSources,
      facebookGroups,
      onProgress: (msg) => console.log(`   ${msg}`)
    });
  } catch (err) {
    console.error(`\n❌ Quá trình quét dữ liệu dừng lại: ${err.message}`);
    process.exit(1);
  }

  console.log(`✅ Đã quét thành công ${jobs.length} công việc thực tế.`);

  console.log('\n🧠 [3/4] Đang chấm điểm tương thích & lọc đề xuất...');
  const matcher = new MatchEngine();
  const matchResult = matcher.matchAll(jobs, profile);
  console.log(`✅ Có ${matchResult.spotlight_jobs.length} vị trí xuất sắc lọt vào danh sách Spotlight!`);

  console.log('\n🎨 [4/4] Đang khởi tạo Dashboard HTML tương tác...');
  const generator = new HtmlGenerator();
  const html = generator.generate({
    profile: matchResult.profile,
    matchedJobs: matchResult.matched_jobs,
    stats: matchResult.stats,
    spotlightJobs: matchResult.spotlight_jobs
  });

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`\n🎉 HOÀN TẤT! Dashboard đã được lưu tại:\n👉 ${outputPath}\n`);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
