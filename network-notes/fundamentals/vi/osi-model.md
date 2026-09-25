---
title: "Mô Hình OSI Giải Thích Rõ Ràng"
description: "Phân tích rõ ràng về mô hình OSI bảy tầng — mỗi tầng làm gì, tại sao mô hình tồn tại, và cách ghi nhớ nó."
tags: ["networking", "osi", "cơ bản"]
date: "2025-7-1"
lang: "vi"
weight: 1
locked: false
---

# Mô Hình OSI Giải Thích Rõ Ràng

Mô hình OSI (Open Systems Interconnection) là một khung khái niệm tiêu chuẩn hóa các chức năng của hệ thống truyền thông thành bảy tầng riêng biệt.

![Ngăn xếp mạng nhiều lớp](/media/notes/fundamentals/layered-stack.svg)

## Tại Sao Nó Tồn Tại

Trước mô hình OSI, các nhà sản xuất khác nhau xây dựng thiết bị mạng không tương thích với nhau. Thiết bị từ nhà sản xuất này không thể giao tiếp với thiết bị từ nhà sản xuất kia. Mô hình OSI giải quyết điều này bằng cách cung cấp một ngôn ngữ chung và bộ quy tắc chung.

### Tư duy cốt lõi

Hãy xem mỗi lớp như một hợp đồng: nhận nhiệm vụ, thêm thông tin cần thiết, rồi chuyển kết quả xuống lớp dưới.

## Bảy Tầng

| Tầng | Tên | Chức năng |
|------|-----|-----------|
| 7 | Ứng dụng | Giao thức hướng người dùng (HTTP, FTP, DNS) |
| 6 | Trình bày | Định dạng dữ liệu, mã hóa, nén |
| 5 | Phiên | Quản lý kết nối giữa các ứng dụng |
| 4 | Giao vận | Phân phối đầu cuối (TCP, UDP) |
| 3 | Mạng | Địa chỉ logic và định tuyến (IP) |
| 2 | Liên kết dữ liệu | Địa chỉ vật lý (MAC), phát hiện lỗi |
| 1 | Vật lý | Bit thô qua môi trường (cáp, sóng radio) |

### Dòng đi của một gói tin
Application → Presentation → Session → Transport → Network → Data Link → Physical
#### Ví dụ

Một yêu cầu HTTP bắt đầu ở lớp 7, được TCP đóng gói ở lớp 4, rồi cuối cùng trở thành bit trên dây mạng.

## Thực Tế Trong Công Việc

Trên thực tế, hầu hết kỹ sư làm việc với mô hình bốn tầng của TCP/IP thay vì bảy tầng của OSI. Nhưng OSI vẫn hữu ích cho:

- **Xử lý sự cố**: "Đây là vấn đề tầng 3 (định tuyến) hay tầng 2 (chuyển mạch)?"
- **Giao tiếp với nhà cung cấp**: Một từ vựng chung giữa các nhóm và công ty
- **Học tập**: Xây dựng trực giác về cách mạng thực sự hoạt động

## Lớp 4 Và Lớp 7

Một nhầm lẫn phổ biến là giữa "cân bằng tải lớp 4" và "cân bằng tải lớp 7":

- **Lớp 4** định tuyến dựa trên IP và cổng TCP/UDP — nhanh nhưng ít thông minh. Nó không nhìn vào nội dung.
- **Lớp 7** định tuyến dựa trên HTTP header, URL hoặc cookie — chậm hơn nhưng thông minh hơn nhiều. Nó có thể đưa `/api/` tới một máy chủ và `/static/` tới máy chủ khác.

### Vì sao kỹ sư vẫn dùng OSI

Mô hình này không phải là một giao thức stack. Nó là cách mô tả vùng lỗi.

#### Quy tắc thực tế

Khi bạn xác định được lớp nơi hành vi thay đổi, thời gian gỡ lỗi thường giảm đi rất nhiều.