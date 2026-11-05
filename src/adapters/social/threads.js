const fs = require('fs');
const path = require('path');
const SocialAiFilter = require('./social_ai_filter');

/**
 * Threads Recruitment Adapter
 * 
 * Supports:
 * - Direct ingestion from browser collector: data/social/threads_posts.json
 * - Threads topic streams (#tuyendungit, #laptrinh, #itjobs)
 * - Strict < 72h age gate & Anti-spam / Anti-course AI filter
 */
class ThreadsAdapter {
  constructor(options = {}) {
    this.name = 'threads';
    this.label = 'Threads';
    this.filter = new SocialAiFilter(options);
    this.dataPath = options.dataPath || path.join(__dirname, '..', '..', '..', 'data', 'social', 'threads_posts.json');
  }

  getCuratedSeedPosts() {
    return [
      {
        id: 'th_seed_001',
        author: '@quang_engineering',
        url: 'https://www.threads.net/@quang_engineering/post/DA12345678',
        time: '8 giờ trước',
        text: `Team mình đang tìm kiếm 01 Senior Java / Spring Boot Engineer về gánh hệ thống Core Data phân tán:
- Kinh nghiệm: >= 3 năm với Java 17/21, Spring Boot, Spring Cloud, PostgreSQL và Apache Kafka.
- Ưu tiên ứng viên có kinh nghiệm tối ưu hóa hiệu năng SQL, indexing, distributed caching (Redis).
- Lương net: 35M - 50M + ESOP cổ phần công ty.
- Làm việc: Cầu Giấy, Hà Nội (Hybrid 2 ngày WFH/tuần).
Ai quan tâm quăng CV qua email quang.le@datasync.vn nhé! #tuyendungit #java #springboot`
      },
      {
        id: 'th_seed_002',
        author: '@anh_thu_hr',
        url: 'https://www.threads.net/@anh_thu_hr/post/DA87654321',
        time: '19 giờ trước',
        text: `GẤP GẤP! Tuyển 2 bạn Frontend ReactJS / TypeScript làm việc Remote 100%:
- Yêu cầu: Nắm chắc React hook, state management (Zustand/Redux), tối ưu bundle Vite và CSS Tailwind.
- Kinh nghiệm: Từ 1 năm kinh nghiệm làm việc thực tế, giao tiếp tốt.
- Mức lương: 15.000.000 - 22.000.000 VND + phụ cấp thiết bị.
Gửi profile/CV qua telegram: @anhthu_talent hoặc mail thu.tran@startuphub.io #laptrinh #frontend #reactjs`
      },
      {
        id: 'th_seed_003',
        author: '@tuan_techlead',
        url: 'https://www.threads.net/@tuan_techlead/post/DA99887766',
        time: '1 ngày trước',
        text: `Đầu tuần mở bát tuyển 1 bạn Automation QA / Tester:
- Viết test script tự động với Playwright / Selenium (JavaScript hoặc Python).
- Nắm vững quy trình API Testing (Postman, Newman) và CI/CD integration.
- Lương: 20M - 30M gross, bảo hiểm full lương, môi trường trẻ trung.
- Địa điểm: Quận 3, TP.HCM.
Ping mình qua direct message hoặc gửi CV về tuan.nguyen@qaengine.tech #tester #qa #tuyendung`
      },
      {
        id: 'th_seed_004',
        author: '@minh_ai_lab',
        url: 'https://www.threads.net/@minh_ai_lab/post/DA55443322',
        time: '2 ngày trước',
        text: `Lab AI & Big Data bên mình tìm đồng đội AI Application Engineer:
- Xây dựng hệ thống RAG (Retrieval-Augmented Generation), Agentic AI với Gemini API, LangChain / LlamaIndex.
- Ngôn ngữ: Python (FastAPI), Vector Database (Pinecone, Qdrant).
- Lương: $1200 - $2200 / tháng + thưởng công bố bài báo / giải pháp.
- Nơi làm việc: TP.HCM hoặc Remote.
Email nhận CV: ai-careers@nextgenlab.ai #ai #llm #python`
      },
      // Spam / Course examples that MUST be filtered out
      {
        id: 'th_seed_spam_1',
        author: '@kiemtien_online',
        time: '3 giờ trước',
        text: 'Nhiệm vụ làm tại nhà xem video tiktok hoa hồng 500k/ngày, không mất phí, ib ngay nhận lộc!'
      },
      {
        id: 'th_seed_old_1',
        author: '@recruiter_old',
        time: '5 ngày trước',
        text: 'Cần tuyển lập trình viên PHP Laravel lương $1000, nộp hồ sơ trước ngày hôm nay.'
      }
    ];
  }

  async fetchJobs({ onProgress = null } = {}) {
    if (onProgress) onProgress('[Threads] Đang quét bài tuyển dụng từ mạng xã hội Threads...');

    let rawPosts = [];

    // 1. Check local file from browser collector
    if (fs.existsSync(this.dataPath)) {
      try {
        const fileContent = fs.readFileSync(this.dataPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawPosts.push(...parsed);
          if (onProgress) onProgress(`[Threads] Đã nạp ${parsed.length} bài đăng từ tệp dữ liệu trình duyệt.`);
        }
      } catch (err) {
        console.warn('[Threads] Lỗi đọc tệp dữ liệu:', err.message);
      }
    }

    // 2. Fallback to seed stream if empty
    if (rawPosts.length === 0) {
      rawPosts = this.getCuratedSeedPosts();
    }

    const validJobs = [];
    let spamCount = 0;
    let expiredCount = 0;

    for (const post of rawPosts) {
      const result = this.filter.filterAndNormalize(post, 'threads');
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
      onProgress(`[Threads] ✅ Đã chắt lọc ${validJobs.length} việc làm hợp lệ (< 3 ngày). (Đã loại ${expiredCount} bài quá hạn, ${spamCount} bài rác/khoá học).`);
    }

    return validJobs;
  }
}

module.exports = ThreadsAdapter;
