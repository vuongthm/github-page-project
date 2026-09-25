---
title: "Thiết Bị Mạng: Hub, Switch, Router, Access Point"
description: "Cùng là 'thiết bị nối mạng', nhưng hub, switch, router và access point giải quyết những vấn đề hoàn toàn khác nhau — nhầm lẫn giữa chúng là lỗi phổ biến nhất khi mới học networking."
tags: ["devices", "hardware", "protocols"]
date: "2026-07-03"
lang: "vi"
weight: 8
locked: false
---

# Thiết Bị Mạng: Hub, Switch, Router, Access Point

Đến đây, series đã đi qua toàn bộ nền tảng lý thuyết: node, link, OSI, IP, port. Nhưng lý thuyết đó chạy trên phần cứng cụ thể nào? Đây là bài đầu tiên của Phần 2, nơi series bắt đầu gắn khái niệm với thiết bị thật — bắt đầu bằng 4 cái tên hay bị dùng lẫn lộn nhất: hub, switch, router, và access point.

![Hub, switch, router, access point comparison](/media/notes/protocols-and-devices/network-devices.png)
*So sánh 4 thiết bị mạng phổ biến, phân loại theo tầng OSI mà mỗi thiết bị hoạt động.*

## Khi dùng sai thiết bị

Hình dung một văn phòng 30 máy vẫn đang dùng hub thay vì switch — vì hub gửi dữ liệu đến *tất cả* các cổng thay vì chỉ cổng đích, toàn bộ 30 máy sẽ cùng "nghe" mọi gói tin được gửi đi trong mạng, dù gói tin đó chỉ dành cho một máy. Kết quả là **collision** (xung đột dữ liệu) xảy ra liên tục khi nhiều máy gửi dữ liệu cùng lúc, khiến mạng chậm đi rõ rệt khi số lượng máy tăng lên. Đây là lý do vì sao hiểu đúng vai trò từng thiết bị không chỉ là kiến thức lý thuyết, mà ảnh hưởng trực tiếp đến hiệu năng mạng thực tế.

## 4 thiết bị, 4 tầng OSI khác nhau

Điều quan trọng nhất cần nắm: mỗi thiết bị này hoạt động ở một tầng OSI khác nhau, và tầng đó quyết định thiết bị "nhìn thấy" được gì trong dữ liệu đi qua nó.

| Thiết bị | Tầng OSI | Dựa vào thông tin gì để chuyển tiếp | Tình trạng hiện tại |
|---|---|---|---|
| Hub | Layer 1 (Physical) | Không dựa vào gì — chỉ khuếch đại và gửi đến mọi cổng | Gần như đã ngừng sản xuất, thay thế hoàn toàn bởi switch |
| Switch | Layer 2 (Data Link) | Địa chỉ MAC | Thiết bị chuẩn cho mạng LAN hiện đại |
| Router | Layer 3 (Network) | Địa chỉ IP | Thiết bị chuẩn để kết nối giữa các mạng khác nhau |
| Access Point | Layer 1/2 | Tương tự switch, nhưng qua sóng Wi-Fi thay vì cáp | Thiết bị chuẩn để mở rộng mạng không dây |

## Hub hoạt động như thế nào (và vì sao gần như biến mất)

Hub là thiết bị đơn giản nhất — khi nhận tín hiệu từ một cổng, nó khuếch đại và gửi (broadcast) tín hiệu đó ra **tất cả** các cổng còn lại, không phân biệt cổng nào là đích thực sự. Toàn bộ các thiết bị nối vào hub cùng chia sẻ chung một **collision domain** — nghĩa là chỉ một thiết bị được phép gửi dữ liệu tại một thời điểm, nếu không sẽ xảy ra xung đột. Vì nhược điểm này, hub gần như đã bị loại bỏ hoàn toàn khỏi hạ tầng mạng hiện đại, thay thế bởi switch.

## Switch hoạt động như thế nào

Switch thông minh hơn hub ở một điểm mấu chốt: nó xây dựng và duy trì một bảng gọi là **MAC address table**, ghi nhớ địa chỉ MAC nào đang kết nối ở cổng nào. Khi nhận một frame, switch đọc địa chỉ MAC đích trong header, tra bảng, và chỉ gửi frame đó đến đúng cổng tương ứng — thay vì gửi tới toàn bộ các cổng như hub.

