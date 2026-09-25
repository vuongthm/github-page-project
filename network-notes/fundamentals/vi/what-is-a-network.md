---
title: "Network Là Gì?"
description: "Trước khi nói về IP, TCP, hay DNS, cần hiểu network giải quyết vấn đề gì và vì sao mọi thứ trong đó đều xoay quanh một chữ: chuẩn hóa."
tags: ["basics", "network", "fundamentals"]
date: "2025-7-1"
lang: "vi"
weight: 1
locked: false
---

# Network Là Gì?

Hai máy tính đặt cạnh nhau, cùng cắm điện, cùng chạy, nhưng không nói được với nhau — cho đến khi có ai đó nối một sợi cáp giữa chúng và cả hai đồng ý cùng một cách "nói chuyện". Network, ở bản chất sâu nhất, không phải là dây cáp hay sóng Wi-Fi. Nó là bộ quy tắc để những thiết bị hoàn toàn xa lạ có thể hiểu nhau.

![Sơ đồ các thiết bị kết nối trong một network](/media/notes/fundamentals/layered-stack.png)

## Khi không có "quy tắc chung"

Hình dung một công ty có 50 máy tính, mỗi máy dùng một hãng khác nhau, một hệ điều hành khác nhau. Nếu không có bất kỳ chuẩn nào, máy A gửi dữ liệu theo cách của riêng nó, máy B đọc dữ liệu theo cách của riêng nó — kết quả là không ai hiểu ai, dù dây đã nối đúng, điện đã có đủ. Đây chính là bài toán mà networking sinh ra để giải: làm sao hai thiết bị bất kỳ, sản xuất bởi hai công ty bất kỳ, chạy hệ điều hành bất kỳ, vẫn có thể trao đổi dữ liệu một cách đáng tin cậy.

## Network là gì?

Một network, hiểu đơn giản, là tập hợp các thiết bị (gọi là **node**) được kết nối với nhau bằng đường truyền (gọi là **link**) để chia sẻ dữ liệu và tài nguyên. Node có thể là máy tính, điện thoại, máy in, hay chính các thiết bị mạng như router. Link có thể là cáp đồng, cáp quang, hoặc sóng vô tuyến.

Nhưng có node và có link thôi chưa đủ để gọi là network — cần thêm một thành phần vô hình: **protocol** (giao thức), tức bộ quy tắc quy định cách các node "nói chuyện" với nhau. Không có protocol, network chỉ là một mớ dây nối các máy không hiểu nhau.

## Network hoạt động như thế nào, ở mức khái quát

Dù mạng nhỏ hay lớn, mọi network đều xoay quanh ba câu hỏi cơ bản mà protocol phải trả lời:

1. **Ai đang nói với ai?** — cần một cách định danh thiết bị, đó là lý do có địa chỉ IP và địa chỉ MAC.
2. **Dữ liệu đi bằng đường nào?** — cần cơ chế định tuyến (routing) để dữ liệu tìm được đường từ nguồn đến đích, kể cả khi đích ở cách xa hàng nghìn km.
3. **Làm sao biết dữ liệu đến đúng và đủ?** — cần cơ chế kiểm soát lỗi, xác nhận, và xử lý khi có gì đó bị mất trên đường truyền.

Ba câu hỏi này chính là ba câu hỏi mà mọi note trong series này, từ IP addressing đến TCP, DNS, đều đang tìm cách trả lời chi tiết hơn.

## Phân loại theo quy mô

| Loại | Phạm vi | Ví dụ |
|------|---------|-------|
| PAN (Personal Area Network) | Vài mét | Bluetooth giữa điện thoại và tai nghe |
| LAN (Local Area Network) | Một tòa nhà, một văn phòng | Mạng Wi-Fi trong nhà, mạng công ty |
| MAN (Metropolitan Area Network) | Một thành phố | Mạng cáp của nhà cung cấp dịch vụ trong một đô thị |
| WAN (Wide Area Network) | Liên vùng, liên quốc gia | Internet, mạng nội bộ của công ty đa quốc gia |

Ranh giới giữa các loại này không tuyệt đối — Internet thực chất là một WAN khổng lồ được tạo thành từ vô số LAN nhỏ hơn nối lại với nhau. Đây cũng là ý tưởng cốt lõi sẽ quay lại nhiều lần trong series: network lớn luôn được xây từ network nhỏ hơn, theo cùng một logic.

### Vì sao chuẩn hóa lại quan trọng đến vậy

Lý do networking hiện đại vận hành trơn tru là vì các chuẩn được thống nhất công khai, không phụ thuộc vào một hãng nào. Các tổ chức như IETF (Internet Engineering Task Force) công bố các chuẩn dưới dạng tài liệu RFC (Request for Comments) — chính nhờ vậy mà một chiếc laptop, một chiếc điện thoại, một server ở đầu kia thế giới, dù khác hãng khác đời, vẫn nói được cùng một "ngôn ngữ" khi giao tiếp qua Internet.

## Khi thiếu chuẩn hóa, hoặc chuẩn bị vi phạm

- Hai thiết bị dùng hai chuẩn khác nhau (ví dụ một bên dùng IPv4, một bên chỉ hiểu IPv6 mà không có cầu nối) sẽ không thể giao tiếp, dù cả hai đều "khỏe mạnh" về phần cứng.
- Một thiết bị cấu hình sai địa chỉ, hoặc dùng địa chỉ trùng với thiết bị khác trong cùng mạng, sẽ gây xung đột (conflict) khiến cả hai bên mất kết nối.
- Một link vật lý bị đứt hoặc chập, dữ liệu vẫn được gửi đi theo đúng protocol, nhưng không bao giờ đến đích.

Những vấn đề này nghe cơ bản, nhưng chính là điểm khởi đầu của phần lớn các lỗi networking trong thực tế — phần lớn sự cố không nằm ở protocol phức tạp, mà ở những nền tảng tưởng như đơn giản này.

#### Kết luận

Network không phải là dây cáp hay sóng Wi-Fi — nó là sự đồng thuận. Mọi khái niệm phức tạp hơn sẽ gặp trong series này, từ địa chỉ IP đến TCP hay DNS, đều chỉ là những lớp chuẩn hóa chi tiết hơn được xây trên chính ý tưởng nền tảng này: để hai thiết bị xa lạ hiểu nhau, cả hai phải đồng ý nói cùng một thứ ngôn ngữ.