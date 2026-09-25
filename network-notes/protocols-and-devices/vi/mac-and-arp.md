---
title: "MAC Address và ARP"
description: "Switch chuyển tiếp dữ liệu dựa vào địa chỉ MAC — nhưng ứng dụng chỉ biết địa chỉ IP của đích đến. ARP là mắt xích âm thầm nối hai thế giới địa chỉ này lại với nhau."
tags: ["mac", "arp", "layer2"]
date: "2026-07-03"
lang: "vi"
weight: 9
locked: false
---

# MAC Address và ARP

Ở bài trước, switch được mô tả là chuyển tiếp dữ liệu dựa vào địa chỉ MAC, còn router (và cả ứng dụng) làm việc với địa chỉ IP. Nhưng khi máy A muốn gửi dữ liệu đến máy B trong cùng mạng, máy A chỉ biết địa chỉ IP của B — vậy làm sao nó tìm ra địa chỉ MAC tương ứng để nhờ switch chuyển tiếp đúng chỗ? Đây là công việc của **ARP**.

<!--
Cách tìm ảnh:
1. Tìm trên Google Images với từ khóa: "ARP request reply diagram" hoặc "ARP protocol MAC IP resolution"
2. Nguồn gợi ý: Cisco Networking Academy, GeeksforGeeks, Cloudflare Learning Center
3. Lọc theo "Tools" > "Type" > "Clip Art" hoặc "Line Drawing"
4. Nội dung ảnh cần có: máy A gửi ARP request dạng broadcast đến toàn bộ mạng, chỉ máy B (đúng IP) trả lời bằng ARP reply chứa MAC address, các máy khác bỏ qua
5. Lưu ảnh định dạng .png, đặt tên file: arp-resolution.png
-->
![ARP request and reply resolution process](/media/notes/protocols-and-devices/arp-resolution.png)
*Quá trình ARP: máy A hỏi toàn mạng "IP này là của ai", chỉ đúng chủ nhân IP đó trả lời bằng địa chỉ MAC của mình.*

## Khi hai địa chỉ không nói cùng ngôn ngữ

Hình dung máy A (`192.168.1.10`) muốn gửi dữ liệu đến máy B (`192.168.1.20`) trong cùng mạng LAN. Máy A biết địa chỉ IP của B, nhưng switch — thiết bị sẽ thực sự chuyển tiếp frame — hoàn toàn không quan tâm đến địa chỉ IP, nó chỉ đọc địa chỉ MAC. Nếu không có cách nào để máy A tìm ra địa chỉ MAC tương ứng với IP của B, frame sẽ không thể được đóng gói đúng, và switch sẽ không biết gửi đi đâu.

## MAC address là gì?

MAC address (Media Access Control address) là một địa chỉ vật lý dài 48 bit, được gán cố định vào mỗi card mạng (NIC — Network Interface Card) ngay từ khi sản xuất, thường viết dưới dạng 6 cặp số hex, ví dụ `00:1A:2B:3C:4D:5E`. Khác với địa chỉ IP (có thể thay đổi tùy theo mạng thiết bị đang kết nối vào), MAC address về lý thuyết là duy nhất trên toàn cầu và không thay đổi theo thiết bị mạng, vì 24 bit đầu tiên (gọi là **OUI — Organizationally Unique Identifier**) được IEEE cấp riêng cho từng nhà sản xuất phần cứng.

### MAC address và IP address — hai lớp định danh khác nhau

| | MAC Address | IP Address |
|---|---|---|
| Tầng OSI | Data Link (Layer 2) | Network (Layer 3) |
| Phạm vi hoạt động | Trong cùng một mạng cục bộ | Xuyên qua nhiều mạng khác nhau |
| Có thể thay đổi? | Cố định theo phần cứng (dù có thể giả lập/spoof) | Thay đổi tùy theo mạng đang kết nối |
| Độ dài | 48 bit | 32 bit (IPv4) |

Hai lớp địa chỉ này tồn tại song song vì chúng phục vụ hai mục đích khác nhau: IP dùng để định tuyến dữ liệu đi xa qua nhiều mạng, còn MAC dùng để xác định chính xác thiết bị nào trong phạm vi một mạng cục bộ.

## ARP là gì?

ARP (Address Resolution Protocol), định nghĩa trong RFC 826 (1982), là giao thức dùng để tìm ra địa chỉ MAC tương ứng với một địa chỉ IP đã biết, trong phạm vi cùng một mạng cục bộ. Nói ngắn gọn: ARP là cầu nối giữa hai lớp địa chỉ IP và MAC.

