import React, { useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { AppContext, reUseBloc } from "../base/AppContext";
import { BlocApp } from "./bloc/BlocApp";
import UIStream from "./components/common/UIStream";
import { DRAWER_WIDTH, SLIM_WIDTH, HORIZONTAL_MENU_HEIGHT } from "./layout/layoutConstants";
import {
    PARENT_MENU_DATA, PARENT_BREADCRUMB_DATA,
    STUDENT_MENU_DATA, STUDENT_BREADCRUMB_DATA,
    ADMIN_BREADCRUMB_DATA, adminSidebarMenu
} from "./AppMenuData";
import AppTopbar from "./layout/AppTopbar";
import AppSidebar from "./layout/AppSidebar";
import AppSlimMenu from "./layout/AppSlimMenu";
import AppHorizontalMenu from "./layout/AppHorizontalMenu";
import AppRightMenu from "./layout/AppRightMenu";
import AppFooter from "./layout/AppFooter";
import AppConfigDrawer from "./layout/AppConfigDrawer";
import ChangePasswordDialog from "./components/common/ChangePasswordDialog";
import SetUsernameDialog from "./components/common/SetUsernameDialog";
import LocalStorage from "../base/LocalStorage";
import { BASE_URL } from "../base/PrefixService";
import { QuizAuthApi } from "../api/QuizAuthApi";

import ParentDashboard from "./pages/parent/ParentDashboard";
import StudentTests from "./pages/student/Tests";
import TakeTest from "./pages/student/TakeTest";
import ParentClassrooms from "./pages/parent/Classrooms";
import ParentStudents from "./pages/parent/Students";
import ParentSubjects from "./pages/parent/Subjects";
import ParentQuestions from "./pages/parent/Questions";
import ParentTests from "./pages/parent/Tests";
import ParentReports from "./pages/parent/Reports";
import AdminParents from "./pages/admin/Parents";
import AdminAdmins from "./pages/admin/Admins";
import AdminLibrary from "./pages/admin/Library";
import StudentLibrary from "./pages/student/Library";
import AdminTranslations from "./pages/admin/Translations";
import { QuizLoginRole } from "./bloc/BlocQuizLogin";
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

// Chỉ hiện children khi quizRole (lưu ở LocalStorage lúc login - xem BlocQuizLogin.ts) khớp
// đúng role yêu cầu của khu vực, ngược lại điều hướng sang khu vực đúng của role đang đăng
// nhập. Đây CHỈ là hàng rào UX (học sinh gõ tay /app/parent/... không thấy trang của phụ
// huynh) - chốt chặn dữ liệu thật vẫn nằm ở JWT role claim bên backend (JwtAuthFilter.java +
// @PreAuthorize/ownership check ở từng API), không phải ở component này.
function RequireQuizRole({ role, children }: { role: QuizLoginRole; children: React.ReactElement }) {
    const currentRole = LocalStorage.getItem('quizRole');
    if (currentRole !== role) {
        // 2026-09-04: thêm nhánh 'admin' - Admin không có gì chung với khu vực Phụ huynh/Học sinh
        // (RequireQuizRole role="admin" chỉ canh app/admin/parents), nên khi role hiện tại LÀ admin
        // mà lỡ vào nhầm 1 route parent/student, đưa thẳng về /app/admin/parents thay vì mặc định
        // /app/parent (Admin không có Parent data để xem).
        const homeOf = currentRole === 'admin' ? '/app/admin/parents' : (currentRole === 'student' ? '/app/student/tests' : '/app/parent');
        return <Navigate replace to={homeOf} />;
    }
    return children;
}

// 2026-09-05 - Admin quản lý Admin (tạo/xoá tài khoản Admin khác) CHỈ root mới vào được, xem
// AppMenuData.ts's adminSidebarMenu (ẩn mục menu) - đây là hàng rào UX thứ 2, chặn cả việc Admin
// thường gõ tay URL /app/admin/admins. Đọc thẳng quizProfile đã lưu lúc login (xem
// BlocQuizLogin.ts's handleAuthSuccess) - KHÔNG gọi API riêng chỉ để biết root hay không, cùng lý
// do quizRole được đọc thẳng từ LocalStorage ở RequireQuizRole trên. Chốt chặn dữ liệu thật vẫn ở
// AdminManageService#requireRoot bên backend (COMMON_004 FORBIDDEN nếu không phải root).
function isCurrentAdminRoot(): boolean {
    try {
        const raw = LocalStorage.getItem('quizProfile');
        return raw ? JSON.parse(raw)?.root === true : false;
    } catch {
        return false;
    }
}

function RequireAdminRoot({ children }: { children: React.ReactElement }) {
    if (!isCurrentAdminRoot()) {
        return <Navigate replace to="/app/admin/parents" />;
    }
    return children;
}

// AppShell = khung đã đăng nhập (topbar + sidebar + footer + content), tương đương ISmartApp.js
// bên module-ui - dùng reUseBloc(appContext, BlocApp) để lấy menu/theme, UIStream để re-render
// khi BlocApp phát dữ liệu mới qua 'loadInitStream' (menu) và 'ui' (theme).
export default function AppShell() {
    const appContext = useContext(AppContext);
    const blocApp = reUseBloc(appContext, BlocApp);
    // "ui" (theme/màu/layout) nằm ở BlocApplication (appContext.app), KHÔNG phải blocApp - xem
    // ghi chú trong ui/bloc/BlocApplication.ts. appContext.app luôn tồn tại trong Provider này
    // (AppWrapper.tsx set app: app không điều kiện), nên dùng "!" giống các chỗ khác trong file
    // (vd. handleLogout bên dưới cũng gọi appContext.app?...).
    const app = appContext.app!;
    const location = useLocation();
    // "/demo" và "/demo/*" dùng menu template/UI Kit (viewMain.menu từ BlocApp); "/" và mọi path
    // khác NGOÀI /demo (project thật của anh sau này) dùng ROOT_MENU_DATA riêng, để trống/tối
    // giản - xem AppMenuData.ts. 2 khu vực này dùng chung 1 khung (topbar/sidebar) nhưng KHÔNG
    // dùng chung menu, tránh lẫn menu demo (Thành phần/Bộ giao diện...) vào project thật.
    const isDemoRoute = location.pathname === '/demo' || location.pathname.startsWith('/demo/');
    // Khu vực đã đăng nhập được tách theo pathname /app/parent/* và /app/student/* (anh chọn tiền
    // tố /app để tách rõ khỏi /demo và các route công khai như /login, /register - xem
    // ui-base-status.md, quyết định #4). "/" luôn redirect ngay sang đúng khu vực theo quizRole
    // (xem <Route path="/"> bên dưới), nên trường hợp "không demo, không parent, không student"
    // trong thực tế chỉ còn path lạ (404) - mặc định về menu Phụ huynh cho an toàn.
    const isParentArea = location.pathname === '/app/parent' || location.pathname.startsWith('/app/parent/');
    const isStudentArea = location.pathname === '/app/student' || location.pathname.startsWith('/app/student/');
    const isAdminArea = location.pathname === '/app/admin' || location.pathname.startsWith('/app/admin/');
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
                    // Thu hồi refresh token của thiết bị này trên server (2026-09-04, xem
                    // AuthService.java's javadoc) TRƯỚC khi xoá LocalStorage - fire-and-forget
                    // (không chờ/không chặn UI, không cần xử lý lỗi: dù call này thất bại thì
                    // luồng đăng xuất phía client vẫn diễn ra như cũ, chỉ là refresh token đó nằm
                    // im tới khi tự hết hạn thay vì bị thu hồi ngay - không phải lỗ hổng MỚI so
                    // với hành vi trước đây, xem QuizAuthApi.ts's logout()).
                    const refreshToken = LocalStorage.getRefreshToken();
                    if (refreshToken) {
                        QuizAuthApi.logout(refreshToken).run().catch(() => {});
                    }
                    LocalStorage.deleteToken();
                    LocalStorage.deleteRefreshToken();
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
                const menu = isDemoRoute ? viewMain.menu : (isParentArea ? PARENT_MENU_DATA : (isStudentArea ? STUDENT_MENU_DATA : (isAdminArea ? adminSidebarMenu(isCurrentAdminRoot()) : PARENT_MENU_DATA)));
                const breadcrumb = isDemoRoute ? viewMain.breadcrumb : (isParentArea ? PARENT_BREADCRUMB_DATA : (isStudentArea ? STUDENT_BREADCRUMB_DATA : (isAdminArea ? ADMIN_BREADCRUMB_DATA : PARENT_BREADCRUMB_DATA)));
                return (
                    <UIStream
                        initialData={app.getUI()}
                        stream={app.getStream('ui')}
                        builder={(uiSnapshot) => {
                            const ui = uiSnapshot.data ?? app.getUI();
                            const menuMode = ui.menuMode ?? 'static';
                            const isHorizontal = menuMode === 'horizontal';
                            const isSlim = menuMode === 'slim';
                            const isOverlay = menuMode === 'overlay';
                            const isStaticCollapsed = !isHorizontal && !isSlim && !isOverlay && !desktopSidebarOpen;
                            const leftOffset = (isHorizontal || isOverlay || isStaticCollapsed) ? 0 : (isSlim ? SLIM_WIDTH : DRAWER_WIDTH);
                            return (
                                <Box sx={{ display: 'flex' }}>
                                    <AppTopbar
                                        bloc={blocApp}
                                        leftOffset={leftOffset}
                                        breadcrumb={breadcrumb}
                                        onMenuClick={handleMenuClick}
                                        onConfigClick={() => setConfigOpen(true)}
                                        onRightMenuClick={() => setRightMenuOpen(true)}
                                        fullName={LocalStorage.getItem('fullName') ?? undefined}
                                        onLogout={handleLogout}
                                        onChangePasswordClick={() => blocApp.openChangePassword()}
                                        onSetUsernameClick={() => blocApp.openSetUsername()}
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
                                                {/* "/" luôn redirect ngay sang đúng khu vực đã đăng nhập theo quizRole
                                                    (lưu lúc login - xem BlocQuizLogin.ts) - không có nội dung riêng cho "/". */}
                                                <Route path="/" element={
                                                    <Navigate replace to={
                                                        LocalStorage.getItem('quizRole') === 'student' ? '/app/student/tests'
                                                            : (LocalStorage.getItem('quizRole') === 'admin' ? '/app/admin/parents' : '/app/parent')
                                                    } />
                                                } />
                                                <Route path="app/parent" element={
                                                    <RequireQuizRole role="parent"><ParentDashboard /></RequireQuizRole>
                                                } />
                                                <Route path="app/parent/classrooms" element={
                                                    <RequireQuizRole role="parent"><ParentClassrooms /></RequireQuizRole>
                                                } />
                                                <Route path="app/parent/students" element={
                                                    <RequireQuizRole role="parent"><ParentStudents /></RequireQuizRole>
                                                } />
                                                <Route path="app/parent/subjects" element={
                                                    <RequireQuizRole role="parent"><ParentSubjects /></RequireQuizRole>
                                                } />
                                                <Route path="app/parent/questions" element={
                                                    <RequireQuizRole role="parent"><ParentQuestions /></RequireQuizRole>
                                                } />
                                                <Route path="app/parent/tests" element={
                                                    <RequireQuizRole role="parent"><ParentTests /></RequireQuizRole>
                                                } />
                                                <Route path="app/parent/reports" element={
                                                    <RequireQuizRole role="parent"><ParentReports /></RequireQuizRole>
                                                } />
                                                <Route path="app/student/tests" element={
                                                    <RequireQuizRole role="student"><StudentTests /></RequireQuizRole>
                                                } />
                                                <Route path="app/student/library" element={
                                                    <RequireQuizRole role="student"><StudentLibrary /></RequireQuizRole>
                                                } />
                                                <Route path="app/student/tests/:testId/take" element={
                                                    <RequireQuizRole role="student"><TakeTest /></RequireQuizRole>
                                                } />
                                                <Route path="app/admin/parents" element={
                                                    <RequireQuizRole role="admin"><AdminParents /></RequireQuizRole>
                                                } />
                                                <Route path="app/admin/admins" element={
                                                    <RequireQuizRole role="admin"><RequireAdminRoot><AdminAdmins /></RequireAdminRoot></RequireQuizRole>
                                                } />
                                                <Route path="app/admin/library" element={
                                                    <RequireQuizRole role="admin"><AdminLibrary /></RequireQuizRole>
                                                } />
                                                <Route path="app/admin/translations" element={
                                                    <RequireQuizRole role="admin"><AdminTranslations /></RequireQuizRole>
                                                } />
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
                                        onChange={(patch) => app.saveUI(patch)}
                                    />
                                    <AppRightMenu
                                        open={rightMenuOpen}
                                        onClose={() => setRightMenuOpen(false)}
                                    />
                                    <ChangePasswordDialog bloc={blocApp} />
                                    <SetUsernameDialog bloc={blocApp} />
                                </Box>
                            );
                        }}
                    />
                );
            }}
        />
    );
}
