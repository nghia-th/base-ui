# base-ui

Template UI dùng **Material UI (MUI)** thay cho PrimeReact (như template-ui), kết hợp kiến trúc
quản lý state **Bloc + RxJS + AppContext + UIStream** lấy từ module-ui.

## Chạy thử

```bash
npm install
npm start
```

Mở http://localhost:3000 — màn hình đầu tiên là trang Login. Đây là bản demo chưa nối backend
thật nên **nhập bất kỳ username/password nào** cũng đăng nhập được (xem `src/ui/bloc/BlocLogin.ts`
để biết cách bật lại API thật khi có backend).

Sau khi "đăng nhập", vào menu **Trang > Tài liệu** (route `/documentation`) để xem giải thích chi
tiết kiến trúc Bloc/AppContext/UIStream và hướng dẫn thêm 1 trang mới.

## Cấu trúc chính

```
src/
  base/            # Tầng lõi copy từ module-ui: IBloc, IBlocUI, AppContext, ApiService, CallApi, RequestBase
  api/              # Định nghĩa API (RequestBase) theo từng service
  theme/            # MUI theme (thay cho theme PrimeReact/sass của template-ui)
  ui/
    bloc/           # Bloc cho từng trang/shell (BlocApplication, BlocApp, BlocLogin, BlocDashboard, ...)
    layout/         # Topbar, Sidebar, Footer, Breadcrumb, Config drawer (MUI, thay cho IApp* của template-ui)
    pages/          # Các trang: Login, Dashboard, Crud, Calendar, Invoice, Help, Documentation, ...
    components/     # Các trang demo UI-kit (Form, Input, Button, Table, Tree, Chart, Icons, ...)
    AppMenuData.ts  # Cấu hình menu/breadcrumb tĩnh
    AppShell.tsx    # Khung layout đã đăng nhập (topbar+sidebar+content), tương đương ISmartApp.js
  AppWrapper.tsx    # Điều phối loadInit + routing công khai (login/error/notfound) + shell
  App.tsx           # Root: BlocApplication instance + ThemeProvider + SnackbarProvider + Router
```

## Kiến trúc tóm tắt

1. **Bloc** (`base/IBloc.ts`, `base/IBlocUI.ts`) giữ state + phát dữ liệu qua RxJS `Subject`
   (`setStream`/`getStream`), gọi API qua `apiRequest`/`apiRequestAwait`.
2. **AppContext** (`base/AppContext.ts`) truyền `app` (BlocApplication) + `apiHandler` + `translate`
   xuống toàn bộ cây component; `reUseBloc`/`reUseBlocContent` lấy/khởi tạo Bloc đúng phạm vi
   (shell hay từng trang), tự dispose khi đổi route.
3. **UIStream** (`ui/components/common/UIStream.ts`) là 1 "StreamBuilder" kiểu Flutter: subscribe
   1 Subject rồi render lại khi có dữ liệu mới.
4. Gọi API qua `RequestBase` (`base/RequestBase.ts`) + `ApiService.ts` (axios, tự refresh token).

Xem chi tiết + ví dụ code tại trang **Documentation** trong app (`src/ui/pages/Documentation.tsx`).

## Việc cần làm khi nối backend thật

- `src/base/PrefixService.ts`: đổi các prefix service cho đúng backend thật.
- `src/ui/bloc/BlocLogin.ts`: bật lại khối `apiRequest(UserApi.login(...))`, xoá khối mock demo.
- `src/ui/bloc/BlocApp.ts` (`initData`): thay menu tĩnh bằng `apiSyncMultiRequest` gọi
  `UserApi.myPermission()`/`UserApi.module()` giống module-ui.
- `src/api/ApiLanguage.ts`: đổi sang gọi API ngôn ngữ thật thay vì đọc file tĩnh trong `public/languages`.

## Build production

```bash
npm run build
```

Đã build thử thành công (không lỗi, không cảnh báo ESLint) trước khi bàn giao.