## Cách ARP hoạt động

Quá trình phân giải ARP diễn ra qua các bước sau:

1. Máy A cần gửi dữ liệu đến `192.168.1.20`, nhưng chưa biết địa chỉ MAC tương ứng.
2. Máy A kiểm tra **ARP cache** của chính nó (bảng lưu tạm các cặp IP–MAC đã biết trước đó) — nếu đã có sẵn, dùng luôn, không cần các bước sau.
3. Nếu chưa có trong cache, máy A gửi một **ARP request** dưới dạng **broadcast** (gửi tới toàn bộ thiết bị trong mạng), với nội dung tương tự: "Ai đang có địa chỉ IP `192.168.1.20`? Hãy cho tôi biết địa chỉ MAC của bạn."
4. Mọi thiết bị trong mạng đều nhận được ARP request này, nhưng chỉ thiết bị nào thực sự sở hữu địa chỉ IP đó (máy B) mới phản hồi.
5. Máy B gửi lại một **ARP reply**, dưới dạng **unicast** (chỉ gửi riêng cho máy A), chứa địa chỉ MAC của chính nó.
6. Máy A lưu cặp IP–MAC này vào ARP cache của mình, và bắt đầu gửi dữ liệu thực sự đến máy B bằng địa chỉ MAC vừa nhận được.

### Vì sao ARP request phải là broadcast

Vì tại thời điểm gửi request, máy A hoàn toàn không biết địa chỉ MAC của máy B (đó chính là thứ nó đang cần tìm) — nên nó không thể gửi trực tiếp (unicast) đến máy B, mà buộc phải hỏi toàn bộ mạng cùng lúc. Đây cũng là lý do ARP chỉ hoạt động được trong phạm vi một mạng cục bộ (broadcast domain) — broadcast không thể vượt qua router để sang mạng khác.

## ARP cache — vì sao cần lưu tạm

Nếu mỗi lần gửi dữ liệu đều phải thực hiện lại toàn bộ quy trình ARP request/reply, mạng sẽ tốn rất nhiều băng thông cho việc "hỏi lại" những thông tin đã biết. Vì vậy, mỗi thiết bị duy trì một ARP cache, lưu tạm các cặp IP–MAC trong một khoảng thời gian nhất định (thường vài phút, tùy hệ điều hành), trước khi bị xóa và cần phân giải lại nếu có nhu cầu gửi dữ liệu tiếp.

Có thể xem ARP cache hiện tại trên hầu hết hệ điều hành bằng lệnh:
```
arp -a
```

## Lỗi thường gặp và rủi ro bảo mật

- **ARP cache lỗi thời**: nếu một thiết bị đổi card mạng (dẫn đến đổi MAC) nhưng ARP cache của các máy khác chưa cập nhật, dữ liệu có thể bị gửi đến địa chỉ MAC cũ, gây mất kết nối tạm thời cho đến khi cache hết hạn và phân giải lại.
- **ARP spoofing (hay ARP poisoning)**: vì ARP không có cơ chế xác thực người trả lời, một thiết bị độc hại trong mạng có thể giả mạo ARP reply, tự nhận mình sở hữu một địa chỉ IP không thuộc về nó — từ đó đánh lừa các máy khác gửi dữ liệu nhầm đến mình, phục vụ cho việc nghe lén (man-in-the-middle). Đây là lý do các mạng doanh nghiệp quan trọng thường triển khai thêm các cơ chế bảo vệ như Dynamic ARP Inspection trên switch.
- **Nhầm lẫn phạm vi hoạt động**: nghĩ rằng ARP có thể phân giải được địa chỉ MAC của một thiết bị ở mạng khác (qua Internet) — thực tế ARP chỉ hoạt động trong cùng một broadcast domain; giao tiếp giữa các mạng khác nhau do router xử lý, không cần đến ARP xuyên mạng.

#### Kết luận

ARP là một trong những giao thức "âm thầm" nhất trong networking — chạy ở tầng rất thấp, không ai trực tiếp gọi nó, nhưng gần như mọi giao tiếp trong mạng LAN đều phụ thuộc vào nó để hoạt động đúng. Hiểu ARP chính là hiểu cách hai lớp địa chỉ IP và MAC, vốn được thiết kế độc lập với nhau, được kết nối lại thành một hệ thống thống nhất trong thực tế.