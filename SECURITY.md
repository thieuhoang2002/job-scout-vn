# Chính Sách Bảo Mật (Security Policy)

## Các Phiên Bản Được Hỗ Trợ (Supported Versions)

Chúng tôi hỗ trợ và cung cấp các bản vá bảo mật cho các phiên bản sau của **Job Scout VN**:

| Phiên bản | Hỗ trợ bảo mật |
| :--- | :--- |
| `1.x.x` (Hiện tại) | :white_check_mark: Được hỗ trợ |
| `< 1.0.0` | :x: Không còn hỗ trợ |

---

## 🔒 Nguyên Tắc Bảo Mật Quyền Riêng Tư (Privacy by Design)

- **Local-First Architecture:** `job-scout-vn` chạy 100% trên máy cá nhân của người dùng.
- **Zero Data Collection:** Công cụ **KHÔNG** gửi CV, số điện thoại, email hay thông tin cá nhân của ứng viên về bất kỳ máy chủ nào.
- Toàn bộ dữ liệu bóc tách được xử lý trong RAM và ghi ra file HTML nội bộ tại máy cục bộ (`output/dashboard.html`).

---

## 🛡️ Báo Cáo Lỗ Hổng Bảo Mật (Reporting a Vulnerability)

Nếu bạn phát hiện bất kỳ lỗ hổng bảo mật nào trong mã nguồn hoặc phương thức cào dữ liệu:

1. **Vui lòng KHÔNG công khai lỗ hổng lên GitHub Issues.**
2. Gửi email trực tiếp đến tác giả tại: **contact@thhoang.io.vn** với tiêu đề `[SECURITY VULNERABILITY] Job Scout VN`.
3. Vui lòng cung cấp:
   - Mô tả chi tiết lỗ hổng.
   - Các bước tái hiện (Proof of Concept).
   - Đánh giá mức độ ảnh hưởng tiềm tàng.

Chúng tôi cam kết sẽ phản hồi trong vòng **24 - 48 giờ** và tung ra bản vá sớm nhất có thể. Cảm ơn sự đồng hành của bạn trong việc giữ an toàn cho cộng đồng!
