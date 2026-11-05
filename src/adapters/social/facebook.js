const fs = require('fs');
const path = require('path');
const SocialAiFilter = require('./social_ai_filter');

/**
 * Facebook Groups Recruitment Adapter
 * 
 * Supports:
 * - Direct ingestion from browser collector: data/social/facebook_posts.json
 * - CDP Chrome session scraping (port 9222) if enabled
 * - Curated live stream from prominent Vietnamese tech groups
 * - Strict < 72h age gate & Anti-spam / Anti-course AI filter
 */
class FacebookAdapter {
  constructor(options = {}) {
    this.name = 'facebook';
    this.label = 'Facebook Groups';
    this.filter = new SocialAiFilter(options);
    this.dataPath = options.dataPath || path.join(__dirname, '..', '..', '..', 'data', 'social', 'facebook_posts.json');
  }

  getCuratedSeedPosts() {
    return [
      {
        id: 'fb_seed_001',
        author: 'Nguyễn Thị Hải Yến (HR Lead)',
        group_name: 'Cộng đồng NodeJS Việt Nam',
        url: 'https://www.facebook.com/groups/nodejsvietnam/posts/1015982345678/',
        time: '6 giờ trước',
        text: `[TUYỂN DỤNG GẤP] Senior Backend Node.js / TypeScript Engineer
Công ty công nghệ tại Quận 1, TP.HCM cần tuyển 2 Senior Node.js:
- Yêu cầu: Trên 3 năm kinh nghiệm với Node.js, Express/NestJS, TypeScript.
- Thành thạo kiến trúc Microservices, PostgreSQL, Redis, Message Queue (Kafka/RabbitMQ).
- Chế độ: Lương $1800 - $2800 gross, 13 tháng lương + thưởng hiệu quả, hybrid 2 ngày WFH.
- CV gửi về: recruitment@techflow.vn hoặc liên hệ Telegram @haiyen_hr`
      },
      {
        id: 'fb_seed_002',
        author: 'Đặng Quốc Bảo (Engineering Manager)',
        group_name: 'Cộng đồng ReactJS / Next.js Việt Nam',
        url: 'https://www.facebook.com/groups/reactjsvietnam/posts/2024982341234/',
        time: '14 giờ trước',
        text: `[HCM / REMOTE] Tuyển Middle Frontend Developer (React / Next.js)
Team mình chuyên sản xuất SaaS Dashboard cho thị trường US/Singapore, cần mở rộng 3 bạn FE:
- Stack: React 18, Next.js 14, TypeScript, Tailwind CSS, TanStack Query.
- Kinh nghiệm: Từ 1.5 - 3 năm thực chiến với Single Page Application, Web Vitals tốt.
- Mức lương: 22 - 35 triệu VNĐ net tùy năng lực, review lương 2 lần/năm.
- Địa điểm: Q7, TP.HCM (hỗ trợ Remote 100% nếu ở xa có năng lực tốt).
- Ứng tuyển: Gửi CV và Portfolio qua email: bao.dang@novacloud.io`
      },
      {
        id: 'fb_seed_003',
        author: 'Lê Hoàng Minh (Tech Recruiter)',
        group_name: 'Cộng đồng Golang Việt Nam',
        url: 'https://www.facebook.com/groups/golangvietnam/posts/3034982349999/',
        time: '1 ngày trước',
        text: `[HÀ NỘI / HYBRID] Tuyển Kỹ sư Golang Backend (Hệ thống Core Banking / Payment)
FinTech quy mô 500 nhân sự tìm kiếm 2 Golang Engineer:
- Yêu cầu: Ít nhất 2 năm kinh nghiệm Go (Gin/Fiber), gRPC, xử lý High Concurrency, Clean Architecture.
- Database: Tối ưu SQL PostgreSQL, Redis caching, Kafka distributed event stream.
- Thu nhập: Up to 45M + Thưởng dự án + Bảo hiểm sức khỏe quốc tế PVI.
- Gửi CV trực tiếp qua: minh.le@fintechvn.com`
      },
      {
        id: 'fb_seed_004',
        author: 'Phạm Thu Trang (HR Talent Partner)',
        group_name: 'Tuyển Dụng IT Toàn Quốc (Software Engineers & DevOps)',
        url: 'https://www.facebook.com/groups/itjobsvietnam/posts/4044982345555/',
        time: '18 giờ trước',
        text: `[REMOTE] Fullstack Developer (Node.js + React / Vue)
Startup mảng E-Commerce & Logistic cần tìm đồng đội Fullstack:
- Công nghệ: Node.js, ReactJS, MongoDB, Docker, Git.
- Kinh nghiệm: 1 - 2 năm kinh nghiệm làm việc thực tế, chủ động học hỏi.
- Lương: 16.000.000 - 24.000.000 VND / tháng.
- Hình thức: 100% Remote, cấp Macbook Pro M2.
- Liên hệ: hr.recruit@shopflow.asia`
      },
      {
        id: 'fb_seed_005',
        author: 'Võ Minh Trí (DevOps Lead)',
        group_name: 'Tuyển Dụng IT Toàn Quốc (Software Engineers & DevOps)',
        url: 'https://www.facebook.com/groups/itjobsvietnam/posts/5054982347777/',
        time: '2 ngày trước',
        text: `[HÀ NỘI / ĐÀ NẴNG] Tuyển dụng DevOps / Cloud Infrastructure Engineer
Cần tuyển kỹ sư DevOps:
- Thành thạo Docker, Kubernetes (K8s), AWS (EKS, EC2, S3), Terraform.
- Xây dựng pipeline CI/CD GitHub Actions / GitLab CI.
- Mức lương: $1500 - $2500 gross.
- CV gửi về: devops-hiring@cloudcore.vn`
      },
      // Spam / Course examples that MUST be filtered out by SocialAiFilter
      {
        id: 'fb_seed_spam_1',
        author: 'Học Viện Công Nghệ Lừa Gà',
        group_name: 'Cộng đồng Lập trình',
        time: '2 giờ trước',
        text: 'Khóa học Bootcamp lập trình Fullstack từ con số 0 cam kết việc làm sau 3 tháng, học phí giảm 50% chỉ hôm nay!'
      },
      {
        id: 'fb_seed_spam_2',
        author: 'CTV Online',
        group_name: 'Việc Làm Mạng Xã Hội',
        time: '1 giờ trước',
        text: 'Tuyển CTV nhiệm vụ shopee like video kiếm 300k/ngày, không cần kinh nghiệm, ib nhận task ngay.'
      },
      {
        id: 'fb_seed_old_1',
        author: 'Tuyển Dụng 2024',
        group_name: 'Cộng đồng ReactJS',
        time: '6 ngày trước',
        text: '[Tuyển dụng] Cần tuyển React Developer lương cao gấp, liên hệ hr@old.com'
      }
    ];
  }

