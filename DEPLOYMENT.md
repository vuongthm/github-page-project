# HƯỚNG DẪN VẬN HÀNH KHÔNG GIAN LÀM VIỆC & QUY TRÌNH PHÁT TRIỂN NỘI DUNG

Tài liệu này cung cấp hướng dẫn chi tiết về cấu trúc hệ thống, quy trình khởi chạy cục bộ, thêm hoặc sửa đổi bài viết, khóa bảo mật nội dung, tinh chỉnh mã nguồn và đặc biệt là quy trình tích hợp một kho lưu trữ nội dung hoàn toàn mới vào hệ thống lõi của bạn.

---

## 1. TỔNG QUAN KIẾN TRÚC KHÔNG GIAN LÀM VIỆC (WORKSPACE)

Không gian làm việc cục bộ của bạn được tổ chức thành một cấu trúc đa thư mục nằm song song kề vai sát cánh như sau:

    github-page-project/
    ├── WORKSPACE_GUIDE.md             # File hướng dẫn tổng hợp này (Đặt tại thư mục gốc)
    ├── stories/                       # Repo nội dung 1: Chuyện kể dã ngoại, hồi ký cuộc đời
    ├── network-notes/                 # Repo nội dung 2: Ghi chép kỹ thuật công nghệ, bài viết chuyên sâu
    └── vuongthm.github.io/            # Repo mã nguồn lõi: Động cơ Next.js xử lý giao diện và giải mã tĩnh

---

## 2. BẢNG PHÂN PHỐI NHIỆM VỤ VÀ QUY TRÌNH THAO TÁC

Bảng dưới đây tóm tắt các tác vụ phổ biến và thư mục tương ứng bạn cần làm việc để tránh nhầm lẫn giữa mã nguồn và nội dung:

| Loại tác vụ | Thư mục làm việc | Lệnh thực thi chính | Thao tác trên Git |
| :--- | :--- | :--- | :--- |
| **Khởi chạy cục bộ** | `vuongthm.github.io/` | `pnpm dev` | Không cần push (chỉ chạy local để kiểm thử) |
| **Thêm/Sửa truyện** | `stories/` | Không cần chạy lệnh | Push trực tiếp trên repo `stories` |
| **Thêm/Sửa ghi chú** | `network-notes/` | Không cần chạy lệnh | Push trực tiếp trên repo `network-notes` |
| **Khóa bài bảo mật** | `vuongthm.github.io/` | `node scripts/generate-content-data.mjs` | Đóng/mở tệp `passwords.json` bảo mật ở local |
| **Sửa đổi mã nguồn** | `vuongthm.github.io/` | `pnpm dev` để test | Push trực tiếp trên repo `vuongthm.github.io` |
| **Tích hợp Repo mới** | Cả 3 thư mục | `pnpm run build` | Cấu hình liên kết ở cả Core Repo và Repo mới |

---

## 3. HƯỚNG DẪN THIẾT LẬP & KHỞI CHẠY CỤC BỘ (LOCAL SYNC)

Để kiểm tra hiển thị trang web trên máy tính cá nhân trước khi xuất bản lên mạng internet:

1. Mở Terminal và di chuyển vào thư mục mã nguồn lõi:
    
    cd vuongthm.github.io
    
2. Khởi động môi trường phát triển cục bộ:
    
    pnpm dev
    
3. Sau khi chạy lệnh, hệ thống sẽ tự động thực thi các tác vụ ngầm sau:
   - Quét thư mục `../stories` và `../network-notes` kề bên để copy bài viết thô vào thư mục tạm `content/`.
   - Phân tách và copy toàn bộ ảnh minh họa sang thư mục tĩnh `public/media/`.
   - Thực hiện tự động tạo ảnh bìa nháp (Fallback Assets) nếu phát hiện thiếu hình ảnh để tránh lỗi biên dịch của Next.js.
   - Biên dịch và sinh tệp tin cơ sở dữ liệu tĩnh `lib/content.generated.ts`.
4. Mở trình duyệt và truy cập: `http://localhost:3000` để xem kết quả.

---

## 4. QUY TRÌNH VIẾT BÀI & QUẢN LÝ NỘI DUNG (CONTENT WORKFLOW)

### 4.1. Thêm mới bài viết công khai thông thường (Public)

*   **Nếu là Truyện kể (Stories)**:
    - Tạo thư mục tác phẩm mới: `stories/[slug-truyen]/`
    - Tạo tệp tin giới thiệu tác phẩm: `stories/[slug-truyen]/vi/series.md` (cho tiếng Việt) và `en/series.md` (cho tiếng Anh).
    - Tạo các chương truyện tương ứng: `stories/[slug-truyen]/vi/chuong-1.md` và `en/chapter-1.md`.
    - Đảm bảo trong Frontmatter của từng chương bắt buộc phải chứa số thứ tự chương để sắp xếp: `part: 1`.

