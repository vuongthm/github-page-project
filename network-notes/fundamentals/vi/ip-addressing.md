---
title: "Địa Chỉ IP: Cấu Trúc và Phân Loại"
description: "Mỗi thiết bị trên Internet cần một địa chỉ để được tìm thấy — nhưng địa chỉ đó được cấu trúc thế nào, và vì sao có những địa chỉ 'không dùng được' ngoài Internet?"
tags: ["ip", "addressing", "fundamentals"]
date: "2026-07-01"
lang: "vi"
weight: 5
locked: false
---

# Địa Chỉ IP: Cấu Trúc và Phân Loại

Ở bài về encapsulation, IP header xuất hiện với vai trò chứa "địa chỉ IP nguồn và đích" — nhưng địa chỉ đó thực chất là gì, được viết ra sao, và tại sao có những địa chỉ IP không bao giờ xuất hiện được trên Internet công cộng? Đây là những câu hỏi mà bất kỳ ai bắt đầu cấu hình mạng cũng sẽ gặp trong vài phút đầu tiên.

![Cấu trúc phân rã sơ đồ địa chỉ IPv4 theo Octet và Nhị phân](/media/notes/fundamentals/structure-ipddr.png)

## Khi hai thiết bị dùng chung địa chỉ

Hình dung một mạng công ty có 200 máy, nhưng vì sơ suất, hai máy được cấu hình cùng một địa chỉ IP. Ngay lập tức cả hai sẽ gặp lỗi kết nối chập chờn, hoặc mất kết nối hoàn toàn — vì hệ thống mạng không còn cách nào xác định chính xác dữ liệu cần gửi đến máy nào. Đây gọi là **IP conflict**, và nó là ví dụ rõ nhất cho việc: địa chỉ IP không phải một cái tên trang trí, mà là định danh duy nhất bắt buộc phải chính xác để network hoạt động.

## Địa chỉ IP là gì?

Địa chỉ IP (Internet Protocol address) là một số định danh duy nhất được gán cho mỗi thiết bị tham gia vào một mạng sử dụng giao thức IP, dùng để xác định thiết bị đó khi định tuyến (routing) và gửi dữ liệu. Phiên bản đang được dùng phổ biến nhất hiện nay là **IPv4**, được định nghĩa lần đầu trong RFC 791 (1981) của IETF.

## Cấu trúc của một địa chỉ IPv4

Một địa chỉ IPv4 gồm 32 bit, được viết dưới dạng 4 nhóm số cách nhau bởi dấu chấm, gọi là **dotted-decimal notation**. Ví dụ: `192.168.1.10`.

### Từ binary đến decimal

Mỗi nhóm số (gọi là **octet**, vì gồm đúng 8 bit) có giá trị từ 0 đến 255:

```
192      .  168      .  1        .  10
11000000 .  10101000 .  00000001 .  00001010
```

32 bit = 4 octet × 8 bit, và mỗi octet có thể biểu diễn 2^8 = 256 giá trị khác nhau (từ 0 đến 255) — đây là lý do vì sao không bao giờ thấy một địa chỉ IPv4 có octet lớn hơn 255.

### Network portion và Host portion

Một địa chỉ IP không phải là một chuỗi số vô nghĩa — nó được chia thành 2 phần logic:

1. **Network portion**: phần xác định địa chỉ này thuộc mạng nào.
2. **Host portion**: phần xác định thiết bị cụ thể nào trong mạng đó.

Ranh giới giữa 2 phần này không cố định — nó được quyết định bởi **subnet mask**, chi tiết về cách tính ranh giới này sẽ là nội dung của bài tiếp theo trong series (Subnetting). Ở bài này, chỉ cần nắm nguyên lý: địa chỉ IP giống như địa chỉ nhà — phần "tên đường, khu vực" giống network portion, phần "số nhà cụ thể" giống host portion.

## Phân loại địa chỉ IP theo phạm vi sử dụng

