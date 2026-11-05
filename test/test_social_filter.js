const assert = require('assert');
const SocialAiFilter = require('../src/adapters/social/social_ai_filter');

function runTests() {
  const filter = new SocialAiFilter();
  let passed = 0;

  console.log('🧪 Bắt đầu kiểm thử SocialAiFilter (Threads)...\n');

  // Test 1: Age Filter (< 72h)
  const freshPost = {
    text: '[Tuyển dụng] Cần tìm 2 bạn Frontend ReactJS / Next.js làm việc tại Q1 HCM hoặc Remote. Lương 18 - 25 triệu. CV gửi về hr@techcorp.vn',
    time: '4 giờ trước',
    author: '@thao_tech_hr'
  };
  const res1 = filter.filterAndNormalize(freshPost, 'threads');
  assert.strictEqual(res1.valid, true, 'Bài 4 giờ trước phải hợp lệ');
  assert.strictEqual(res1.job.platform_type, 'threads');
  assert.ok(res1.job.tags.includes('React'), 'Phải nhận diện tag React');
  console.log('✅ Test 1 Passed: Bài đăng < 72h được duyệt chính xác');
  passed++;

  // Test 2: Reject posts older than 3 days (> 72h)
  const oldPost = {
    text: '[Tuyển dụng] Tuyển Senior Golang Developer lương $2500, liên hệ hr@global.com',
    time: '5 ngày trước'
  };
  const res2 = filter.filterAndNormalize(oldPost, 'threads');
  assert.strictEqual(res2.valid, false, 'Bài 5 ngày trước phải bị từ chối');
  assert.ok(res2.reason.includes('quá hạn'), 'Lý do phải ghi rõ quá hạn');
  console.log('✅ Test 2 Passed: Bài đăng > 72h (> 3 ngày) bị chặn chuẩn xác');
  passed++;

  // Test 3: Reject course marketing (Bán khoá học lùa gà)
  const coursePost = {
    text: 'Cơ hội đổi ngành! Khóa học Bootcamp lập trình Fullstack từ Zero cam kết việc làm sau 6 tháng! Học phí ưu đãi giảm 50% chỉ hôm nay. Đăng ký ngay!',
    time: '2 giờ trước'
  };
  const res3 = filter.filterAndNormalize(coursePost, 'threads');
  assert.strictEqual(res3.valid, false, 'Bài bán khoá học phải bị từ chối');
  assert.ok(res3.reason.includes('khoá học'), 'Phải gắn cờ bán khoá học');
  console.log('✅ Test 3 Passed: Bài quảng cáo bán khoá học bị loại bỏ');
  passed++;

  // Test 4: Reject fake task / scam / việc nhẹ lương cao
  const scamPost = {
    text: 'Tuyển CTV làm việc tại nhà, nhiệm vụ shopee like video kiếm 300k - 500k/ngày, không cần kinh nghiệm. Inbox nhận task ngay!',
    time: '1 giờ trước'
  };
  const res4 = filter.filterAndNormalize(scamPost, 'threads');
  assert.strictEqual(res4.valid, false, 'Bài lừa đảo nhiệm vụ phải bị từ chối');
  assert.ok(res4.reason.includes('lừa đảo'), 'Phải gắn cờ scam');
  console.log('✅ Test 4 Passed: Bài scam nhiệm vụ bị nhận diện và chặn');
  passed++;

  // Test 5: Threads normalization & contact extraction
  const threadsPost = {
    text: 'Bên mình đang mở tuyển Backend Golang / Java Spring Boot (Mid-Senior), yêu cầu microservices, PostgreSQL, Kafka. Range $1500 - $2800. Ping telegram @tech_lead_vn hoặc mail job@innovate.co',
    time: '1 ngày trước',
    author: '@quang_dev',
    url: 'https://www.threads.net/@quang_dev/post/12345'
  };
  const res5 = filter.filterAndNormalize(threadsPost, 'threads');
  assert.strictEqual(res5.valid, true, 'Bài Threads hợp lệ phải qua');
  assert.strictEqual(res5.job.platform_type, 'threads');
  assert.ok(res5.job.tags.includes('Golang'));
  assert.ok(res5.job.tags.includes('Java'));
  assert.strictEqual(res5.job.contact_info.email, 'job@innovate.co');
  assert.strictEqual(res5.job.contact_info.telegram, '@tech_lead_vn');
  console.log('✅ Test 5 Passed: Bóc tách bài Threads thành công với đầy đủ contact info');
  passed++;

  console.log(`\n🎉 Tất cả ${passed}/5 bài test SocialAiFilter đã vượt qua!\n`);
}

runTests();