*   **Nếu là Ghi chú (Notes)**:
    - Chọn danh mục tương ứng (Ví dụ: `fundamentals` hoặc `protocols`).
    - Tạo tệp viết mới: `network-notes/[category]/vi/[slug-bai-viet].md` và `en/[slug-bai-viet].md`.

---

### 4.2. Thêm mới bài viết khóa bảo mật (Private/Encrypted)

Để khóa một bài viết bằng mật khẩu AES-256 bảo mật mà không làm lộ mật khẩu ra ngoài GitHub công khai:

1. Trong tệp bài viết Markdown thô của bạn ở repo nội dung, chỉ khai báo thuộc tính `locked: true` trong Frontmatter:
    
    ---
    title: "Mô Hình OSI Giải Thích Rõ Ràng"
    description: "Bài viết này đã được khóa bảo mật."
    locked: true
    ---
    
2. Mở file bản đồ mật khẩu cục bộ `./vuongthm.github.io/passwords.json` trên máy tính của bạn và bổ sung mật khẩu cho slug bài viết đó:
    
    {
      "osi-model": "your-secret-password-for-osi-123"
    }
    
3. Lưu file lại. Khi bạn chạy `pnpm dev` hoặc `pnpm run build`, hệ thống sẽ tự động đọc mật khẩu này để mã hóa văn bản thô thành dạng chuỗi ký tự mật mã vô nghĩa và ẩn hoàn toàn mật khẩu gốc đi trước khi đẩy dữ liệu lên GitHub.

---

### 4.3. Quy tắc đặt hình ảnh minh họa bài viết

Để tránh lỗi hiển thị và không làm hỏng định tuyến động của Next.js:

1. **Vị trí đặt ảnh**:
   - Đối với truyện: Đặt trong thư mục `stories/[slug-truyen]/media/[tên-ảnh.png]`
   - Đối với ghi chú: Đặt trong thư mục `network-notes/[category]/media/[tên-ảnh.png]`
2. **Cách gọi ảnh trong Markdown**:
   - Đối với truyện: `![Mô tả](/media/stories/[slug-truyen]/[tên-ảnh.png])`
   - Đối với ghi chú: `![Mô tả](/media/notes/[category]/[tên-ảnh.png])`
   *(Luôn sử dụng đường dẫn tuyệt đối bắt đầu bằng dấu gạch chéo `/`)*

---

### 4.4. Đẩy bài viết mới lên GitHub

Khi viết hoặc sửa bài xong, bạn chỉ cần thực hiện các thao tác Git ngay tại thư mục của chính repo nội dung đó để kích hoạt luồng deploy tự động:

    # Di chuyển vào thư mục repo nội dung vừa sửa
    cd network-notes

    # Kiểm tra các tệp tin đã sửa
    git status

    # Thêm và đẩy lên GitHub
    git add .
    git commit -m "content: add new note on tcp window sizing"
    git push origin main

---

## 5. HƯỚNG DẪN TÍCH HỢP & LIÊN KẾT REPOSITORY NỘI DUNG HOÀN TOÀN MỚI

Giả sử trong tương lai, bạn muốn mở rộng thêm một kho nội dung hoàn toàn mới mang tên là `travel-logs` (Nhật ký du lịch) nằm song song với `stories` và `network-notes` mà không muốn viết lại code giao diện. Quy trình thiết lập gồm 4 bước tiêu chuẩn sau:

### Bước 5.1: Tạo Repository mới trên GitHub & Máy local
1. Tạo một repository mới trên GitHub cá nhân của bạn lấy tên là `travel-logs` (Đặt ở chế độ Public hoặc Private tùy ý bạn).
2. Tải repo này về máy tính cá nhân của bạn, đặt nằm cùng cấp thư mục với 3 repo hiện tại trong thư mục lớn `github-page-project/`.
3. Định cấu hình thư mục bên trong repo mới theo mô hình ghi chép của `network-notes`:
    
    travel-logs/
    └── [category-slug]/             # Tên danh mục (Ví dụ: asia, europe)
        ├── media/                   # Thư mục chứa hình ảnh du lịch của danh mục này
        │   └── fuji-mountain.png
        ├── en/                      # Tệp viết tiếng Anh
        │   └── japan-trip.md
        └── vi/                      # Tệp viết tiếng Việt
            └── japan-trip.md
    

### Bước 5.2: Đăng ký liên kết trong tệp `sync.config.json` của Core Repo
Bạn mở file `./vuongthm.github.io/sync.config.json` trong Core Repo lên và bổ sung cấu hình ánh xạ của repo mới vào danh sách `repos`:

    {
      "name": "travel-logs",
      "github": "vuongthm/travel-logs",
      "sources": [
        {
          "from": "*/note.md",
          "to": "content/notes",
          "description": "Travel log markdown files"
        },
        {
          "from": "*/media/**",
          "to": "public/media/notes",
          "description": "Travel images and media"
        }
      ]
    }

