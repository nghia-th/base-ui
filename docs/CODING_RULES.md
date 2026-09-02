# Quy tắc code cho AI Coding Agent

## 1. Phạm vi làm việc
- **Chỉ** thao tác trong thư mục `src/` (UI, business logic, API, utils, theme).
- **Không** tạo, xóa, đổi tên file trừ khi người dùng yêu cầu rõ ràng.
- **Không** sửa `package.json`, `tsconfig.json`, `.eslintrc`, `prettier.config` nếu không có yêu cầu.
- **Không** thực hiện commit/push/PR mà không được chỉ định.

## 2. Kiểu code & conventions
- **TypeScript** cho mọi file `.ts`/`.tsx`.
- Sử dụng **import** kiểu ES6, không có `require`.
- Tên file và folder: kebab‑case cho component, camelCase cho utils, PascalCase cho React component.
- Các **component** React nên dùng **function component** (không class).
- **Hooks**: dùng `useMemo`, `useEffect`, `useCallback` chỉ khi thực sự cần, tuân theo các hook hiện có trong repo.
- **BLoC**: mọi business logic phải nằm trong lớp kế thừa `IBloc`; không viết logic trực tiếp trong component.
- **Theme**: ThemeProvider chỉ xuất hiện một lần ở `AppWrapper.tsx`. Không tạo ThemeProvider ở component con.
- **Dialogs**: dùng `AlertDialog` / `ConfirmDialog` qua stream (`dialogAlert`, `dialogConfirm`). Không render trực tiếp.
- **Loading**: bật/tắt qua `handleRequest.showLoading` – không tự tạo spinner trong component.
- **API calls**: luôn dùng `apiRequest`, `apiSyncMultiRequest`, `apiMultiRequest` từ `IBloc`. Không gọi axios trực tiếp trong component.
- **LocalStorage**: truy cập qua `LocalStorage` helper; không dùng `window.localStorage` trực tiếp.
- **i18n**: dùng `useTranslation` và `i18n` đã được khởi tạo trong `src/ui/i18next`. Không tạo key mới nếu không cần.

## 3. Quản lý state
- State nên được lưu trong **Bloc** (trong `_blocData` và các stream). 
- Khi cần expose state cho UI, tạo stream bằng `setStream(key, value)` và đọc bằng `UIStream`.
- **Context** (`AppContext`) chỉ chứa `apiHandler`, `app`, `translate`, và cấu hình date‑time. Không thêm thuộc tính mới nếu không được yêu cầu.

## 4. Thêm / sửa component
1. **Tạo component mới**: 
   - Đặt trong `src/ui/components/` (hoặc `src/ui/pages/` nếu là trang).
   - Đặt file `.tsx` và export default component.
   - Đảm bảo không tạo duplicate name.
2. **Sửa component hiện có**:
   - Thay đổi nội dung bên trong component, không thay đổi export kiểu.
   - Kiểm tra các import để tránh vòng lặp.
   - Sau khi sửa, chạy `npm test` và `npm run format` để xác nhận.

## 5. Thêm / sửa API
- Thêm endpoint mới trong `src/api/` dưới dạng class với static method trả về `RequestBase`.
- Không thay đổi cấu hình axios chung (được thiết lập trong `RequestBase`).
- Khi dùng, gọi từ Bloc qua các helper API.

## 6. Kiểm thử
- Khi thêm tính năng, tạo file test trong cùng thư mục với component (đuôi `.test.tsx`).
- Sử dụng **React Testing Library** và **Jest**.
- Mọi test phải chạy thành công (`npm test`).
- Không sửa hoặc xóa test hiện có nếu không có lý do rõ ràng.

## 7. Lệnh chạy / kiểm tra
- **Phát triển**: `npm start`
- **Build**: `npm run build`
- **Test**: `npm test`
- **Format**: `npm run format`

## 8. Khi gặp bất đồng / không chắc chắn
- Sử dụng tool **question** để hỏi người dùng lựa chọn hoặc yêu cầu rõ ràng.
- Không tự quyết định phá vỡ kiến trúc (ví dụ di chuyển file, thay đổi flow login).

## 9. Các hành vi cấm
- Thêm emoji, comment không cần thiết, hoặc nội dung không liên quan vào code.
- Thay đổi cấu hình lint, prettier, hoặc script npm nếu không có yêu cầu.
- Gọi `git reset --hard`, `git checkout --` hoặc các lệnh phá hủy history.
- Thay đổi `package.json` version, scripts, hoặc dependencies.
- Thêm file mới trong thư mục ngoài `src/` hoặc `docs/` (trừ tài liệu).

---
*Các quy tắc này được viết dựa trên cấu trúc và pattern hiện có trong dự án.*