# Kiểm thử trong dự án quiz‑ui

## 1. Framework test
- **Jest** là test runner được cung cấp bởi `react‑scripts`.
- **React Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) được dùng để render component và kiểm tra giao diện.
- Các file test mặc định có phần mở rộng `.test.{js,ts,tsx}` hoặc `.spec.{js,ts,tsx}`.

## 2. Cấu hình hiện tại
- **Script** trong `package.json`:
```json
"test": "react-scripts test"
```
- Khi chạy `npm test`, `react-scripts` sẽ tự động tìm các file trong `src/` có phần mở rộng trên và thực thi.
- Không có cấu hình phụ (`jest.config.js`) – dự án dựa vào cấu hình mặc định của CRA.

## 3. Thực hiện test
- **Chạy toàn bộ**: `npm test` → mở giao diện Watch mode của Jest.
- **Chạy một test cụ thể**: `npm test -- <path/to/file.test.tsx>`.
- **Coverage**: có thể bật coverage bằng `npm test -- --coverage` (không được cấu hình sẵn nhưng hỗ trợ).

## 4. Kiểm tra hiện tại
- Dự án **không chứa** bất kỳ file test nào (đã kiểm tra `**/*.test.*` và `**/*.spec.*`).
- Do đó hiện tại **không có test** để chạy; nhưng môi trường test đã sẵn sàng.

## 5. Hướng dẫn thêm test mới
1. **Vị trí**: Đặt file test trong cùng thư mục với component hoặc page, đặt tên `<ComponentName>.test.tsx`.
2. **Thư viện**: Import `render`, `screen`, `fireEvent` từ `@testing-library/react`.
3. **Ví dụ cơ bản**:
```tsx
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

test('renders title', () => {
  render(<MyComponent />);
  expect(screen.getByText(/title/i)).toBeInTheDocument();
});
```
4. **Run**: `npm test` để xác nhận test mới chạy và không phá vỡ các test hiện có.
5. **Format**: Sau khi viết test, chạy `npm run format` để đảm bảo chuẩn Prettier.

## 6. Những gì AI **KHÔNG** được làm
- Xóa hoặc sửa đổi bất kỳ test hiện có (nếu có) nếu không có yêu cầu.
- Thêm cấu hình Jest tùy chỉnh (babel, ts-jest) trừ khi người dùng yêu cầu.
- Thay đổi script `test` trong `package.json`.

---
*Đây là tài liệu mô tả cách chạy và viết test trong dự án; không gây thay đổi mã nguồn.*