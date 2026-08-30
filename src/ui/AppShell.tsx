import React, { useContext, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { AppContext, reUseBloc } from "../base/AppContext";
import { BlocApp } from "./bloc/BlocApp";
import UIStream from "./components/common/UIStream";
import { createAppTheme } from "../theme/muiTheme";
import { DRAWER_WIDTH, SLIM_WIDTH, HORIZONTAL_MENU_HEIGHT } from "./layout/layoutConstants";
import AppTopbar from "./layout/AppTopbar";
import AppSidebar from "./layout/AppSidebar";
import AppSlimMenu from "./layout/AppSlimMenu";
import AppHorizontalMenu from "./layout/AppHorizontalMenu";
import AppRightMenu from "./layout/AppRightMenu";
import AppFooter from "./layout/AppFooter";
import AppConfigDrawer from "./layout/AppConfigDrawer";
import LocalStorage from "../base/LocalStorage";
import { BASE_URL } from "../base/PrefixService";

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
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
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
                                            breadcrumb={viewMain.breadcrumb}
                                            onMenuClick={handleMenuClick}
                                            onConfigClick={() => setConfigOpen(true)}
                                            onRightMenuClick={() => setRightMenuOpen(true)}
                                            fullName={LocalStorage.getItem('fullName') ?? undefined}
                                            onLogout={handleLogout}
                                        />

                                        {isHorizontal && <AppHorizontalMenu menu={viewMain.menu} />}
                                        {isSlim && <AppSlimMenu menu={viewMain.menu} />}
                                        {!isSlim && !isHorizontal && (
                                            <AppSidebar
                                                menu={viewMain.menu}
                                                mode={isOverlay ? 'overlay' : 'static'}
                                                mobileOpen={mobileOpen}
                                                onCloseMobile={() => setMobileOpen(false)}
                                                fullName={LocalStorage.getItem('fullName') ?? undefined}
                                                desktopOpen={desktopSidebarOpen}
                                            />
                                        )}
                                        {(isSlim || isHorizontal) && (
                                            <AppSidebar
                                                menu={viewMain.menu}
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
                                                p: 3,
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
                                            <Box sx={{ flexGrow: 1 }}>
                                                {/* AppShell được mount ở path="/demo/*" (xem AppWrapper.tsx) - Routes lồng bên trong
                                                    này khớp phần đường dẫn còn lại SAU "/demo", nên path="/" ở đây tương ứng đúng
                                                    "/demo" (gốc của demo), các path con không có dấu "/" đầu để khớp tương đối
                                                    (giống ví dụ "splitting routes" chính thức của react-router v6). */}
                                                <Routes>
                                                    <Route path="/" element={<Dashboard />} />
                                                    <Route path="formlayout" element={<FormLayoutDemo />} />
                                                    <Route path="input" element={<InputDemo />} />
                                                    <Route path="floatlabel" element={<FloatLabelDemo />} />
                                                    <Route path="invalidstate" element={<InvalidStateDemo />} />
                                                    <Route path="button" element={<ButtonDemo />} />
                                                    <Route path="table" element={<TableDemo />} />
                                                    <Route path="list" element={<ListDemo />} />
                                                    <Route path="tree" element={<TreeDemo />} />
                                                    <Route path="panel" element={<PanelDemo />} />
                                                    <Route path="stepper" element={<StepperDemo />} />
                                                    <Route path="overlay" element={<OverlayDemo />} />
                                                    <Route path="media" element={<MediaDemo />} />
                                                    <Route path="menu" element={<MenuDemo />} />
                                                    <Route path="messages" element={<MessagesDemo />} />
                                                    <Route path="file" element={<FileDemo />} />
                                                    <Route path="chart" element={<ChartDemo />} />
                                                    <Route path="misc" element={<MiscDemo />} />
                                                    <Route path="icons" element={<IconsDemo />} />
                                                    <Route path="crud" element={<CrudDemo />} />
                                                    <Route path="profile" element={<Profile />} />
                                                    <Route path="calendar" element={<CalendarDemo />} />
                                                    <Route path="timeline" element={<TimelineDemo />} />
                                                    <Route path="invoice" element={<Invoice />} />
                                                    <Route path="help" element={<Help />} />
                                                    <Route path="empty" element={<EmptyPage />} />
                                                    <Route path="documentation" element={<Documentation />} />
                                                    {/* homeTo="/demo" (thay vì mặc định "/") để nút "Về trang chủ" không đẩy người
                                                        dùng ra khỏi demo khi gõ nhầm URL con của /demo. */}
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
