# Hướng Dẫn Đóng Góp (Contributing Guide)

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án **Job Scout VN**! Sự đóng góp của bạn giúp cộng đồng lập trình viên Việt Nam có công cụ tìm việc trung thực, nhanh chóng và hiệu quả hơn.

---

## 🛠️ Bạn Có Thể Đóng Góp Gì?

1. **Phát triển thêm Adapter cho các sàn tuyển dụng mới (Ưu tiên số 1):**
   - Viết adapter cho **ITViec, LinkedIn, VietnamWorks, TopDev**.
   - Tuân thủ **Giao thức REA (Reverse Engineering Analysis)**: Tận dụng các Next.js SSR payloads (`__NEXT_DATA__`), Nuxt.js payloads, hoặc các internal JSON API thay vì dùng trình duyệt Chromium nặng nề.
2. **Cải tiến thuật toán Chấm Điểm Match Score (`src/engine/matcher.js`):**
   - Bổ sung bộ từ khóa nhận diện tech stack mới (AI, DevOps, Mobile, Rust, Go).
   - Tối ưu hóa phân loại kinh nghiệm (Fresher, Junior, Middle, Senior, Lead).
3. **Nâng cấp Dashboard UI (`src/generator/html_generator.js`):**
   - Thêm biểu đồ mới (thống kê mức lương theo từng quận/huyện, stack nào lương cao nhất).
   - Tối ưu hóa giao diện di động (Mobile Responsive).
4. **Báo lỗi & Đề xuất tính năng (Issues):**
   - Mở issue trên GitHub để báo lỗi scraper khi trang đích thay đổi cấu trúc dữ liệu.

---

## 📋 Quy Trình Gửi Pull Request (PR)

1. **Fork** repository về tài khoản GitHub của bạn.
2. Tạo branch mới với tên rõ nghĩa:
   ```bash
   git checkout -b feature/add-itviec-adapter
   # hoặc
   git checkout -b fix/vieclam24h-salary-parse
   ```
3. Viết mã nguồn và kiểm tra chạy thử:
   ```bash
   node cli.js --url https://thhoang.io.vn --pages 2
   ```
4. Commit theo chuẩn Conventional Commits:
   - `feat: add itviec scraper adapter`
   - `fix: resolve salary parsing issue`
   - `docs: update readme with new adapter instructions`
5. Push lên fork của bạn và mở **Pull Request** vào nhánh `main` của repo gốc.

Mọi thắc mắc hãy mở [GitHub Discussion](https://github.com/thieuhoang2002/job-scout-vn/discussions) hoặc liên hệ qua email: **thhoang0903@gmail.com**.
