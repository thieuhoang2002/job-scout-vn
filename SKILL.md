---
name: job-scout-vn
description: >
  Personal AI Job Hunter & Market Reality Checker for Vietnamese Tech Talents.
  Scans real-time IT jobs from trusted recruitment portals (ITViec, LinkedIn, Vieclam24h),
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

Skill tự động hóa săn việc và đối chiếu năng lực thực chiến dành cho lập trình viên Việt Nam.

## 1. Khi nào kích hoạt Skill này?
- Người dùng yêu cầu tìm việc làm IT: *"tìm việc IT giúp tôi"*, *"quét thị trường việc làm"*.
- Người dùng cung cấp link Portfolio hoặc file CV và muốn biết mình phù hợp với những vị trí nào.
- Người dùng gõ lệnh `/job-scout-vn`.

## 2. Quy trình Thực thi (Workflow)

### Bước 1: Tiếp nhận Hồ sơ Ứng viên (Profile Ingestion)
- Kiểm tra xem người dùng đã cung cấp:
  - **Link Portfolio:** Ví dụ `https://thhoang.io.vn` (Ưu tiên)
  - **Hoặc File CV:** File `.md`, `.txt`, `.json` trên máy
- Nếu chưa có, AI chủ động hỏi nhẹ nhàng:
  > *"Bạn có link website portfolio hoặc file CV không? Hãy gửi link hoặc đường dẫn file để mình đối chiếu chính xác nhất."*

### Bước 2: Bóc tách Năng lực Ứng viên (REA Parsing)
- Chạy parser bóc tách kỹ năng, số năm kinh nghiệm, các tech stack chính:
  ```bash
  node cli.js --url <URL>
  # hoặc
  node cli.js --cv <FILE_PATH>
  ```
- **Kỹ thuật REA:** Nếu là link web (Next.js / Vue / React), hệ thống tự động bóc tách JSON-LD và RSC payload mà không cần mở trình duyệt.

### Bước 3: Quét Dữ liệu Thị trường (Real-time Multi-source Scraping)
- Adapter `vieclam24h.js`: Cào việc làm qua Next.js SSR `__NEXT_DATA__`.
- Adapter `itviec.js`: Cào trực tiếp việc làm Software Dev/Tech chất lượng cao từ ITViec.com.
- Bóc tách: Lương min/max, kinh nghiệm, địa điểm, smart tags, tên công ty thật, logo.

### Bước 4: Chấm điểm Tương thích & Lọc Phân khúc
- Thuật toán `matcher.js` tính điểm Match Score ($0 - 100\%$):
  - Khớp chuyên ngành Dev (+40đ)
  - Khớp kỹ năng công nghệ cốt lõi (+15đ mỗi stack)
  - Khớp dải năm kinh nghiệm (+15 đến +20đ)
  - Phân loại rõ ràng: Đâu là Dev thật sự, đâu là IT Helpdesk/Vận hành mạng.

### Bước 5: Sinh Dashboard HTML & Báo Cáo
- `HtmlGenerator` nhúng toàn bộ dữ liệu vào file `output/dashboard.html`.
- Trình bày cho người dùng:
  1. Tóm tắt nhanh: Tổng số việc, bao nhiêu việc Dev, bao nhiêu việc Helpdesk.
  2. **Top 5 Việc Làm Khả Thi Nhất (Spotlight):** Tên công ty, mức lương, lý do pass cao, link trực tiếp.
  3. Đường dẫn clickable mở file `dashboard.html` để người dùng trải nghiệm tương tác.

---

## 3. Giao thức REA: Mở rộng Adapter cho các Sàn Mới (REA Protocol)
Khi cần mở rộng cào thêm sàn mới (ITViec, TopCV, TopDev):
1. Không dùng Selenium / Puppeteer nếu chưa thật sự cần thiết.
2. Dùng `curl.exe` hoặc inspect XHR để tìm:
   - Các thẻ `<script id="__NEXT_DATA__">` hoặc `window.__INITIAL_STATE__`.
   - Các API endpoint nội bộ trả về JSON.
3. Tạo file adapter mới kế thừa kiến trúc trong `src/adapters/` và đăng ký vào `src/adapters/index.js`.