Không phải mọi địa chỉ IP đều dùng được trên Internet công cộng. IETF, thông qua RFC 1918, đã dành riêng một số dải địa chỉ để dùng nội bộ, không định tuyến được ra Internet:

| Loại | Dải địa chỉ | Phạm vi sử dụng |
|---|---|---|
| Private (RFC 1918) | `10.0.0.0 – 10.255.255.255` | Mạng nội bộ lớn (doanh nghiệp) |
| Private (RFC 1918) | `172.16.0.0 – 172.31.255.255` | Mạng nội bộ vừa |
| Private (RFC 1918) | `192.168.0.0 – 192.168.255.255` | Mạng nội bộ nhỏ (gia đình, văn phòng nhỏ) |
| Public | Tất cả dải còn lại (trừ các dải đặc biệt) | Định tuyến được trực tiếp trên Internet |
| Loopback | `127.0.0.0 – 127.255.255.255` | Máy tự gọi chính mình (`127.0.0.1` = localhost) |

### Vì sao cần địa chỉ private riêng?

IPv4 chỉ có tổng cộng khoảng 4,3 tỷ địa chỉ (2^32) — không đủ để cấp riêng cho từng thiết bị trên toàn cầu khi số lượng thiết bị kết nối Internet đã vượt xa con số đó. Giải pháp được dùng phổ biến là để mỗi mạng nội bộ (nhà, công ty) dùng một dải địa chỉ private giống nhau, và dùng **NAT** (Network Address Translation) để "dịch" các địa chỉ private này sang một địa chỉ public chung khi đi ra Internet. NAT sẽ là chủ đề riêng ở phần Security & Optimization trong series, vì đây là kỹ thuật khá quan trọng và cần được giải thích kỹ.

### Địa chỉ Broadcast

Trong mỗi dải mạng, địa chỉ cuối cùng (ví dụ `192.168.1.255` trong mạng `192.168.1.0/24`) được dành riêng làm địa chỉ **broadcast** — gửi dữ liệu đến địa chỉ này nghĩa là gửi đến tất cả thiết bị trong mạng đó cùng lúc, không phải một thiết bị cụ thể.

## Sự khác biệt với IPv6

IPv4 chỉ có khoảng 4,3 tỷ địa chỉ, và con số này đã cạn kiệt trên thực tế ở nhiều khu vực từ khoảng năm 2011 (theo thông báo chính thức của IANA). Đây là lý do IPv6 được phát triển — với 128 bit thay vì 32 bit, IPv6 cung cấp một số lượng địa chỉ gần như không thể cạn kiệt trong tương lai gần. IPv6 sẽ có một bài riêng trong series (phần Advanced), vì cấu trúc và cách viết của nó khác biệt đáng kể so với IPv4.

## Lỗi thường gặp

- Gán trùng địa chỉ IP cho 2 thiết bị trong cùng mạng — gây IP conflict, mất kết nối chập chờn hoặc hoàn toàn cho cả hai máy.
- Nhầm địa chỉ private với địa chỉ public — cố gắng truy cập một địa chỉ private (ví dụ `192.168.1.10`) từ bên ngoài Internet sẽ không bao giờ thành công, vì các router trên Internet công cộng được cấu hình để không định tuyến các dải RFC 1918.
- Gán địa chỉ broadcast hoặc network address (địa chỉ đầu tiên của dải, ví dụ `192.168.1.0`) cho một thiết bị cụ thể — đây là 2 địa chỉ có vai trò đặc biệt, không dùng được cho host thông thường.

#### Kết luận

Một địa chỉ IP không chỉ là "số để nhận diện máy" — nó mang trong mình cả thông tin về việc máy đó thuộc mạng nào, và phạm vi nó được phép xuất hiện (private hay public). Hiểu đúng cấu trúc này là nền tảng bắt buộc trước khi bước vào subnetting — nơi ranh giới network/host portion sẽ được tính toán một cách cụ thể.