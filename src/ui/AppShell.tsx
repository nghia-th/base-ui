import React, { useContext, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { AppContext, reUseBloc } from "../base/AppContext";
import { BlocApp } from "./bloc/BlocApp";
import UIStream from "./components/common/UIStream";
import { createAppTheme } from "../theme/muiTheme";
import { DRAWER_WIDTH, SLIM_WIDTH, HORIZONTAL_MENU_HEIGHT } from "./layout/layoutConstants";
import { ROOT_MENU_DATA, ROOT_BREADCRUMB_DATA } from "./AppMenuData";
import AppTopbar from "./layout/AppTopbar";
import AppSidebar from "./layout/AppSidebar";
import AppSlimMenu from "./layout/AppSlimMenu";
import AppHorizontalMenu from "./layout/AppHorizontalMenu";
import AppRightMenu from "./layout/AppRightMenu";
import AppFooter from "./layout/AppFooter";
import AppConfigDrawer from "./layout/AppConfigDrawer";
import LocalStorage from "../base/LocalStorage";
import { BASE_URL } from "../base/PrefixService";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import StepperDemo from "./components/StepperDemo";
import FormLayoutDemo from "./components/FormLayoutDemo";
import InputDemo from "./components/InputDemo";
import FloatLabelDemo from "./components/FloatLabelDemo";
import InvalidStateDemo from "./components/InvalidStateDemo";
import ButtonDemo from "./components/ButtonDemo";
import TableDemo from "./components/TableDemo";
import ListDemo from "./components/ListDemo";
import TreeDemo from "./components/TreeDemo";
import PanelDemo from "./components/PanelDemo";
import OverlayDemo from "./components/OverlayDemo";
import MediaDemo from "./components/MediaDemo";
import MenuDemo from "./components/MenuDemo";
import MessagesDemo from "./components/MessagesDemo";
import FileDemo from "./components/FileDemo";
import ChartDemo from "./components/ChartDemo";
import MiscDemo from "./components/MiscDemo";
import IconsDemo from "./components/IconsDemo";
import CrudDemo from "./pages/CrudDemo";
import CalendarDemo from "./pages/CalendarDemo";
import TimelineDemo from "./pages/TimelineDemo";
import Invoice from "./pages/Invoice";
import Help from "./pages/Help";
import EmptyPage from "./pages/EmptyPage";
import Documentation from "./pages/Documentation";
import StatusPage from "./pages/StatusPage";
import SearchOffOutlined from "@mui/icons-material/SearchOffOutlined";

// AppShell = khung đã đăng nhập (topbar + sidebar + footer + content), tương đương ISmartApp.js
// bên module-ui - dùng reUseBloc(appContext, BlocApp) để lấy menu/theme, UIStream để re-render
// khi BlocApp phát dữ liệu mới qua 'loadInitStream' (menu) và 'ui' (theme).
export default function AppShell() {
    const appContext = useContext(AppContext);
    const blocApp = reUseBloc(appContext, BlocApp);
    const location = useLocation();
    // "/demo" và "/demo/*" dùng menu template/UI Kit (viewMain.menu từ BlocApp); "/" và mọi path
    // khác NGOÀI /demo (project thật của anh sau này) dùng ROOT_MENU_DATA riêng, để trống/tối
    // giản - xem AppMenuData.ts. 2 khu vực này dùng chung 1 khung (topbar/sidebar) nhưng KHÔNG
    // dùng chung menu, tránh lẫn menu demo (Thành phần/Bộ giao diện...) vào project thật.
    const isDemoRoute = location.pathname === '/demo' || location.pathname.startsWith('/demo/');
    // Sidebar tự thu gọn theo mặc định trên tablet/mobile (< 960px, giống breakpoint "md" của MUI)
    // để không chiếm hết màn hình hẹp - vẫn mở lại được qua nút menu (3 gạch). Chỉ đọc 1 lần lúc
    // mount (lazy initializer) để không tự ý đóng lại sidebar mà người dùng đã chủ động mở/đóng
    // khi resize/xoay màn hình sau đó.
    const isCompactViewport = useMediaQuery('(max-width:959.95px)');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => !isCompactViewport);
    const [configOpen, setConfigOpen] = useState(false);
    const [rightMenuOpen, setRightMenuOpen] = useState(false);

    useEffect(() => {
        blocApp.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Giống customConfirm bên module-ui (IAppTopbar.js gọi trước khi logout thật): hỏi lại qua
    // dialogConfirm dùng chung của app (BlocApplication.showConfirm - xem ConfirmDialog.tsx trong
    // AppWrapper.tsx) trước khi xoá token/điều hướng về /login, tránh bấm nhầm nút Log out.
    const handleLogout = () => {
        appContext.app?.showConfirm(
            { title: 'log-out', message: 'confirm-logout-message', labelYes: 'log-out', labelNo: 'cancel' },
            (result: { action: string }) => {
                if (result.action === 'yes') {
                    LocalStorage.deleteToken();
                    window.location.href = BASE_URL + '/login';
                }
            }
        );
    };

    // Nút menu (3 gạch) trên AppTopbar dùng chung 1 handler cho mọi kích thước màn hình: ở mobile
    // chỉ Drawer "temporary" (điều khiển bởi mobileOpen) hiển thị nên việc toggle desktopSidebarOpen
    // không có tác dụng gì (Drawer desktop đang bị ẩn theo breakpoint), và ngược lại ở desktop -
    // nên không cần useMediaQuery để phân biệt, toggle cả hai cùng lúc là an toàn.
    const handleMenuClick = () => {
        setMobileOpen((o) => !o);
        setDesktopSidebarOpen((o) => !o);
    };

    return (
        <UIStream
            initialData={blocApp.getField('viewMain')}
            stream={blocApp.getStream('loadInitStream')}
            builder={(snapshot) => {
                const viewMain = snapshot.data ?? blocApp.getField('viewMain');
                const menu = isDemoRoute ? viewMain.menu : ROOT_MENU_DATA;
                const breadcrumb = isDemoRoute ? viewMain.breadcrumb : ROOT_BREADCRUMB_DATA;
                return (
                    <UIStream
                        initialData={blocApp.getUI()}
                        stream={blocApp.getStream('ui')}
                        builder={(uiSnapshot) => {
                            const ui = uiSnapshot.data ?? blocApp.getUI();
                            const theme = createAppTheme(ui.colorScheme, ui.componentTheme, ui.visualStyle ?? 'a', ui.sidebarSyncAccent ?? true, ui.sidebarColor);
                            const menuMode = ui.menuMode ?? 'static';
                            const isHorizontal = menuMode === 'horizontal';
                            const isSlim = menuMode === 'slim';
                            const isOverlay = menuMode === 'overlay';
                            const isStaticCollapsed = !isHorizontal && !isSlim && !isOverlay && !desktopSidebarOpen;
                            const leftOffset = (isHorizontal || isOverlay || isStaticCollapsed) ? 0 : (isSlim ? SLIM_WIDTH : DRAWER_WIDTH);
                            return (
                                <ThemeProvider theme={theme}>
                                    <CssBaseline />
                                    <Box sx={{ display: 'flex' }}>
                                        <AppTopbar
                                            leftOffset={leftOffset}
                                            breadcrumb={breadcrumb}
                                            onMenuClick={handleMenuClick}
                                            onConfigClick={() => setConfigOpen(true)}
                                            onRightMenuClick={() => setRightMenuOpen(true)}
                                            fullName={LocalStorage.getItem('fullName') ?? undefined}
                                            onLogout={handleLogout}
                                        />

                                        {isHorizontal && <AppHorizontalMenu menu={menu} />}
                                        {isSlim && <AppSlimMenu menu={menu} />}
                                        {!isSlim && !isHorizontal && (
                                            <AppSidebar
                                                menu={menu}
                                                mode={isOverlay ? 'overlay' : 'static'}
                                                mobileOpen={mobileOpen}
                                                onCloseMobile={() => setMobileOpen(false)}
                                                fullName={LocalStorage.getItem('fullName') ?? undefined}
                                                desktopOpen={desktopSidebarOpen}
                                            />
                                        )}
                                        {(isSlim || isHorizontal) && (
                                            <AppSidebar
                                                menu={menu}
                                                mode="overlay"
                                                mobileOpen={mobileOpen}
                                                onCloseMobile={() => setMobileOpen(false)}
                                                fullName={LocalStorage.getItem('fullName') ?? undefined}
                                            />
                                        )}

                                        <Box
                                            component="main"
                                            sx={{
                                                flexGrow: 1,
                                                // minWidth: 0 để main luôn co được theo khoảng trống thực tế còn lại - mặc định
                                                // 1 flex item có min-width: auto (co theo nội dung), nên nếu bên trong lỡ có gì
                                                // không tự co được (bảng <Table> thường, nội dung không wrap...) main (và cả
                                                // hàng flex cha) sẽ bị đẩy tràn ngang thay vì hiện scrollbar cục bộ ở đúng chỗ.
                                                minWidth: 0,
                                                p: { xs: 2, sm: 3 },
                                                width: { sm: `calc(100% - ${leftOffset}px)` },
                                                minHeight: '100vh',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: (t) => t.transitions.create('width', {
                                                    easing: t.transitions.easing.sharp,
                                                    duration: t.transitions.duration.enteringScreen
                                                })
                                            }}
                                        >
                                            <Toolbar />
                                            {isHorizontal && <Box sx={{ height: { xs: 0, sm: HORIZONTAL_MENU_HEIGHT } }} />}
                                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                {/* AppShell được mount ở path="/*" (xem AppWrapper.tsx) - dùng chung 1 khung
                                                    (topbar + sidebar) cho cả "/" (trang trống - build UI thật của project mới) và
                                                    "/demo/*" (template/UI Kit cũ, giữ làm tài liệu tham khảo). Routes lồng bên
                                                    trong khớp trực tiếp toàn bộ path còn lại (không bị cắt phần base nào) nên
                                                    path="/" khớp đúng gốc, các path còn lại khai báo tuyệt đối với tiền tố "demo/". */}
                                                <Routes>
                                                    <Route path="/" element={<Home />} />
                                                    <Route path="demo" element={<Dashboard />} />
                                                    <Route path="demo/formlayout" element={<FormLayoutDemo />} />
                                                    <Route path="demo/input" element={<InputDemo />} />
                                                    <Route path="demo/floatlabel" element={<FloatLabelDemo />} />
                                                    <Route path="demo/invalidstate" element={<InvalidStateDemo />} />
                                                    <Route path="demo/button" element={<ButtonDemo />} />
                                                    <Route path="demo/table" element={<TableDemo />} />
                                                    <Route path="demo/list" element={<ListDemo />} />
                                                    <Route path="demo/tree" element={<TreeDemo />} />
                                                    <Route path="demo/panel" element={<PanelDemo />} />
                                                    <Route path="demo/stepper" element={<StepperDemo />} />
                                                    <Route path="demo/overlay" element={<OverlayDemo />} />
                                                    <Route path="demo/media" element={<MediaDemo />} />
                                                    <Route path="demo/menu" element={<MenuDemo />} />
                                                    <Route path="demo/messages" element={<MessagesDemo />} />
                                                    <Route path="demo/file" element={<FileDemo />} />
                                                    <Route path="demo/chart" element={<ChartDemo />} />
                                                    <Route path="demo/misc" element={<MiscDemo />} />
                                                    <Route path="demo/icons" element={<IconsDemo />} />
                                                    <Route path="demo/crud" element={<CrudDemo />} />
                                                    <Route path="demo/profile" element={<Profile />} />
                                                    <Route path="demo/calendar" element={<CalendarDemo />} />
                                                    <Route path="demo/timeline" element={<TimelineDemo />} />
                                                    <Route path="demo/invoice" element={<Invoice />} />
                                                    <Route path="demo/help" element={<Help />} />
                                                    <Route path="demo/empty" element={<EmptyPage />} />
                                                    <Route path="demo/documentation" element={<Documentation />} />
                                                    {/* homeTo="/demo" để nút "Về trang chủ" trên 404 trong demo đưa về dashboard demo
                                                        thay vì trang trống "/". */}
                                                    <Route path="*" element={
                                                        <StatusPage code="404" titleKey="page-not-found" messageKey="page-not-found-message" icon={SearchOffOutlined} homeTo="/demo" />
                                                    } />
                                                </Routes>
                                            </Box>
                                            <AppFooter />
                                        </Box>
                                        <AppConfigDrawer
                                            open={configOpen}
                                            onClose={() => setConfigOpen(false)}
                                            ui={ui}
                                            onChange={(patch) => blocApp.saveUI(patch)}
                                        />
                                        <AppRightMenu
                                            open={rightMenuOpen}
                                            onClose={() => setRightMenuOpen(false)}
                                        />
                                    </Box>
                                </ThemeProvider>
                            );
                        }}
                    />
                );
            }}
        />
    );
}
