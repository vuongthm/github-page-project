---
title: "Encapsulation: Dữ Liệu Biến Hình Qua Từng Tầng"
description: "Một file ảnh không đi thẳng từ máy này sang máy khác — nó bị 'gói' lại nhiều lần, mỗi lần thêm một lớp thông tin, trước khi thực sự lên đường."
tags: ["encapsulation", "data-flow", "fundamentals"]
date: "2025-7-1"
lang: "vi"
weight: 4
locked: false
---

# Encapsulation: Dữ Liệu Biến Hình Qua Từng Tầng

Ở bài về OSI, có một chi tiết được nhắc nhưng chưa giải thích kỹ: dữ liệu "đi từ tầng 7 xuống tầng 1" nghĩa là gì, về mặt cụ thể? Câu trả lời là **encapsulation** — quá trình mỗi tầng thêm một lớp thông tin riêng của nó vào dữ liệu, giống như gói một món hàng vào nhiều lớp bao bì trước khi gửi đi.

![Data encapsulation OSI layers diagram](/media/notes/fundamentals/data-encap.png)

## Khi không có encapsulation

Nếu gửi dữ liệu thô, không có bất kỳ thông tin bổ sung nào, thiết bị nhận sẽ không biết: dữ liệu này thuộc ứng dụng nào, cần gửi đến cổng (port) nào, địa chỉ IP đích là gì, hay thiết bị vật lý nào trong mạng cục bộ cần chuyển nó tới. Không có encapsulation, một luồng bit chỉ là một luồng bit — không mang theo bất kỳ chỉ dẫn nào để hệ thống phía nhận biết phải xử lý nó ra sao.

## Encapsulation là gì?

Encapsulation là quá trình mỗi tầng trong mô hình network (OSI hoặc TCP/IP) thêm một **header** riêng của tầng đó vào phía trước dữ liệu nhận được từ tầng ngay trên nó, trước khi chuyển tiếp xuống tầng thấp hơn. Quá trình ngược lại — khi dữ liệu đến nơi và các header được bóc dần ra ở từng tầng tương ứng — gọi là **de-encapsulation**.

Điều quan trọng cần nắm: mỗi tầng chỉ đọc và xử lý header của chính nó, còn phần dữ liệu phía trong (bao gồm cả header của các tầng trên) được xem như một "hộp đen" không cần quan tâm tới nội dung.

## Cách encapsulation hoạt động qua từng tầng

Theo mô hình TCP/IP (4 tầng), khi một ứng dụng gửi dữ liệu đi, quá trình diễn ra theo thứ tự sau:

1. **Application layer**: dữ liệu ứng dụng (ví dụ nội dung một request HTTP) được tạo ra, gọi là **data**.
2. **Transport layer**: thêm TCP hoặc UDP header vào trước data — header này chứa thông tin cổng nguồn, cổng đích, và (với TCP) số thứ tự để đảm bảo dữ liệu đến đúng thứ tự. Sau bước này, đơn vị dữ liệu được gọi là **segment** (với TCP) hoặc **datagram** (với UDP).
3. **Internet layer**: thêm IP header vào trước segment — chứa địa chỉ IP nguồn và đích. Đơn vị dữ liệu lúc này gọi là **packet**.
4. **Link layer**: thêm header chứa địa chỉ MAC nguồn và đích, cùng với một phần đuôi (trailer) dùng để kiểm tra lỗi. Đơn vị dữ liệu lúc này gọi là **frame**.

Sau bước 4, frame được chuyển thành tín hiệu điện, ánh sáng, hoặc sóng radio để truyền qua đường vật lý.

### Tên gọi từng đơn vị dữ liệu (PDU) theo tầng

Đơn vị dữ liệu ở mỗi tầng có tên riêng, gọi chung là **PDU (Protocol Data Unit)**. Đây là các thuật ngữ được dùng thống nhất trong toàn ngành, kể cả trong tài liệu RFC của IETF:

| Tầng (TCP/IP) | Tên PDU | Header chứa gì |
|---|---|---|
| Application | Data | Nội dung ứng dụng (HTTP request, email...) |
| Transport | Segment (TCP) / Datagram (UDP) | Port nguồn, port đích, số thứ tự (TCP) |
| Internet | Packet | Địa chỉ IP nguồn, IP đích |
| Link | Frame | Địa chỉ MAC nguồn, MAC đích |

### Ở phía nhận: quá trình diễn ra ngược lại

Khi frame đến thiết bị nhận, quá trình de-encapsulation diễn ra từ tầng 1 lên tầng 4 (hoặc tầng 1 lên tầng 7 nếu tính theo OSI):

1. Link layer đọc và bóc MAC header, xác nhận frame đúng là gửi cho mình, chuyển phần còn lại (packet) lên tầng trên.
2. Internet layer đọc IP header, xác nhận đúng IP đích, chuyển segment/datagram lên tầng trên.
3. Transport layer đọc port đích trong header, xác định đúng ứng dụng nào trên máy cần nhận dữ liệu này, chuyển data lên tầng Application.
4. Application layer nhận được đúng dữ liệu gốc mà tầng Application ở máy gửi đã tạo ra ban đầu.

Nhờ mỗi tầng chỉ quan tâm header của chính nó, quá trình này hoạt động chính xác dù hai máy có phần cứng, hệ điều hành, hay phần mềm hoàn toàn khác nhau — miễn là cả hai tuân theo cùng chuẩn giao thức ở mỗi tầng.

## So sánh: encapsulation giống việc gửi bưu phẩm

Một cách hình dung dễ nhớ: gửi một lá thư (data) vào trong một phong bì nhỏ có ghi tên người nhận cụ thể trong nhà (giống Transport header ghi port), phong bì đó lại được đặt vào một hộp có ghi địa chỉ nhà đầy đủ (giống IP header ghi địa chỉ mạng), và hộp đó được đặt lên một xe chuyển hàng có ghi tuyến đường cụ thể trong khu vực (giống MAC header dùng để chuyển trong mạng cục bộ). Người nhận cuối cùng sẽ bóc từng lớp theo đúng thứ tự ngược lại để lấy được lá thư gốc.

## Nhầm lẫn thường gặp

- Nhầm giữa **packet** và **frame** — hai thuật ngữ này không thể dùng thay thế nhau: packet là đơn vị ở tầng Internet (chứa IP header), frame là đơn vị ở tầng Link (chứa MAC header, và đã bao gồm cả packet bên trong nó).
- Nghĩ rằng mỗi tầng "sửa" hoặc "đọc hiểu" toàn bộ dữ liệu — thực tế mỗi tầng chỉ xử lý phần header của chính nó, phần còn lại được coi là payload không cần quan tâm.
- Bỏ qua vai trò của trailer ở tầng Link (thường là trường kiểm tra lỗi FCS — Frame Check Sequence) — đây là phần duy nhất được thêm vào ở *cuối* dữ liệu, khác với các header khác đều thêm ở đầu.

#### Kết luận

Encapsulation là lý do vì sao một tầng có thể thay đổi công nghệ (ví dụ đổi Wi-Fi sang Ethernet ở tầng Link) mà không cần bất kỳ tầng nào khác biết đến sự thay đổi đó — mỗi lớp bao bì chỉ cần đúng chuẩn ở lớp của mình, không cần quan tâm những lớp còn lại được gói ra sao.