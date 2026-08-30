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
import { DRAWER_WIDTH } from "./layout/layoutConstants";
import AppTopbar from "./layout/AppTopbar";
import AppSidebar from "./layout/AppSidebar";
import AppFooter from "./layout/AppFooter";
import AppBreadcrumbBar from "./layout/AppBreadcrumbBar";
import AppConfigDrawer from "./layout/AppConfigDrawer";
import LocalStorage from "../base/LocalStorage";
import { BASE_URL } from "../base/PrefixService";

import Dashboard from "./pages/Dashboard";
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
import NotFound from "./pages/NotFound";

// AppShell = khung đã đăng nhập (topbar + sidebar + footer + content), tương đương ISmartApp.js
// bên module-ui - dùng reUseBloc(appContext, BlocApp) để lấy menu/theme, UIStream để re-render
// khi BlocApp phát dữ liệu mới qua 'loadInitStream' (menu) và 'ui' (theme).
export default function AppShell() {
    const appContext = useContext(AppContext);
    const blocApp = reUseBloc(appContext, BlocApp);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);

    useEffect(() => {
        blocApp.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        LocalStorage.deleteToken();
        window.location.href = BASE_URL + '/login';
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
                            const theme = createAppTheme(ui.colorScheme, ui.componentTheme);
                            return (
                                <ThemeProvider theme={theme}>
                                    <CssBaseline />
                                    <Box sx={{ display: 'flex' }}>
                                        <AppTopbar
                                            onMenuClick={() => setMobileOpen(true)}
                                            onConfigClick={() => setConfigOpen(true)}
                                            fullName={LocalStorage.getItem('fullName') ?? undefined}
                                            onLogout={handleLogout}
                                        />
                                        <AppSidebar
                                            menu={viewMain.menu}
                                            mobileOpen={mobileOpen}
                                            onCloseMobile={() => setMobileOpen(false)}
                                        />
                                        <Box
                                            component="main"
                                            sx={{
                                                flexGrow: 1,
                                                p: 3,
                                                width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                                                minHeight: '100vh',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <Toolbar />
                                            <AppBreadcrumbBar breadcrumb={viewMain.breadcrumb} />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Routes>
                                                    <Route path="/" element={<Dashboard />} />
                                                    <Route path="/formlayout" element={<FormLayoutDemo />} />
                                                    <Route path="/input" element={<InputDemo />} />
                                                    <Route path="/floatlabel" element={<FloatLabelDemo />} />
                                                    <Route path="/invalidstate" element={<InvalidStateDemo />} />
                                                    <Route path="/button" element={<ButtonDemo />} />
                                                    <Route path="/table" element={<TableDemo />} />
                                                    <Route path="/list" element={<ListDemo />} />
                                                    <Route path="/tree" element={<TreeDemo />} />
                                                    <Route path="/panel" element={<PanelDemo />} />
                                                    <Route path="/overlay" element={<OverlayDemo />} />
                                                    <Route path="/media" element={<MediaDemo />} />
                                                    <Route path="/menu" element={<MenuDemo />} />
                                                    <Route path="/messages" element={<MessagesDemo />} />
                                                    <Route path="/file" element={<FileDemo />} />
                                                    <Route path="/chart" element={<ChartDemo />} />
                                                    <Route path="/misc" element={<MiscDemo />} />
                                                    <Route path="/icons" element={<IconsDemo />} />
                                                    <Route path="/crud" element={<CrudDemo />} />
                                                    <Route path="/calendar" element={<CalendarDemo />} />
                                                    <Route path="/timeline" element={<TimelineDemo />} />
                                                    <Route path="/invoice" element={<Invoice />} />
                                                    <Route path="/help" element={<Help />} />
                                                    <Route path="/empty" element={<EmptyPage />} />
                                                    <Route path="/documentation" element={<Documentation />} />
                                                    <Route path="*" element={<NotFound />} />
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
