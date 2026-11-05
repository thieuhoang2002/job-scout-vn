const Vieclam24hAdapter = require('./vieclam24h');
const ItviecAdapter = require('./itviec');
const CareervietAdapter = require('./careerviet');
const LinkedinAdapter = require('./linkedin');
const { ThreadsAdapter, FacebookRunner } = require('./social');

const adapters = {
  vieclam24h: new Vieclam24hAdapter(),
  itviec: new ItviecAdapter(),
  careerviet: new CareervietAdapter(),
  linkedin: new LinkedinAdapter(),
  threads: new ThreadsAdapter()
};

/**
 * Fetch all jobs with Fail-Fast strategy for Facebook:
 * If Facebook is requested, it MUST be executed first.
 * If Facebook fails or cannot be reached, the flow stops immediately.
 */
async function fetchAllJobs(options = {}) {
  let selectedSources = options.sources ? [...options.sources] : ['vieclam24h', 'itviec', 'careerviet', 'linkedin', 'threads'];
  const hasFacebook = selectedSources.includes('facebook') || (options.facebookGroups && options.facebookGroups.length > 0);
  const allJobs = [];

  // 1. Fail-Fast: Facebook First!
  if (hasFacebook) {
    console.log('\n🚪 [ẢI 1: FACEBOOK FIRST] Bắt đầu thực thi ải khó nhất: Facebook Groups...');
    if (!options.facebookGroups || options.facebookGroups.length === 0) {
      throw new Error('❌ BẠN ĐÃ CHỌN QUÉT FACEBOOK NHƯNG CHƯA CHỈ ĐỊNH LINK GROUP MỤC TIÊU!\n👉 Hãy cung cấp URL nhóm cụ thể qua cờ: --fb-groups "https://facebook.com/groups/..."');
    }

    const fbRunner = new FacebookRunner({
      profileEmail: options.facebookEmail,
      profileName: options.facebookProfile
    });
    try {
      const fbJobs = await fbRunner.run({
        targetGroups: options.facebookGroups,
        onProgress: options.onProgress
      });
      allJobs.push(...fbJobs);
      console.log(`✅ [Ải Facebook ĐÃ QUA] Đã bóc tách thành công ${fbJobs.length} việc làm đạt chuẩn từ Facebook.`);
    } catch (err) {
      console.error(`\n🚨 [DỪNG TIẾN TRÌNH] Ải Facebook không vượt qua được: ${err.message}`);
      console.error('👉 Hệ thống dừng lại theo cơ chế Fail-Fast (Ưu tiên ải khó nhất). Vui lòng thử lại sau khi hoàn tất phiên đăng nhập.');
      throw err; // Stop everything!
    }

    // Remove facebook from regular list so it won't re-run
    selectedSources = selectedSources.filter(s => s !== 'facebook');
  }

  // 2. Nếu đã qua ải Facebook (hoặc không yêu cầu Facebook), chạy tiếp các nguồn còn lại
  for (const src of selectedSources) {
    if (adapters[src]) {
      try {
        const jobs = await adapters[src].fetchJobs(options);
        allJobs.push(...jobs);
      } catch (err) {
        console.error(`Lỗi cào từ nguồn ${src}:`, err.message);
      }
    }
  }

  return allJobs;
}

module.exports = {
  adapters,
  fetchAllJobs
};
