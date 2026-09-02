# Kiến trúc dự án

## Tổng quan
- **Framework**: React 19 (Create‑React‑App) + TypeScript.
- **Thư viện UI**: MUI v6 (material, icons, X‑components) và một số component demo.
- **Quản lý state**: **Bloc pattern** + **RxJS Subject** streams, bọc toàn bộ bằng **React Context** (`AppContext`).
- **Routing**: `react‑router‑dom` v6 – routes được khai báo trong `AppWrapper.tsx`.
- **Giao tiếp API**: `axios` trong các file `src/api/*.ts`. Các Bloc gọi API thông qua lớp `CallApi` / `CallMultiApi` trong `src/base/CallApi.ts` và `IBloc` cung cấp các helper (`apiRequest`, `apiSyncMultiRequest`, `apiMultiRequest`).
- **Theme**: MUI theme được tạo trong `src/theme/muiTheme.ts` dựa trên trạng thái UI (`UIState`) được lưu trong `BlocApplication` và đồng bộ với `localStorage`.

## Cấu trúc thư mục chính
```
src/
├─ api/               # Wrapper API (Quiz*, UserApi, DashboardApi, …) – dùng Axios
├─ base/             # Core utilities
│   ├─ IBloc.ts      # Abstract class, streams, API helpers
│   ├─ CallApi.ts    # Hàm gọi API, multi‑request, xử lý lỗi, loading
│   ├─ RequestBase.ts# Định nghĩa RequestBase (axios instance)
│   ├─ AppContext.ts # Context type definitions
│   └─ …
├─ theme/            # MUI theme utils (color, createAppTheme)
├─ utils/            # Các helper chung (Utils, DateUtils, CameraUtils)
├─ quiz-net/         # Lớp network bổ trợ (QuizApiService, errors)
├─ ui/
│   ├─ layout/       # Sidebar, Topbar, Footer, Menu, Breadcrumb, …
│   ├─ pages/        # Các route page (Login, Register, Dashboard, demo, parent/, student/)
│   ├─ components/   # Component demo (ChartDemo, TableDemo, Dialogs, Buttons, …)
│   ├─ bloc/         # Bloc classes (BlocApplication, BlocLogin, BlocDashboard, …)
│   └─ AppShell.tsx   # Khung UI chung (topbar + sidebar) cho route "/*"
├─ App.tsx           # Root component – khởi tạo BlocApplication, Router, SnackbarProvider
├─ AppWrapper.tsx    # ThemeProvider, UIStream, Context provider, route definitions
├─ index.js          # **Entry point** – ReactDOM.createRoot → <App/>
└─ … (css, test utils)
```

## Entry point
- `src/index.js` (ReactDOM.createRoot) khởi chạy `App`.
- `App.tsx` tạo một instance duy nhất của `BlocApplication` (singleton) và cung cấp Router + SnackbarProvider.
- `AppWrapper.tsx` bọc toàn bộ cây bằng `ThemeProvider`, cung cấp `AppContext`, và định nghĩa các `Routes`.

## Các component chính
| Component | Vai trò |
|-----------|---------|
| **App** | Tạo BlocApplication, Router, SnackbarProvider. |
| **AppWrapper** | ThemeProvider, UIStream, AppContext, handling loading/auth, route definitions. |
| **AppShell** | Khung UI chung (topbar, sidebar, content) cho các route sau đăng nhập. |
| **BlocApplication** (src/ui/bloc/BlocApplication.ts) | Bloc cấp cao nhất (singleton), giữ UI state, dialog streams, loadInit, showAlert/Confirm. |
| **Bloc\*** (BlocLogin, BlocDashboard, BlocParentSubjects, …) | Business‑logic cho từng domain, gọi API, cập nhật stream. |
| **UIStream** | Wrapper tiêu thụ RxJS stream và render UI khi dữ liệu thay đổi. |
| **AlertDialog / ConfirmDialog** | Dialog chung, được điều khiển qua stream `dialogAlert` / `dialogConfirm`. |
| **Loading** | Hiển thị spinner toàn app khi `showLoading` được gọi. |
| **Theme files** (`muiTheme.ts`, `colorUtils.ts`) | Tạo theme MUI dựa trên `UIState`. |
| **API wrappers** (`src/api/*.ts`) | Định nghĩa endpoint, trả về `RequestBase` để Bloc gọi. |

## Quản lý state
- **Bloc pattern**: Mỗi Bloc kế thừa `IBloc`, có `_blocData` (các field) và `_stream` (Map<string, Subject<any>>).
- **Streams**: `setStream(key, value)` phát dữ liệu; `UIStream` trong UI subscribe và render theo snapshot.
- **React Context (`AppContext`)**: Cung cấp `apiHandler`, `app` (BlocApplication), `translate`, và cấu hình ngày‑giờ cho toàn cây.
- **Singleton BlocApplication**: Tạo một instance duy nhất sống suốt vòng đời app, lưu UI theme trong localStorage (`base-ui-ui`).
- **LocalStorage**: Dùng để lưu token, UI preferences, ngôn ngữ.

## Gọi API / backend
- **Thư viện**: `axios` (được bọc trong `RequestBase` và các file `src/api/*.ts`).
- **Pattern**: Bloc gọi API bằng các helper `apiRequest`, `apiSyncMultiRequest`, `apiMultiRequest` (được định nghĩa trong `IBloc`).
- **Xử lý lỗi**: `CallApi` và `CallMultiApi` kiểm tra `httpError`, `code === 401 || 999` → gọi `onUnAuth`. Các lỗi khác được chuyển tới `onError` và hiển thị snackbar qua `apiHandler.onError`.
- **Loading**: `showLoading` được truyền từ `AppWrapper.handleRequest.showLoading` tới Loading component.
- **Multi‑request**: `MultiRequest` cho phép gửi nhiều request đồng thời; kết quả trả về qua `onData` hoặc `onAllData`.
- **Language**: `BlocApplication.loadInit` tải ngôn ngữ bằng `ApiLanguage.lang` và lưu vào i18next.

## Kiểm thử
- **Framework**: Jest + React Testing Library (được cung cấp bởi `react‑scripts test`).
- **Không có test file** trong repository hiện tại (đã kiểm tra `**/*.test.*` và `**/*.spec.*`).
- **Cấu hình**: Test runner được thiết lập trong `package.json` → `react-scripts test`.
- **Thực thi**: `npm test` sẽ chạy tất cả các test (hiện chưa có), nhưng lệnh sẵn có cho việc thêm test mới.

---
*Các tài liệu này chỉ mô tả kiến trúc và quy tắc làm việc; không thay đổi mã nguồn.*