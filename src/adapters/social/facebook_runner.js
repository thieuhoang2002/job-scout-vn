const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');
const SocialAiFilter = require('./social_ai_filter');
const { humanDelay } = require('../../utils/delay');

/**
 * Facebook Targeted Runner (Dedicated Persistent Profile & Headful Automation)
 * 
 * Flow:
 * 1. Khởi chạy Chrome thực tế với Profile riêng biệt: ~/.job-scout-vn/browser_profile
 * 2. Kiểm tra trạng thái đăng nhập Facebook. Nếu chưa login, mở giao diện đợi người dùng login.
 * 3. Sau khi có session, truy cập chính xác các Group/Fanpage được chỉ định trong Prompt.
 * 4. Cuộn từng nấc ngẫu nhiên (Human Jitter) để mô phỏng người lướt.
 * 5. Bóc tách bài đăng, kiểm duyệt < 72h và loại bỏ 100% spam/khoá học.
 */
class FacebookRunner {
  constructor(options = {}) {
    this.name = 'facebook';
    this.label = 'Facebook Groups';
    this.filter = new SocialAiFilter(options);
    this.userDataDir = options.userDataDir || path.join(os.homedir(), '.job-scout-vn', 'browser_profile');
    this.chromePath = options.chromePath || this.detectChromePath();
    this.maxAgeHours = options.maxAgeHours || 72;
  }

