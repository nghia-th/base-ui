import React, { MutableRefObject, useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import LocalStorage from "./base/LocalStorage";
import Loading from "./ui/components/common/Loading";
import { AppContext } from "./base/AppContext";
import { BlocApplication } from "./ui/bloc/BlocApplication";
import UIStream from "./ui/components/common/UIStream";
import { createAppTheme } from "./theme/muiTheme";
import AlertDialog from "./ui/components/dialogs/AlertDialog";
import ConfirmDialog from "./ui/components/dialogs/ConfirmDialog";
import Login from "./ui/pages/Login";
import Register from "./ui/pages/Register";
import ForgotPassword from "./ui/pages/ForgotPassword";
import NotFound from "./ui/pages/NotFound";
import ErrorPage from "./ui/pages/ErrorPage";
import AccessDenied from "./ui/pages/AccessDenied";
import AppShell from "./ui/AppShell";

interface AppWrapperProps {
    app: BlocApplication;
}

// Thay cho AppWrapper.tsx bên module-ui: cùng 1 pattern - loadInit() qua BlocApplication,
// UIStream lắng "loadInit" để quyết định route nào cần đăng nhập, Alert/Confirm/Loading dùng chung.
export default function AppWrapper({ app }: AppWrapperProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const loadingRef: MutableRefObject<Loading | null> = useRef(null);

    const handleRequest = {
        showLoading: (isShow: boolean) => {
            loadingRef.current?.showLoading(isShow);
        },
        onUnAuth: () => {
            setTimeout(() => {
                LocalStorage.deleteToken();
                app.setStream('loadInit', { loginRequire: { status: 1, url: location.pathname }, finish: true });
            });
        },
        onError: (error?: any) => {
            enqueueSnackbar(t(error?.messageKey || error?.error || 'error') as string, { variant: 'error' });
        }
    };
    app.apiHandler = handleRequest;

    useEffect(() => {
        setTimeout(async () => {
            await app.loadInit(location.pathname);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        // 1 ThemeProvider DUY NHẤT bọc TOÀN BỘ cây (Routes/AppShell lẫn Alert/ConfirmDialog/Loading),
        // lấy theo "ui" của BlocApplication (app) - xem ghi chú trong ui/bloc/BlocApplication.ts.
        // Trước đây mỗi AppShell tự tạo ThemeProvider riêng cho mình, nên AlertDialog/ConfirmDialog
        // (render song song với AppShell ở đây, không phải con của nó) không bao giờ thấy được theme
        // người dùng chọn - luôn hiện màu xanh dương mặc định dù đã đổi accent/dark mode. Đặt ở đây
        // (bọc ngoài cùng, tồn tại kể cả trước khi đăng nhập) fix triệt để, đồng thời làm Login/Register/
        // Error... cũng nhất quán theo theme đã lưu thay vì luôn cố định sáng.
        <UIStream
            initialData={app.getUI()}
            stream={app.getStream('ui')}
            builder={(uiSnapshot) => {
                const ui = uiSnapshot.data ?? app.getUI();
                const theme = createAppTheme(ui.colorScheme, ui.componentTheme, ui.visualStyle ?? 'a', ui.sidebarSyncAccent ?? true, ui.sidebarColor);
                return (
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <UIStream
                            initialData={{ loginRequire: { status: 0, url: '' }, finish: false }}
                            stream={app.getStream('loadInit')}
                            builder={(snapshot) => (
                                <AppContext.Provider value={{
                                    apiHandler: handleRequest,
                                    app: app,
                                    translate: t,
                                    dateTimeFormat: {
                                        dateFormat: 'YYYY-MM-DD',
                                        dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
                                        timeFormat: 'HH:mm:ss',
                                        calendarViewDate: 'yy/mm/dd',
                                        calendarViewDateTime: 'yy/mm/dd HH:mm',
                                        timeDateFormat: 'HH:mm:ss YYYY-MM-DD'
                                    }
                                }}>
                                    {snapshot.data?.finish ? (
                                        <Routes>
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />
                                            <Route path="/forgot-password" element={<ForgotPassword />} />
                                            <Route path="/error" element={<ErrorPage />} />
                                            <Route path="/access-denied" element={<AccessDenied />} />
                                            <Route path="/notfound" element={<NotFound />} />
                                            {/* "/" và "/demo/*" dùng chung 1 khung AppShell (topbar + sidebar) - "/" là trang
                                                trống để build UI thật của project mới, "/demo" là template/UI Kit cũ, giữ lại
                                                làm tài liệu tham khảo trong lúc làm project mới (xem AppShell.tsx, Home.tsx). */}
                                            <Route
                                                path="/*"
                                                element={
                                                    snapshot.data.loginRequire.status === 0
                                                        ? <AppShell />
                                                        : <Navigate replace to={`/login?url=${snapshot.data.loginRequire.url}`} />
                                                }
                                            />
                                        </Routes>
                                    ) : <></>}
                                </AppContext.Provider>
                            )}
                        />
                        <UIStream initialData={null} stream={app.getStream('dialogAlert')} builder={(snapshot) => <AlertDialog info={snapshot.data} />} />
                        <UIStream initialData={null} stream={app.getStream('dialogConfirm')} builder={(snapshot) => <ConfirmDialog info={snapshot.data} />} />
                        <Loading ref={loadingRef as any} />
                    </ThemeProvider>
                );
            }}
        />
    );
}