Nhờ cơ chế này, mỗi cổng trên switch là một collision domain riêng biệt — nhiều thiết bị có thể gửi dữ liệu cùng lúc mà không xung đột với nhau, miễn là chúng gửi đến các đích khác nhau. Đây là lý do switch hiệu quả hơn hub gấp nhiều lần trong mạng có nhiều thiết bị.

### Khi switch chưa biết địa chỉ MAC đích

Nếu switch nhận một frame có địa chỉ MAC đích chưa từng xuất hiện trong bảng MAC address table của nó, nó sẽ tạm thời hành xử giống hub — gửi frame đó ra tất cả các cổng (trừ cổng vừa nhận), gọi là **flooding**. Khi thiết bị đích phản hồi, switch sẽ học được địa chỉ MAC đó gắn với cổng nào, và từ lần sau sẽ gửi trực tiếp mà không cần flooding nữa.

## Router hoạt động như thế nào

Router hoạt động ở tầng cao hơn switch — nó đọc địa chỉ IP trong header, không phải MAC, và dùng thông tin này để quyết định đường đi giữa các mạng khác nhau (không chỉ trong một mạng cục bộ như switch). Router duy trì một **routing table**, ghi nhận các tuyến đường có thể đi tới các mạng khác, và chọn tuyến phù hợp nhất cho mỗi gói tin.

Sự khác biệt cốt lõi giữa switch và router: switch chuyển tiếp dữ liệu **trong cùng một mạng** (dựa vào MAC), còn router chuyển tiếp dữ liệu **giữa các mạng khác nhau** (dựa vào IP). Đây cũng là lý do khi kết nối Internet tại nhà, thiết bị "modem/router Wi-Fi" thực chất đang làm nhiệm vụ của router — kết nối mạng nội bộ trong nhà với mạng của nhà cung cấp dịch vụ Internet.

*Chi tiết đầy đủ hơn về cách router chọn đường đi (routing table, static/dynamic routing) sẽ là nội dung của bài tiếp theo trong series.*

## Access Point hoạt động như thế nào

Access Point (AP) đóng vai trò tương tự switch, nhưng dành cho kết nối không dây — nó nhận dữ liệu từ mạng có dây (thường nối vào switch hoặc router) và phát sóng Wi-Fi để các thiết bị không dây có thể tham gia vào cùng mạng đó. Về bản chất, AP là "cầu nối" giữa hạ tầng có dây và các thiết bị không dây, không tự nó định tuyến giữa các mạng như router.

Nhiều thiết bị gia dụng (thường được gọi chung là "modem Wi-Fi" hay "router Wi-Fi") thực chất tích hợp cả 3 chức năng: router, switch, và access point trong cùng một hộp — đây là lý do gây nhầm lẫn phổ biến rằng "router" và "modem Wi-Fi" là một khái niệm duy nhất.

## Lỗi thường gặp

- Gọi mọi thiết bị mạng gia dụng là "router" — trong khi thực tế thiết bị đó thường tích hợp router, switch, và access point làm một, khiến việc mô tả sự cố (ví dụ Wi-Fi yếu vs mất kết nối Internet) trở nên khó chính xác nếu không phân biệt được chức năng nào đang gặp vấn đề.
- Nhầm lẫn vai trò switch và router — nghĩ rằng switch cũng "định tuyến" được giữa các mạng khác nhau, trong khi switch chỉ hoạt động trong phạm vi một mạng cục bộ duy nhất (dựa vào MAC, không phải IP).
- Dùng hub trong mạng hiện đại (hiếm gặp nhưng vẫn còn ở một số hệ thống cũ) mà không nhận ra nguyên nhân mạng chậm là do toàn bộ thiết bị chia sẻ chung một collision domain.

#### Kết luận

Không có thiết bị nào trong 4 thiết bị này "tốt hơn" thiết bị còn lại một cách tuyệt đối — mỗi thiết bị được thiết kế để giải quyết đúng một tầng vấn đề cụ thể trong OSI. Switch giải quyết bài toán trong một mạng, router giải quyết bài toán giữa nhiều mạng, và access point giải quyết bài toán không dây hóa hạ tầng có dây. Biết chính xác một sự cố đang nằm ở tầng nào là bước đầu tiên để biết nên nhìn vào thiết bị nào.