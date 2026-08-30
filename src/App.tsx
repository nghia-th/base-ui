import React, { useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { BlocApplication } from "./ui/bloc/BlocApplication";
import AppWrapper from "./AppWrapper";
import "./ui/i18next/i18next";

// Root component: 1 instance BlocApplication sống suốt vòng đời app (giống module-ui/src/index.tsx).
// ThemeProvider/CssBaseline nằm bên trong AppWrapper.tsx (bọc theo "ui" của BlocApplication) chứ
// không đặt cố định ở đây nữa - xem ghi chú trong AppWrapper.tsx/ui/bloc/BlocApplication.ts: lý do
// là AlertDialog/ConfirmDialog cần thấy ĐÚNG theme người dùng đã chọn (kể cả trước khi đăng nhập),
// không phải 1 theme mặc định cố định.
export default function App() {
    const app = useMemo(() => new BlocApplication(), []);

    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <BrowserRouter>
                <AppWrapper app={app} />
            </BrowserRouter>
        </SnackbarProvider>
    );
}
