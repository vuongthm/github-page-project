---
title: "Subnetting: Chia Nhỏ Để Quản Lý"
description: "Một dải IP lớn có thể chia thành nhiều mạng nhỏ hơn — subnetting là kỹ thuật quyết định ranh giới network/host portion đã nhắc ở bài trước, và vì sao cần chia nhỏ như vậy."
tags: ["subnetting", "fundamentals"]
date: "2026-7-2"
lang: "vi"
weight: 6
locked: false
---

# Subnetting: Chia Nhỏ Để Quản Lý

Ở bài về địa chỉ IP, có một câu để ngỏ: ranh giới giữa network portion và host portion không cố định, mà do **subnet mask** quyết định. Đây chính là chủ đề của bài này — subnetting, kỹ thuật cho phép chia một dải địa chỉ IP lớn thành nhiều mạng nhỏ hơn, mỗi mạng nhỏ tự quản lý một nhóm thiết bị riêng.

![Subnet mask network host bits](/media/notes/fundamentals/subnet-mask.png)

## Khi không chia nhỏ mạng

Hình dung một công ty có 1000 máy, tất cả nằm trong cùng một mạng lớn duy nhất, không chia nhỏ. Mọi thiết bị trong mạng đó đều nằm trong cùng một **broadcast domain** — nghĩa là một gói tin broadcast (gửi cho tất cả) từ bất kỳ máy nào sẽ được gửi tới toàn bộ 1000 máy còn lại. Khi lưu lượng broadcast tăng lên (điều xảy ra tự nhiên khi có nhiều thiết bị), toàn bộ mạng sẽ chậm đi, kể cả các máy không liên quan gì đến gói tin đó. Đây là lý do các mạng lớn luôn cần được chia nhỏ.

## Subnetting là gì?

Subnetting là quá trình chia một dải địa chỉ IP (một network) thành nhiều dải nhỏ hơn (gọi là **subnet**), bằng cách "mượn" một số bit từ phần host portion để biến chúng thành một phần mở rộng của network portion. Việc này được thực hiện thông qua **subnet mask** — một chuỗi 32 bit dùng để xác định bit nào thuộc network portion, bit nào thuộc host portion.

## Cách subnet mask hoạt động

Subnet mask có cùng độ dài với địa chỉ IP (32 bit với IPv4), trong đó bit `1` đại diện cho network portion, bit `0` đại diện cho host portion.

```
IP address:   192.168.1.10   → 11000000.10101000.00000001.00001010
Subnet mask:  255.255.255.0  → 11111111.11111111.11111111.00000000
                                └────── network ──────┘└─ host ─┘
```

Trong ví dụ này, 24 bit đầu (3 octet đầu) là network portion, 8 bit cuối là host portion — nghĩa là mạng này có thể chứa tối đa 2^8 = 256 địa chỉ host (trừ đi 2 địa chỉ đặc biệt là network address và broadcast address, còn lại 254 địa chỉ dùng được thực tế).

### CIDR notation — cách viết gọn hơn

Thay vì viết đầy đủ subnet mask (`255.255.255.0`), cách viết phổ biến hơn trong thực tế là **CIDR notation** (Classless Inter-Domain Routing, định nghĩa trong RFC 4632) — chỉ cần ghi số bit network portion sau dấu gạch chéo:

```
192.168.1.10/24
```

Nghĩa là 24 bit đầu là network portion — tương đương với subnet mask `255.255.255.0`. Cách viết này ngắn hơn, và là chuẩn được dùng trong hầu hết tài liệu, cấu hình router, và công cụ mạng hiện đại.

### Bảng CIDR phổ biến

| CIDR | Subnet mask | Số host portion bit | Số địa chỉ host khả dụng |
|---|---|---|---|
| /24 | 255.255.255.0 | 8 | 254 |
| /25 | 255.255.255.128 | 7 | 126 |
| /26 | 255.255.255.192 | 6 | 62 |
| /27 | 255.255.255.224 | 5 | 30 |
| /28 | 255.255.255.240 | 4 | 14 |

Công thức chung: số địa chỉ host khả dụng = 2^(số bit host) − 2 (trừ đi network address và broadcast address của subnet đó).

## Ví dụ tính subnet cụ thể

Giả sử có dải mạng `192.168.1.0/24` (256 địa chỉ), và cần chia thành 4 subnet nhỏ hơn để phân theo 4 phòng ban. Cách làm: mượn thêm 2 bit từ host portion (vì 2^2 = 4, đủ để tạo 4 subnet), chuyển từ `/24` thành `/26`:

| Subnet | Dải địa chỉ | Network address | Broadcast address |
|---|---|---|---|
| Subnet 1 | 192.168.1.0 – 192.168.1.63 | 192.168.1.0 | 192.168.1.63 |
| Subnet 2 | 192.168.1.64 – 192.168.1.127 | 192.168.1.64 | 192.168.1.127 |
| Subnet 3 | 192.168.1.128 – 192.168.1.191 | 192.168.1.128 | 192.168.1.191 |
| Subnet 4 | 192.168.1.192 – 192.168.1.255 | 192.168.1.192 | 192.168.1.255 |

Mỗi subnet /26 có 2^6 = 64 địa chỉ, trong đó 62 địa chỉ dùng được cho host (trừ network address và broadcast address của riêng subnet đó).

## VLSM — khi các subnet không cần bằng nhau

Cách chia ở trên tạo ra 4 subnet có kích thước bằng nhau — nhưng thực tế các phòng ban thường có số lượng máy khác nhau. **VLSM (Variable Length Subnet Mask)** là kỹ thuật cho phép chia các subnet với kích thước khác nhau từ cùng một dải mạng lớn, tránh lãng phí địa chỉ. Ví dụ: phòng kỹ thuật cần 100 máy có thể dùng một subnet /25 (126 địa chỉ khả dụng), trong khi phòng lễ tân chỉ cần 5 máy có thể dùng một subnet /29 (6 địa chỉ khả dụng) — thay vì cả hai đều bị ép dùng chung kích thước /26 như ví dụ đơn giản ở trên.

## Lỗi thường gặp

- Nhầm giữa network address (địa chỉ đầu tiên của subnet, ví dụ `192.168.1.0`) với địa chỉ có thể gán cho thiết bị — hai địa chỉ đặc biệt (network address và broadcast address) của mỗi subnet không bao giờ được gán cho host thông thường.
- Tính sai số bit cần mượn khi cần chia thành N subnet — quy tắc là cần mượn đủ bit sao cho 2^(số bit mượn) ≥ N, không phải tính theo số subnet chia đều một cách trực quan.
- Chia subnet quá nhỏ ngay từ đầu (ví dụ dùng toàn bộ /30 cho một phòng có thể sẽ mở rộng) — khi phòng đó cần thêm máy, sẽ phải quy hoạch lại toàn bộ dải mạng, gây gián đoạn không cần thiết.

#### Kết luận

Subnetting không chỉ là bài toán tính toán bit — nó là công cụ để giữ mạng lớn vẫn vận hành mượt mà, bằng cách giới hạn phạm vi broadcast domain và tổ chức địa chỉ theo đúng cấu trúc tổ chức thực tế (phòng ban, khu vực, chức năng). Ranh giới network/host portion không phải một con số cố định — nó là một quyết định thiết kế, và subnet mask chính là công cụ để hiện thực hóa quyết định đó.