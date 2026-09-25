---
title: "Port và Socket: Định Danh Ứng Dụng"
description: "Một địa chỉ IP chỉ đưa dữ liệu đến đúng máy — nhưng máy đó có hàng chục ứng dụng đang chạy cùng lúc, vậy làm sao dữ liệu tìm được đúng ứng dụng?"
tags: ["fundamentals", "transport"]
date: "2026-07-01"
lang: "vi"
weight: 7
locked: false
---

# Port và Socket: Định Danh Ứng Dụng

Ở bài về encapsulation, Transport header được nhắc đến với vai trò chứa "port nguồn, port đích" — nhưng vì sao cần thêm một lớp định danh nữa, trong khi địa chỉ IP đã xác định được chính xác thiết bị nào cần nhận dữ liệu? Câu trả lời nằm ở một thực tế đơn giản: một máy tính không chỉ chạy một ứng dụng.

![Port and socket diagram](/media/notes/fundamentals/port-socket.png)
*Một địa chỉ IP duy nhất nhưng nhiều port khác nhau, mỗi port dẫn đến một ứng dụng riêng trên cùng một máy.*

## Khi chỉ có địa chỉ IP mà không có port

Hình dung một máy tính đang mở trình duyệt web, ứng dụng email, và một cuộc gọi video cùng lúc — cả ba đều nhận dữ liệu qua cùng một địa chỉ IP, vì máy chỉ có một địa chỉ IP duy nhất. Nếu dữ liệu chỉ được định danh bằng địa chỉ IP, hệ điều hành sẽ không biết gói tin vừa đến là dành cho trình duyệt, email, hay ứng dụng gọi video — tất cả trộn lẫn vào nhau. Đây chính là vấn đề mà port được sinh ra để giải quyết.

## Port là gì?

Port là một con số từ 0 đến 65535, dùng để xác định một ứng dụng hoặc dịch vụ cụ thể đang chạy trên một thiết bị, tại tầng Transport (Layer 4 theo OSI). Nếu địa chỉ IP trả lời câu hỏi "gửi đến máy nào", thì port trả lời câu hỏi "gửi đến ứng dụng nào trên máy đó".

Vì port là một trường 16 bit trong TCP/UDP header, số lượng port tối đa có thể có là 2^16 = 65536 (từ 0 đến 65535).

## Phân loại port theo phạm vi

Tổ chức IANA (Internet Assigned Numbers Authority) quản lý việc phân bổ port thành 3 nhóm chính:

| Phạm vi | Tên gọi | Mục đích |
|---|---|---|
| 0 – 1023 | Well-known ports | Dành cho các dịch vụ chuẩn, phổ biến toàn cầu (HTTP, HTTPS, DNS, FTP...) |
| 1024 – 49151 | Registered ports | Đăng ký bởi các công ty/tổ chức cho ứng dụng riêng của họ |
| 49152 – 65535 | Dynamic/Private ports | Hệ điều hành tự cấp phát tạm thời cho các kết nối client |

### Một số well-known port thường gặp

| Port | Giao thức | Dịch vụ |
|---|---|---|
| 20/21 | TCP | FTP (truyền file) |
| 22 | TCP | SSH (truy cập từ xa an toàn) |
| 25 | TCP | SMTP (gửi email) |
| 53 | TCP/UDP | DNS (phân giải tên miền) |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |

Đây là những port sẽ xuất hiện lại nhiều lần trong các bài sau của series, đặc biệt là bài về DNS và HTTP/HTTPS.

## Socket là gì?

Nếu port chỉ là một con số, thì **socket** là sự kết hợp giữa địa chỉ IP và port, tạo thành một định danh đầy đủ và duy nhất cho một kết nối cụ thể. Ký hiệu thường dùng: `IP:port`, ví dụ `192.168.1.10:443`.

Một socket, nói cách khác, chính là "địa chỉ đầy đủ" mà hệ điều hành dùng để phân biệt: dữ liệu này gửi đến máy nào (IP), và đến ứng dụng nào trên máy đó (port).

### Vì sao một kết nối cần đến 2 socket

Một kết nối TCP hoàn chỉnh giữa client và server thực chất được định danh bằng **4 giá trị**, gọi chung là một bộ 4 (socket pair):

```
(IP nguồn, Port nguồn, IP đích, Port đích)
```

Ví dụ khi trình duyệt kết nối tới một website:
```
(192.168.1.10:52341, 93.184.216.34:443)
```

Nhờ có đầy đủ 4 giá trị này, hệ điều hành có thể phân biệt hàng trăm kết nối TCP đang mở cùng lúc trên một máy — kể cả khi tất cả đều kết nối đến cùng một server, cùng một port đích (443), miễn là port nguồn khác nhau ở mỗi kết nối.

## Cách port nguồn được cấp phát

Khi một ứng dụng client (ví dụ trình duyệt) khởi tạo kết nối, hệ điều hành sẽ tự động chọn một port nguồn ngẫu nhiên trong dải dynamic port (thường là trên 49152, tùy hệ điều hành) — đây gọi là **ephemeral port**. Port đích thì thường cố định, vì nó phải khớp với port mà server đang lắng nghe (ví dụ 443 cho HTTPS).

## Lỗi thường gặp

- Nhầm rằng một địa chỉ IP chỉ mở được một kết nối tại một thời điểm — thực tế nhờ có port và cơ chế socket pair, một IP có thể phục vụ hàng nghìn kết nối đồng thời.
- Cấu hình firewall chặn sai port, dẫn đến chặn nhầm dịch vụ hợp lệ — ví dụ chặn port 443 sẽ khiến toàn bộ traffic HTTPS không thể đi qua, dù địa chỉ IP đích hoàn toàn hợp lệ.
- Hai ứng dụng trên cùng một máy cố gắng lắng nghe (listen) trên cùng một port — hệ điều hành sẽ báo lỗi "address already in use", vì mỗi port chỉ có thể được một tiến trình lắng nghe tại một thời điểm trên cùng một địa chỉ IP.

#### Kết luận

Địa chỉ IP đưa dữ liệu đến đúng cánh cửa của ngôi nhà, nhưng port mới là thứ dẫn dữ liệu đến đúng căn phòng bên trong. Không có port, mọi ứng dụng trên cùng một máy sẽ phải tranh giành cùng một luồng dữ liệu duy nhất — và Internet như hiện nay, nơi một máy có thể vừa lướt web, vừa gọi video, vừa tải file, sẽ không thể vận hành được.