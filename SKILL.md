---
name: job-scout-vn
description: >
  Personal AI Job Hunter & Market Reality Checker for Vietnamese Tech Talents.
  Scans real-time IT jobs across 5 Zero-Login platforms (ITViec, LinkedIn, CareerViet, Vieclam24h, Threads),
  analyzes candidate Portfolio/CV via REA techniques, scores compatibility (0-100),
  filters out misleading titles, and generates an interactive offline HTML dashboard.
triggers:
  - "/job-scout-vn"
  - "tìm việc giúp tôi"
  - "quét việc làm IT"
  - "so sánh CV với thị trường"
  - "job scout"
  - "job-scout"
created: 2026-11-04
author: Thiều Việt Hoàng (https://thhoang.io.vn)
---

# /job-scout-vn (Personal AI Job Hunter)

Skill tự động hóa săn việc và đối chiếu năng lực thực chiến dành cho lập trình viên Việt Nam. Hoạt động trên **5 nền tảng lớn (100% Zero-Login, không cần đăng nhập)**.

## 1. Khi nào kích hoạt Skill này?
- Người dùng yêu cầu tìm việc làm IT: *"tìm việc IT giúp tôi"*, *"quét thị trường việc làm"*.
- Người dùng cung cấp link Portfolio hoặc file CV và muốn biết mình phù hợp với những vị trí nào.
- Người dùng gõ lệnh `/job-scout-vn`.

## 2. Hệ Thống Prompt Đa Hoàn Cảnh (Situational Routing)

Khi tiếp nhận yêu cầu, AI chủ động nhận diện hoàn cảnh của người dùng:

1. ⚡ **Chế độ Siêu Tốc (Mặc định — 5 Nguồn Zero-Login):**
   - Quét đồng thời ITViec, LinkedIn, CareerViet, ViệcLàm24h & Threads.
   - Lệnh: `node cli.js --url <URL>` hoặc `node cli.js --cv <CV_PATH>`
2. 📘 **Chế độ Facebook Targeted (Fail-Fast & Group Kín Chỉ Định):**
   - Người dùng yêu cầu quét Facebook: Bắt buộc cung cấp URL Group mục tiêu.
   - Luồng chạy: **Ải Facebook thực thi đầu tiên** với profile cách ly (`~/.job-scout-vn/browser_profile`). Người dùng mở file `DangNhapFacebook.bat` để đăng nhập 1 lần duy nhất; nếu không có mục tiêu hoặc lỗi, dừng tiến trình ngay lập tức (Fail-Fast).
   - Lệnh: `node cli.js --url <URL> --sources facebook,itviec,linkedin --fb-groups "<GROUP_URLS>"`
3. 🌐 **Chế độ Công Ty Đa Quốc Gia & Remote:**
   - Người dùng yêu cầu môi trường tiếng Anh, MNCs, lương USD.
   - Lệnh: `node cli.js --sources itviec,linkedin --url <URL>`
4. 🧵 **Chế độ Tin Tuyển Nóng Hổi Từ Kỹ Sư Trên Threads (< 72 Giờ):**
   - Người dùng muốn kết nối trực tiếp với các Tech Lead / HR đăng bài tuyển dụng trên Threads.
   - Lệnh: `node cli.js --sources threads --url <URL>`
5. 🎓 **Chế độ Junior / Fresher (Lọc Bẫy Helpdesk):**
   - Người dùng mới ra trường, chuyển ngành.
   - Thuật toán tự động siết chặt tiêu chuẩn DEV MATCH, loại bỏ 100% công việc cài Win, bấm cáp mạng.

Nếu người dùng chỉ gõ `/job-scout-vn` cộc lốc chưa kèm link/file:
> *"Chào bạn! Hãy gửi cho mình link Portfolio trực tuyến (ví dụ: https://myportfolio.dev) hoặc đường dẫn file CV (.md, .txt) của bạn nhé. Bạn muốn mình quét nhanh toàn diện (5 sàn mở) hay chỉ nhắm vào công ty đa quốc gia / Remote trên LinkedIn & ITViec?"*

## 3. Quy trình Thực thi Kỹ thuật (Workflow)

### Bước 1: Tiếp nhận Hồ sơ Ứng viên (Profile Ingestion)
- **Link Portfolio:** Khai thác Next.js App Router RSC payload và JSON-LD qua REA Web Extractor mà không cần mở trình duyệt.
- **File CV:** Đọc trực tiếp các file `.md`, `.txt`, `.json` trên máy.

### Bước 2: Quét Dữ liệu Thị trường (5 Nền Tảng Zero-Login)
- Adapter `itviec.js`: Cào việc làm Tech/Product Startups từ ITViec.com.
- Adapter `linkedin.js`: Cào việc làm từ các công ty đa quốc gia qua LinkedIn Guest API (có human delay chống chặn).
- Adapter `careerviet.js`: Cào việc làm từ các tập đoàn FDI & Ngân hàng lớn từ CareerViet.vn.
- Adapter `vieclam24h.js`: Cào việc làm doanh nghiệp từ Vieclam24h.vn qua Next.js SSR.
- Adapter `threads.js`: Quét bài tuyển dụng công khai từ Threads (**chỉ nhận bài < 72h**, lọc sạch scam/khoá học).
- Tự động bóc tách: Lương min/max, kinh nghiệm, địa điểm, smart tags, tên công ty thật, link nộp đơn.

### Bước 3: Chấm điểm Tương thích & Lọc Phân khúc
- Thuật toán `matcher.js` tính điểm Match Score ($0 - 100\%$):
  - Khớp chuyên ngành Dev (+40đ)
  - Khớp kỹ năng công nghệ cốt lõi (+15đ mỗi stack)
  - Khớp dải năm kinh nghiệm (+15 đến +20đ)
  - Phân loại rõ ràng: Đâu là Dev thật sự, đâu là IT Helpdesk/Vận hành mạng.

### Bước 4: Sinh Dashboard HTML & Mở Cho Người Dùng
- Sinh file HTML độc lập tại `output/dashboard.html`.
- Báo cáo cho người dùng số lượng việc làm bóc tách, top 3 vị trí Spotlight và đường dẫn mở file Dashboard để xem offline.