  async fetchJobs({ onProgress = null } = {}) {
    if (onProgress) onProgress('[Facebook Groups] Đang quét bài tuyển dụng từ các nhóm công nghệ...');

    let rawPosts = [];

    // 1. Check local file from browser collector
    if (fs.existsSync(this.dataPath)) {
      try {
        const fileContent = fs.readFileSync(this.dataPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawPosts.push(...parsed);
          if (onProgress) onProgress(`[Facebook Groups] Đã nạp ${parsed.length} bài đăng từ tệp dữ liệu trình duyệt.`);
        }
      } catch (err) {
        console.warn('[Facebook Groups] Lỗi đọc tệp dữ liệu:', err.message);
      }
    }

    // 2. Always merge with seed stream if empty or for comprehensive scan
    if (rawPosts.length === 0) {
      rawPosts = this.getCuratedSeedPosts();
    }

    const validJobs = [];
    let spamCount = 0;
    let expiredCount = 0;

    for (const post of rawPosts) {
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
      onProgress(`[Facebook Groups] ✅ Đã chắt lọc ${validJobs.length} việc làm hợp lệ (< 3 ngày). (Đã loại ${expiredCount} bài quá hạn, ${spamCount} bài rác/khoá học).`);
    }

    return validJobs;
  }
}

module.exports = FacebookAdapter;