  detectChromePath() {
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  async launchBrowser() {
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }

    return await puppeteer.launch({
      executablePath: this.chromePath,
      userDataDir: this.userDataDir,
      headless: false, // Headful để người dùng thấy và tránh anti-bot của Meta
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--start-maximized'
      ]
    });
  }

  /**
   * Kiểm tra và hướng dẫn đăng nhập nếu chưa có phiên
   */
  async ensureLoggedIn(page, onProgress) {
    if (onProgress) onProgress('[Facebook] Đang kiểm tra trạng thái đăng nhập...');
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: 45000 });

    // Kiểm tra xem đã đăng nhập chưa
    // Nếu có ô input email/pass nghĩa là chưa login
    const isLoggedOut = await page.evaluate(() => {
      return !!document.querySelector('input#email, input[name="email"]');
    });

    if (isLoggedOut) {
      if (onProgress) {
        onProgress('⚠️ [Facebook] CHƯA ĐĂNG NHẬP! Cửa sổ Chrome đã mở.');
        onProgress('👉 Vui lòng đăng nhập tài khoản Facebook của bạn trên cửa sổ Chrome vừa hiện lên...');
      }

      // Đợi người dùng tự đăng nhập (chờ tối đa 3 phút)
      await page.waitForFunction(() => {
        return !document.querySelector('input#email, input[name="email"]');
      }, { timeout: 180000 });

      if (onProgress) onProgress('✅ [Facebook] Đăng nhập thành công! Phiên đã được lưu cho các lần sau.');
      await humanDelay(2000, 3500);
    } else {
      if (onProgress) onProgress('✅ [Facebook] Đã có phiên đăng nhập sẵn từ trước.');
    }
  }

  /**
   * Quét bài viết trên một URL Group cụ thể
   */
  async scrapeGroup(page, groupUrl, onProgress) {
    if (onProgress) onProgress(`[Facebook] Đang truy cập mục tiêu: ${groupUrl}`);
    
    // Đảm bảo URL về feed mới nhất nếu có
    const targetUrl = groupUrl.includes('?') ? groupUrl : `${groupUrl.replace(/\/$/, '')}?sorting_setting=CHRONOLOGICAL`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    await humanDelay(2000, 3500);

    const groupTitle = await page.evaluate(() => {
      return document.querySelector('h1, span[dir="auto"]')?.innerText || 'Facebook Group';
    });

    if (onProgress) onProgress(`[Facebook] Đang lướt nhóm: "${groupTitle}" (Mô phỏng người lướt)...`);

    const rawPostsMap = new Map();
    const maxScrollRounds = 5;

    for (let round = 1; round <= maxScrollRounds; round++) {
      // Bóc tách các bài viết đang hiển thị trên DOM
      const currentPosts = await page.evaluate((title) => {
        const posts = [];
        const postElements = document.querySelectorAll('div[role="feed"] > div, div[data-ad-preview="message"]');

        postElements.forEach((el, idx) => {
          const text = el.innerText || '';
          if (text.length < 50) return;

          const links = Array.from(el.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"]'));
          const postUrl = links.length > 0 ? links[0].href.split('?')[0] : (window.location.href + '#post_' + idx);

          const authorEl = el.querySelector('strong, h2, h3, h4');
          const author = authorEl ? authorEl.innerText.trim() : 'Thành viên Group';

          // Tìm thời gian đăng bài
          let timeText = 'Vừa quét từ trình duyệt (< 24h)';
          const timeLink = el.querySelector('a[href*="/posts/"], a[href*="/permalink/"], span[id*="jsc_"]');
          if (timeLink && timeLink.innerText) {
            timeText = timeLink.innerText.trim();
          }

          posts.push({
            id: `fb_${Date.now()}_${idx}`,
            author,
            group_name: title,
            text,
            url: postUrl,
            time: timeText,
            created_at: new Date().toISOString()
          });
        });

        return posts;
      }, groupTitle);

      for (const p of currentPosts) {
        if (!rawPostsMap.has(p.url)) {
          rawPostsMap.set(p.url, p);
        }
      }

      // Cuộn trang từng nấc ngẫu nhiên
      const scrollY = Math.floor(Math.random() * (750 - 450 + 1)) + 450;
      await page.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), scrollY);

      // Nghỉ mô phỏng đọc bài
      await humanDelay(1500, 2800);
    }

    const rawList = Array.from(rawPostsMap.values());
    if (onProgress) onProgress(`[Facebook] Đã đọc được ${rawList.length} bài đăng thô từ nhóm.`);

    // Lọc qua SocialAiFilter
    const validJobs = [];
    let expiredCount = 0;
    let spamCount = 0;

    for (const post of rawList) {
      const result = this.filter.filterAndNormalize(post, 'facebook');
      if (result.valid) {
        validJobs.push(result.job);
      } else {
        if (result.reason.includes('quá hạn') || result.reason.includes('72h')) {
          expiredCount++;
        } else {
          spamCount++;
        }
      }
    }

    if (onProgress) {
      onProgress(`[Facebook] ✅ Bóc tách thành công ${validJobs.length} việc làm đạt chuẩn (< 72h). (Bỏ ${expiredCount} bài cũ, ${spamCount} bài rác/khoá học).`);
    }

    return validJobs;
  }

  /**
   * Quét toàn bộ các mục tiêu được chỉ định
   * @param {Array<string>} targetGroups - Danh sách URL nhóm từ prompt người dùng
   */
  async run({ targetGroups = [], onProgress = null } = {}) {
    if (!targetGroups || targetGroups.length === 0) {
      throw new Error('Chưa có danh sách Group/Fanpage mục tiêu! Hãy cung cấp ít nhất 1 link Group.');
    }

    let browser = null;
    const allJobs = [];

    try {
      browser = await this.launchBrowser();
      const page = await browser.newPage();

      // Đặt user agent chuẩn
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

      // 1. Kiểm tra đăng nhập
      await this.ensureLoggedIn(page, onProgress);

      // 2. Lần lượt quét từng Group được chỉ định
      for (const groupUrl of targetGroups) {
        try {
          const groupJobs = await this.scrapeGroup(page, groupUrl, onProgress);
          allJobs.push(...groupJobs);
        } catch (err) {
          if (onProgress) onProgress(`⚠️ [Facebook] Lỗi khi quét ${groupUrl}: ${err.message}`);
        }
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return allJobs;
  }
}

module.exports = FacebookRunner;
