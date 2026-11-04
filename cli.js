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
Sử dụng:
  node cli.js [options]

Các tùy chọn:
  --url <url>        Đường dẫn website Portfolio của ứng viên (ví dụ: https://thhoang.io.vn)
  --cv <file>        Đường dẫn file CV (.md, .txt, .json)
  --pages <number>   Số trang cần quét (mặc định: 8 trang, ~150 việc làm)
  --output <file>    Đường dẫn file HTML xuất ra (mặc định: ./output/dashboard.html)
  --help             Hiển thị hướng dẫn này

Ví dụ:
  node cli.js --url https://thhoang.io.vn
  node cli.js --cv ./examples/sample_cv.md --pages 4
  node cli.js --cv ./examples/sample_profile.json
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  let profileInput = null;
  let maxPages = 8;
  let outputPath = path.join(__dirname, 'output', 'dashboard.html');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      profileInput = args[i + 1];
      i++;
    } else if (args[i] === '--cv' && args[i + 1]) {
      profileInput = args[i + 1];
      i++;
    } else if (args[i] === '--pages' && args[i + 1]) {
      maxPages = parseInt(args[i + 1], 10) || 8;
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

  console.log(`\n📡 [2/4] Đang quét thị trường việc làm (REA Scraper, ${maxPages} trang)...`);
  const jobs = await fetchAllJobs({
    maxPages,
    onProgress: (msg) => console.log(`   ${msg}`)
  });
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
