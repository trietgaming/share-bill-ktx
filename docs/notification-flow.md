# Luồng hóa đơn và thông báo

## Chia hóa đơn theo ngày ở

- Ngày chưa tích, ngày thiếu trong bản ghi cũ và thành viên chưa có bản ghi tháng được tính là có mặt.
- Chỉ ngày có trạng thái `ABSENT` mới không được tính. Dữ liệu phòng khác, tháng khác và thành viên ngoài `applyTo` không tham gia tỷ lệ chia.
- Không cần mọi thành viên tích đủ ngày để thanh toán. Nếu tất cả thành viên đều ghi vắng mặt cả tháng, tỷ lệ chia bằng 0 nên chưa thể thanh toán.
- Chia tiền theo số ngày ở, làm tròn theo phương pháp phần dư lớn nhất để tổng các phần đúng bằng tổng hóa đơn. Người không có phần tiền không tạo thanh toán 0 đồng.
- Cả giao diện và server action sử dụng `calculateShare`. Tỷ lệ được tính lại từ dữ liệu ngày ở hiện tại; sửa ngày ở sau khi có thanh toán có thể thay đổi phần tiền còn phải trả.

## Bao phủ thông báo

| Loại | Nguồn phát hiện tại | Khi nhận trong app | Khi bấm thông báo |
| --- | --- | --- | --- |
| `presence_reminder` | Cron nhắc tích ngày | Lưu và hiển thị nhắc nhở | Mở lịch; Có mặt/Vắng mặt gọi `/api/presence` |
| `month_presence_fulfilled` | Chưa có nguồn phát trong repo | Làm mới ngày ở và hóa đơn | Mở lịch |
| `new_invoice` | Tạo hóa đơn | Làm mới hóa đơn | Mở hóa đơn |
| `update_invoice` | Sửa hóa đơn | Làm mới hóa đơn | Mở hóa đơn |
| `delete_invoice` | Xóa hóa đơn | Làm mới hóa đơn | Mở danh sách hóa đơn |
| `payment_reminder` | Chưa có nguồn phát trong repo | Làm mới hóa đơn | Mở hóa đơn |
| `room_member_joined` | Tham gia phòng | Làm mới phòng và danh sách phòng | Mở tổng quan phòng |
| `room_member_left` | Rời phòng hoặc bị xóa khỏi phòng | Làm mới phòng và danh sách phòng | Mở tổng quan phòng |
| `kicked_from_room` | Xóa thành viên | Làm mới phòng và danh sách phòng | Mở danh sách phòng |
| `room_deleted` | Xóa phòng, dùng dữ liệu phòng trước khi xóa | Làm mới phòng và danh sách phòng | Mở danh sách phòng |

Factory và handler có ánh xạ đầy đủ các loại khai báo; loại chưa biết vẫn giữ payload và có nội dung dự phòng. Hai loại chưa có nguồn phát được xử lý nếu nhận được, nhưng thay đổi này không tạo lịch gửi mới cho chúng.

## Nhận và xử lý

- Các bên gửi chờ toàn bộ lượt gửi hoàn thành; lỗi một người nhận không hủy việc gửi cho những người khác. FCM được thử lại tối đa 3 lần và token hết hiệu lực được xóa.
- Thông báo dùng payload dữ liệu để service worker tạo giao diện và giữ action. Mỗi sự kiện có ID ổn định trong các lượt thử lại và ID người nhận.
- Trong nền, service worker lưu vào IndexedDB ngay cả khi không có tab nào mở, rồi báo các tab đang mở. ID sự kiện chống lưu trùng giữa worker và các tab.
- Danh sách và thao tác xóa giới hạn theo tài khoản. Phân trang dùng cả thời điểm nhận và ID bản ghi để không mất những thông báo cùng thời điểm.
- Click được đăng ký trước handler của Firebase. `waitUntil` giữ worker sống đến khi action hoàn tất. Action thất bại giữ bản ghi và hiển thị lại thông báo để thử lại; chỉ khi thành công mới xóa và làm mới ngày ở trong app.
- Token luôn được đối soát với server khi khởi tạo; đăng ký token dùng cập nhật nguyên tử để tránh mất đăng ký khi nhiều thiết bị đăng ký đồng thời. Action từ thông báo của tài khoản khác bị API từ chối.

## Kiểm chứng và giới hạn

Chạy `npm test` để kiểm tra tính tiền, đủ loại thông báo, hai action, lỗi API, tài khoản, IndexedDB, phân trang, worker, retry và thứ tự đăng ký handler. Chạy `npm run build` để kiểm tra bản build và TypeScript.

Bao phủ handler không đồng nghĩa push luôn tới thiết bị. Chưa kiểm thử push thực trên điện thoại/trình duyệt trong lần sửa này. FCM có thể trì hoãn hoặc loại bỏ thông báo khi thiết bị không kết nối, token hết hạn hoặc TTL hết hạn: [tài liệu Firebase](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan).
