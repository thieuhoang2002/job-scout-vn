const assert = require('assert');
const SocialAiFilter = require('../src/adapters/social/social_ai_filter');
const MatchEngine = require('../src/engine/matcher');
const ProfileParser = require('../src/parsers/profile_parser');
const HtmlGenerator = require('../src/generator/html_generator');

async function runTestSuite() {
  console.log('🧪 [Job Scout VN] Khởi chạy bộ kiểm thử toàn diện...\n');
  let passed = 0;

  // 1. Social Filter: Age Check
  const filter = new SocialAiFilter();
  const freshPost = { text: '[Tuyển] React Developer lương 20M, mail: hr@test.vn', time: '5 giờ trước' };
  const oldPost = { text: '[Tuyển] Java Developer lương 30M, mail: hr@test.vn', time: '4 ngày trước' };
  assert.strictEqual(filter.filterAndNormalize(freshPost, 'facebook').valid, true);
  assert.strictEqual(filter.filterAndNormalize(oldPost, 'facebook').valid, false);
  console.log('✅ 1. Kiểm thử tuổi bài đăng (< 72h / 3 ngày): Đạt chuẩn');
  passed++;

  // 2. Social Filter: Anti-Scam & Course Rejection
  const coursePost = { text: 'Khóa học bootcamp lập trình từ zero cam kết việc làm sau 3 tháng!', time: '1 giờ trước' };
  const scamPost = { text: 'Nhiệm vụ shopee xem video nhận 500k/ngày!', time: '1 giờ trước' };
  assert.strictEqual(filter.filterAndNormalize(coursePost, 'facebook').valid, false);
  assert.strictEqual(filter.filterAndNormalize(scamPost, 'threads').valid, false);
  console.log('✅ 2. Kiểm thử chống Scam & loại bỏ bài bán khóa học: Đạt chuẩn');
  passed++;

  // 3. Profile Parser
  const parser = new ProfileParser();
  const feCv = await parser.parse('./examples/test_cv_frontend.md');
  assert.strictEqual(feCv.name, 'Trần Minh Quân — Frontend Engineer');
  assert.ok(feCv.skills.includes('React'));
  console.log('✅ 3. Kiểm thử bóc tách hồ sơ CV (.md): Đạt chuẩn');
  passed++;

  // 4. Match Engine
  const matcher = new MatchEngine();
  const sampleJob = {
    id: 'test_1',
    title: 'Senior Frontend React Engineer',
    category: 'Lập trình / Dev',
    tags: ['React', 'TypeScript', 'Next.js'],
    experience: '2 năm kinh nghiệm',
    is_dev: true,
    is_social: true
  };
  const scored = matcher.scoreJob(sampleJob, feCv);
  assert.ok(scored.score >= 70, `Score (${scored.score}) phải >= 70 cho vị trí React khớp chuẩn`);
  console.log('✅ 4. Kiểm thử Chấm điểm Tương thích (Match Engine): Đạt chuẩn');
  passed++;

  // 5. HTML Generator
  const generator = new HtmlGenerator();
  const html = generator.generate({
    profile: feCv,
    matchedJobs: [scored],
    stats: { high_match_count: 1, dev_count: 1 },
    spotlightJobs: [scored]
  });
  assert.ok(html.includes('Job Scout VN'), 'HTML phải chứa tiêu đề Job Scout VN');
  assert.ok(html.includes('6 Kênh Tuyển Dụng'), 'HTML phải thể hiện 6 kênh tuyển dụng');
  console.log('✅ 5. Kiểm thử Khởi tạo Dashboard HTML (6 nền tảng): Đạt chuẩn');
  passed++;

  console.log(`\n🎉 HOÀN HẢO! Tất cả ${passed}/${passed} bài kiểm thử đã vượt qua thành công!\n`);
}

runTestSuite().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