*Giải thích*: Bằng cách cấu hình ánh xạ nguồn dịch chuyển về thư mục `content/notes` và ảnh về `public/media/notes`, toàn bộ bài viết du lịch mới của bạn sẽ tự động được hệ thống lõi Next.js biên dịch tĩnh và hiển thị tuyệt đẹp ngay trong mục **Ghi chú (Notes)** mà bạn **không cần viết thêm bất kỳ dòng code giao diện nào**!

### Bước 5.3: Cấu hình kéo mã nguồn tự động khi Deploy (`deploy.yml`)
Bạn mở file quy trình `.github/workflows/deploy.yml` của Core Repo lên và bổ sung bước tự động kéo tệp từ repo `travel-logs` về máy ảo ngay bên dưới phần kéo các repo cũ:

    - name: Check out travel-logs content
      uses: actions/checkout@v5
      with:
        repository: vuongthm/travel-logs
        path: travel-logs
      continue-on-error: true

### Bước 5.4: Thiết lập phát tín hiệu tự động Rebuild từ Repo mới
Để đảm bảo mỗi khi bạn push bài viết du lịch mới lên repo `travel-logs`, trang web chính sẽ tự động cập nhật bài viết đó lên internet:
1. Trong thư mục gốc của repo mới `travel-logs/`, bạn tạo tệp tin `.github/workflows/notify-root.yml` với nội dung tự động gọi Webhook của Core Repo:
    
    name: Notify Root Site on Push
    on:
      push:
        branches: [main]
        paths: ["**/*.md", "**/media/**"]
    jobs:
      trigger-deploy:
        runs-on: ubuntu-latest
        steps:
          - name: Trigger Main Repo Workflow
            run: |
              curl -L \
                -X POST \
                -H "Accept: application/vnd.github+json" \
                -H "Authorization: Bearer ${{ secrets.PAT_TOKEN }}" \
                https://api.github.com/repos/vuongthm/vuongthm.github.io/dispatches \
                -d '{"event_type": "content-updated"}'
    
2. Truy cập vào phần cài đặt của repo mới `travel-logs` trên GitHub -> **Settings** -> **Secrets** -> **Actions** -> Tạo một Secret mới tên là `PAT_TOKEN` và dán mã Token cá nhân của bạn vào để cấp quyền cho nó phát tín hiệu về Core Repo.

---

## 6. QUY TRÌNH ĐIỀU CHỈNH MÃ NGUỒN CORE & VÁ LỖI

### 6.1. Chỉnh sửa giao diện hoặc thay đổi màu sắc thương hiệu
Nếu bạn muốn sửa code hoặc thay đổi tông màu thương hiệu chính của trang web (Ví dụ từ vàng cam sang xanh biển):

1. Di chuyển vào thư mục core: `cd vuongthm.github.io`
2. Mở file `app/globals.css`, tìm đến khối `:root` và `.dark`.
3. Đóng bình luận màu vàng cam lại và mở bình luận màu xanh nước biển ra theo hướng dẫn chi tiết ghi sẵn trong file.
4. Chạy `pnpm dev` để kiểm tra giao diện mới trên trình duyệt.
5. Thực hiện commit và push mã nguồn mới lên GitHub để cập nhật trang web tĩnh:
    
    git add .
    git commit -m "style: switch brand accent color to cyber sky blue"
    git push origin main
    

---

### 6.2. Cài đặt thêm thư viện mới (Quản lý pnpm-lock.yaml)
Nếu bạn cần cài đặt thêm thư viện npm mới vào dự án, để tránh lỗi xung đột cấu hình tĩnh trực tuyến (`ERR_PNPM_OUTDATED_LOCKFILE`), hãy tuân thủ quy trình bỏ qua workspace sau:

1. Di chuyển ra thư mục cha bên ngoài:
    
    cd ..
    
2. Đổi tên tạm thời để ẩn file cấu hình workspace đi:
    
    mv pnpm-workspace.yaml pnpm-workspace.yaml.bak
    
3. Quay lại thư mục core và chạy cài đặt thư viện:
    
    cd vuongthm.github.io
    pnpm install [tên-thư-viện-mới]
    
   *(Thao tác này giúp file `pnpm-lock.yaml` cục bộ của bạn được cập nhật đồng bộ hoàn toàn)*
4. Đẩy mã nguồn và tệp khóa mới lên GitHub:
    
    git add package.json pnpm-lock.yaml
    git commit -m "chore: add new dependency and sync pnpm-lock.yaml"
    git push origin main
    
5. Di chuyển ra ngoài và khôi phục lại file cấu hình workspace ban đầu:
    
    cd ..
    mv pnpm-workspace.yaml.bak pnpm-workspace.yaml
    

---

## 7. CƠ CHẾ TỰ ĐỘNG HÓA HOÀN TOÀN TRÊN CLOUD

Hệ thống của bạn hoạt động tự động hóa hoàn toàn nhờ các quy trình ngầm (GitHub Actions):

    Push to [stories]        ──┐
    Push to [network-notes]  ──┼─► Trigger [vuongthm.github.io] ──► Auto Build & Deploy
    Push to [travel-logs]    ──┘
