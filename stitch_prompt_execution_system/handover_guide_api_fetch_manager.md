# BÁO CÁO BÀN GIAO GIAO DIỆN API FETCH MANAGER

## 1. Tổng quan Dự án
Hệ thống quản lý luồng Fetch API với giao diện Responsive (Desktop/Mobile), phong cách Technical Precision (Emerald-on-Dark).

## 2. Danh sách Màn hình (Placeholder IDs)
### Desktop (Main Flow)
- **Layout Frame**: {{DATA:SCREEN:SCREEN_10}} (Khung chuẩn, Sidebar thu gọn)
- **Owners Manager**: {{DATA:SCREEN:SCREEN_10}} (Cập nhật row dịch vụ)
- **Credentials Manager**: {{DATA:SCREEN:SCREEN_6}}
- **Fetch Builder**: {{DATA:SCREEN:SCREEN_12}}
- **Fetch Builder + Docs**: {{DATA:SCREEN:SCREEN_9}}
- **Data & Variables**: {{DATA:SCREEN:SCREEN_13}}
- **Services & Resources**: {{DATA:SCREEN:SCREEN_21}}
- **Execute Flow Modal**: {{DATA:SCREEN:SCREEN_19}}

### Mobile (Responsive Targets)
- **Owners**: {{DATA:SCREEN:SCREEN_16}}
- **Credentials**: {{DATA:SCREEN:SCREEN_17}}
- **Fetch Builder**: {{DATA:SCREEN:SCREEN_8}}
- **Data & Variables**: {{DATA:SCREEN:SCREEN_20}}
- **Services**: {{DATA:SCREEN:SCREEN_22}}

## 3. Cấu trúc Kỹ thuật (Frontend)
- **Framework**: React + TypeScript + Vite.
- **Styling**: Tailwind CSS (Sử dụng hệ Design System {{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_2}}).
- **Responsive Logic**: Sử dụng các tiền tố `md:` của Tailwind để chuyển đổi giữa Table (Desktop) và Card-list (Mobile).
- **Icons**: Lucide React (Stroke 1.5px).

## 4. Hướng dẫn Tích hợp Backend
### Bước 1: Thay thế Mock API
Trong file `src/services/api.ts`, thay thế các hàm trả fixture bằng các cuộc gọi `fetch` hoặc `axios` thực tế tới server.
- **Owners**: GET `/api/owners`
- **Credentials**: GET `/api/credentials?ownerEmail={email}`
- **Flows**: POST `/api/execute`

### Bước 2: Quản lý Trạng thái Global
- Sử dụng `Context API` hoặc `Zustand` để lưu trữ `activeOwner`.
- Khi `activeOwner` thay đổi, trigger refetch dữ liệu cho toàn bộ các trang.

### Bước 3: Xử lý Credential Id
- Lưu ý: UI lưu trữ `credId` thay vì `key` để tránh xung đột khi một key có nhiều giá trị. Backend cần xử lý map `credId` trong luồng execute.

## 5. Output cần thiết cho Agents
Để các Agent khác có thể ráp code, bạn cần cung cấp:
1. **Source Code HTML/CSS**: Lấy từ nút "View Code" của các màn hình trên.
2. **Tài liệu SPEC**: File `01.PROMPT_MASTER_UI` (DOCUMENT_5).
3. **Design Tokens**: Các biến CSS màu sắc và spacing trong {{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_2}}.
