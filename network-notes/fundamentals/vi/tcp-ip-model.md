---
title: "Mô Hình TCP/IP: 4 Tầng Thực Dụng"
description: "OSI có 7 tầng để mô tả đầy đủ mọi khái niệm, nhưng Internet đang chạy trên một mô hình gọn hơn — 4 tầng. Vì sao gọn hơn lại thắng?"
tags: ["tcp-ip", "model", "fundamentals"]
date: "2025-7-1"
lang: "vi"
weight: 3
locked: false
---

# Mô Hình TCP/IP: 4 Tầng Thực Dụng

OSI ra đời năm 1984 với 7 tầng, được thiết kế cẩn thận, tách bạch rõ ràng — nhưng Internet mà mọi người dùng hôm nay không chạy trên OSI. Nó chạy trên một mô hình khác, ra đời sớm hơn cả OSI, chỉ có 4 tầng: TCP/IP. Đây là một trong những nghịch lý thú vị nhất của lịch sử networking — mô hình "ít đầy đủ hơn" lại là mô hình chiến thắng trên thực tế.

![Sơ đồ so sánh mô hình OSI và mô hình TCP/IP](/media/notes/fundamentals/tcp-ip-model.png)

## Khi có 2 mô hình cùng tồn tại, cái nào mới đúng?

Đây là câu hỏi khiến rất nhiều người mới học networking bối rối: học OSI xong, đến lúc thực hành lại nghe nói "Internet dùng TCP/IP" — vậy OSI vô dụng? Không hẳn. Vấn đề không phải là mô hình nào "đúng hơn", mà là hai mô hình được sinh ra cho hai mục đích khác nhau, và hiểu rõ sự khác nhau này sẽ giúp không còn nhầm lẫn mỗi khi đọc tài liệu kỹ thuật.

## TCP/IP là gì?

TCP/IP (Transmission Control Protocol/Internet Protocol) là bộ giao thức thực tế được dùng để vận hành Internet, phát triển bởi Bộ Quốc phòng Mỹ (DARPA) từ những năm 1970, trước khi OSI được ISO công bố. Khác với OSI — một mô hình tham chiếu mang tính lý thuyết — TCP/IP là mô hình được xây dựng song song với việc triển khai giao thức thật, nên nó gọn hơn và thực dụng hơn.

TCP/IP chia thành 4 tầng, ít hơn OSI 3 tầng, vì một số tầng của OSI được gộp lại do trong thực tế chúng thường được xử lý cùng nhau bởi một phần mềm hoặc một lớp logic duy nhất.

## Cách 4 tầng ánh xạ với 7 tầng OSI

| TCP/IP (4 tầng) | Tương ứng OSI | Vai trò |
|---|---|---|
| Application | Application + Presentation + Session (5,6,7) | Giao thức ứng dụng, định dạng dữ liệu, quản lý phiên — tất cả gộp vào một tầng |
| Transport | Transport (4) | Đảm bảo dữ liệu đến đúng/đủ (TCP) hoặc gửi nhanh không cần đảm bảo (UDP) |
| Internet | Network (3) | Định địa chỉ và định tuyến giữa các mạng (IP) |
| Link (hay Network Access) | Data Link + Physical (1,2) | Truyền dữ liệu trong mạng cục bộ và tín hiệu vật lý — gộp lại thành một tầng |

Nhìn vào bảng này sẽ thấy: TCP/IP không "bỏ" mất phần nào của OSI, nó chỉ **gộp nhóm những tầng thường đi cùng nhau trong thực tế triển khai**. Ví dụ tầng Application của TCP/IP xử lý cả việc định dạng dữ liệu (vốn là việc của Presentation trong OSI) và quản lý phiên kết nối (vốn là việc của Session) — vì trong hầu hết ứng dụng thực tế, ba việc này được viết trong cùng một phần mềm, không cần tách riêng thành 3 lớp module khác nhau.

### Vì sao TCP/IP "thắng" trên thực tế

Có ba lý do chính, ghi nhận trong nhiều tài liệu lịch sử networking (bao gồm Internet Society và IETF):

1. **TCP/IP được triển khai trước, và hoạt động được** — trong khi OSI vẫn đang là bản thiết kế lý thuyết. Một giao thức chạy được luôn có lợi thế hơn một chuẩn "hoàn hảo trên giấy".
2. **TCP/IP đơn giản hơn để cài đặt** — ít tầng đồng nghĩa với ít lớp trừu tượng (abstraction) phải xử lý khi viết phần mềm mạng.
3. **Chi phí chuyển đổi quá lớn** — đến khi OSI hoàn thiện, TCP/IP đã được triển khai rộng khắp các trường đại học và tổ chức nghiên cứu ở Mỹ thông qua ARPANET, khiến việc thay thế toàn bộ hạ tầng bằng OSI trở nên không thực tế về mặt kinh tế.

## Vậy học OSI để làm gì, nếu Internet không chạy trên nó?

OSI vẫn giữ giá trị lớn ở vai trò **ngôn ngữ chung để mô tả và debug**. Khi một kỹ sư nói "vấn đề này ở Layer 3", tất cả các kỹ sư khác trên thế giới, dù dùng công cụ hay hãng thiết bị nào, đều hiểu ngay là đang nói về vấn đề định tuyến/IP — vì thuật ngữ "Layer" được thống nhất theo OSI, không theo TCP/IP. Nói cách khác: **triển khai theo TCP/IP, nhưng nói chuyện và debug theo ngôn ngữ OSI** là thực tế phổ biến nhất trong ngành.

## Nhầm lẫn thường gặp

- Nghĩ rằng TCP/IP "mới hơn nên tốt hơn" OSI — thực tế TCP/IP ra đời *trước* OSI, và hai mô hình phục vụ hai mục đích khác nhau (một để triển khai, một để mô tả/tham chiếu), không phải quan hệ "phiên bản cũ - mới".
- Cố gắng ép một giao thức cụ thể phải nằm "chính xác" vào một tầng OSI duy nhất — trong thực tế, có giao thức trải dài chức năng qua nhiều tầng, việc phân loại chỉ nên xem là công cụ hỗ trợ tư duy, không phải luật tuyệt đối.
- Nhầm giữa tầng "Internet" của TCP/IP với "Internet" theo nghĩa thông thường (mạng toàn cầu) — trong ngữ cảnh mô hình, "Internet layer" chỉ đơn giản là tầng xử lý định địa chỉ IP và định tuyến, không phải toàn bộ hạ tầng Internet.

#### Kết luận

TCP/IP thắng không phải vì nó hoàn thiện hơn về lý thuyết, mà vì nó chạy được trước và đủ tốt để không ai cần thay thế nó nữa. Đây là một bài học lặp lại nhiều lần trong công nghệ: chuẩn "đủ tốt và chạy trước" thường thắng chuẩn "hoàn hảo nhưng đến sau".