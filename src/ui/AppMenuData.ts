export interface MenuItem {
    label: string
    icon?: string
    to?: string | null
    items?: MenuItem[] | null
    badge?: string | number
    // Chỉ set ở item cấp cao nhất: khi có giá trị, sidebar sẽ chèn 1 tiêu đề nhóm (uppercase)
    // ngay phía trên item này - tương tự nhãn "PAGES" / "ELEMENTS" của Mira.
    section?: string
}

export interface BreadcrumbItem {
    path: string
    parent: string
    label: string
}

// Menu tĩnh cho base-ui (không cần backend để chạy demo).
// Trong module-ui, menu này được build động từ UserApi.myPermission()/module() trong BlocApp.initData()
// - xem ghi chú trong ui/bloc/BlocApp.ts để biết cách thay bằng menu động khi có backend thật.
// Toàn bộ "to" ở đây đều nằm dưới tiền tố /demo (xem AppWrapper.tsx: template/UI Kit demo được
// mount ở path="/demo/*", còn "/" (root) để trống dành cho giao diện thật của project mới).
export const MENU_DATA: MenuItem[] = [
    { label: 'dashboard', icon: 'DashboardOutlined', to: '/demo', items: null, section: 'menu-section-main' },
    {
        label: 'ui-kit', icon: 'WidgetsOutlined', section: 'menu-section-elements', items: [
            { label: 'form-layout', icon: 'ViewAgendaOutlined', to: '/demo/formlayout' },
            { label: 'input', icon: 'InputOutlined', to: '/demo/input' },
            { label: 'float-label', icon: 'LabelOutlined', to: '/demo/floatlabel' },
            { label: 'invalid-state', icon: 'ErrorOutlineOutlined', to: '/demo/invalidstate' },
            { label: 'button', icon: 'SmartButtonOutlined', to: '/demo/button' },
            { label: 'table', icon: 'TableChartOutlined', to: '/demo/table' },
            { label: 'list', icon: 'ViewListOutlined', to: '/demo/list' },
            { label: 'tree', icon: 'AccountTreeOutlined', to: '/demo/tree' },
            { label: 'panel', icon: 'ViewCompactOutlined', to: '/demo/panel' },
            { label: 'stepper', icon: 'LinearScaleOutlined', to: '/demo/stepper' },
            { label: 'overlay', icon: 'LayersOutlined', to: '/demo/overlay' },
            { label: 'media', icon: 'PermMediaOutlined', to: '/demo/media' },
            { label: 'menu', icon: 'MenuOutlined', to: '/demo/menu' },
            { label: 'messages', icon: 'MarkChatUnreadOutlined', to: '/demo/messages' },
            { label: 'file', icon: 'AttachFileOutlined', to: '/demo/file' },
            { label: 'chart', icon: 'BarChartOutlined', to: '/demo/chart' },
            { label: 'misc', icon: 'MoreHorizOutlined', to: '/demo/misc' }
        ]
    },
    {
        label: 'utilities', icon: 'BuildOutlined', items: [
            { label: 'icons', icon: 'EmojiSymbolsOutlined', to: '/demo/icons' }
        ]
    },
    {
        label: 'pages', icon: 'AutoAwesomeMosaicOutlined', section: 'menu-section-pages', items: [
            { label: 'crud', icon: 'TableRowsOutlined', to: '/demo/crud', badge: 12 },
            { label: 'profile', icon: 'AccountCircleOutlined', to: '/demo/profile' },
            { label: 'calendar', icon: 'CalendarMonthOutlined', to: '/demo/calendar' },
            { label: 'timeline', icon: 'TimelineOutlined', to: '/demo/timeline' },
            { label: 'invoice', icon: 'ReceiptLongOutlined', to: '/demo/invoice', badge: 3 },
            { label: 'help', icon: 'HelpOutlineOutlined', to: '/demo/help' },
            { label: 'empty-page', icon: 'InsertDriveFileOutlined', to: '/demo/empty' }
        ]
    },
    { label: 'documentation', icon: 'MenuBookOutlined', to: '/demo/documentation', items: null, badge: 'new' }
]

function flatten(items: MenuItem[], out: BreadcrumbItem[], parentLabel = 'dashboard') {
    items.forEach(it => {
        if (it.items && it.items.length) {
            flatten(it.items, out, it.label)
        } else if (it.to) {
            out.push({ path: it.to, parent: parentLabel, label: it.label })
        }
    })
}

export const BREADCRUMB_DATA: BreadcrumbItem[] = (() => {
    const out: BreadcrumbItem[] = []
    flatten(MENU_DATA, out)
    return out
})()

// Menu riêng cho "/" (root) - KHÔNG dùng chung MENU_DATA ở trên vì các mục đó ("Thành phần",
// "Bộ giao diện"...) chỉ thuộc về /demo. Root dùng chung khung (topbar/sidebar) với /demo
// (xem AppShell.tsx) nhưng phải có menu riêng, để trống/tối giản cho tới khi bắt đầu build
// project thật - thêm item vào đây (giống cấu trúc MENU_DATA) khi cần, "to" nên trỏ vào path
// thật của project (vd "/users", "/settings"...), không cần tiền tố "/demo".
export const ROOT_MENU_DATA: MenuItem[] = [
    { label: 'home', icon: 'DashboardOutlined', to: '/', items: null }
]

export const ROOT_BREADCRUMB_DATA: BreadcrumbItem[] = (() => {
    const out: BreadcrumbItem[] = []
    flatten(ROOT_MENU_DATA, out)
    return out
})()

// Menu khu vực Phụ huynh (/app/parent/*) - phụ huynh quản lý Học sinh (con), Môn học/Bài học,
// Ngân hàng câu hỏi, giao bài kiểm tra, xem báo cáo kết quả (Task 2-7 backend quiz-service).
// "to" trỏ tuyệt đối vào /app/parent/... - xem RequireQuizRole/AppShell.tsx cho cơ chế chặn
// học sinh vào nhầm khu vực này.
export const PARENT_MENU_DATA: MenuItem[] = [
    { label: 'quiz-dashboard', icon: 'DashboardOutlined', to: '/app/parent', items: null, section: 'menu-section-main' },
    { label: 'quiz-classrooms', icon: 'MeetingRoomOutlined', to: '/app/parent/classrooms', items: null },
    { label: 'quiz-students', icon: 'PeopleOutlined', to: '/app/parent/students', items: null },
    { label: 'quiz-subjects', icon: 'MenuBookOutlined', to: '/app/parent/subjects', items: null },
    { label: 'quiz-questions', icon: 'HelpOutlineOutlined', to: '/app/parent/questions', items: null },
    { label: 'quiz-tests', icon: 'AssignmentOutlined', to: '/app/parent/tests', items: null },
    { label: 'quiz-reports', icon: 'BarChartOutlined', to: '/app/parent/reports', items: null }
]

export const PARENT_BREADCRUMB_DATA: BreadcrumbItem[] = (() => {
    const out: BreadcrumbItem[] = []
    flatten(PARENT_MENU_DATA, out)
    return out
})()

// Menu khu vực Học sinh (/app/student/*) - học sinh chỉ làm bài kiểm tra được giao và xem
// điểm/kết quả của chính mình (Task 6-7 backend), không thấy các mục quản lý của phụ huynh.
// Không có mục "Tổng quan" riêng cho Học sinh - cả app khu vực này chỉ xoay quanh 1 việc duy
// nhất (làm bài được giao), nên /app/student/tests LÀ trang chủ, không cần trang tổng quan trung
// gian trỏ sang nó (khác Phụ huynh, có nhiều mục nên giữ dashboard riêng - xem PARENT_MENU_DATA).
export const STUDENT_MENU_DATA: MenuItem[] = [
    { label: 'quiz-tests', icon: 'AssignmentOutlined', to: '/app/student/tests', items: null, section: 'menu-section-main' },
    // 2026-09-05 - textbook PDF library, read-only (view/download documents linked to a subject in
    // the student's own classroom), see StudentLibraryApi.java.
    { label: 'quiz-admin-library', icon: 'MenuBookOutlined', to: '/app/student/library', items: null }
]

export const STUDENT_BREADCRUMB_DATA: BreadcrumbItem[] = (() => {
    const out: BreadcrumbItem[] = []
    flatten(STUDENT_MENU_DATA, out)
    return out
})()

// Menu khu vực Admin (/app/admin/*, 2026-09-04) - Admin quản trị tài khoản Phụ huynh
// (list/create/khoá-mở/xoá, xem AdminParentApi.java) - không có dashboard riêng, giống Học sinh
// (STUDENT_MENU_DATA ở trên) chỉ xoay quanh đúng 1 việc nên KHÔNG cần trang tổng quan trung gian.
export const ADMIN_MENU_DATA: MenuItem[] = [
    { label: 'quiz-admin-parents', icon: 'PeopleOutlined', to: '/app/admin/parents', items: null, section: 'menu-section-main' },
    // 2026-09-05 - Textbook PDF library ("thu vien sach giao khoa") - every Admin can manage it,
    // no root restriction (unlike the "quiz-admin-admins" entry below), so it is NOT filtered by
    // adminSidebarMenu(isRoot) further down.
    { label: 'quiz-admin-library', icon: 'MenuBookOutlined', to: '/app/admin/library', items: null },
    // 2026-09-05 - "Quản lý Admin" (tạo/xoá tài khoản Admin khác) CHỈ root mới thấy/dùng được -
    // xem AppShell.tsx's adminSidebarMenu(isRoot) (lọc mục này ra khỏi sidebar cho Admin thường)
    // và RequireAdminRoot (chặn cả việc gõ tay URL). Vẫn khai báo ở đây (không tách file riêng)
    // để ADMIN_BREADCRUMB_DATA bên dưới có tiêu đề đúng cho route này dù sidebar có ẩn hay không.
    { label: 'quiz-admin-admins', icon: 'AdminPanelSettingsOutlined', to: '/app/admin/admins', items: null },
    // 2026-09-04, phần 4/4 - Admin tự sửa chuỗi dịch UI (vi/en) mà không cần deploy lại code, xem
    // BlocAdminTranslations.ts.
    { label: 'quiz-admin-translations', icon: 'TranslateOutlined', to: '/app/admin/translations', items: null }
]

export const ADMIN_BREADCRUMB_DATA: BreadcrumbItem[] = (() => {
    const out: BreadcrumbItem[] = []
    flatten(ADMIN_MENU_DATA, out)
    return out
})()

// 2026-09-05 - Sidebar/menu ngang cho khu vực Admin PHẢI lọc theo isRoot (khác breadcrumb ở trên,
// vẫn dùng nguyên ADMIN_MENU_DATA đầy đủ) - AppShell.tsx gọi hàm này thay vì đọc thẳng
// ADMIN_MENU_DATA khi build menu hiển thị, để mục "Quản lý Admin" chỉ hiện cho tài khoản root
// (xem entity/Admin.java's javadoc + AdminManageApi.java bên backend - việc chặn thật nằm ở đó,
// đây chỉ là hàng rào UX ẩn bớt mục Admin thường không dùng được).
export function adminSidebarMenu(isRoot: boolean): MenuItem[] {
    return isRoot ? ADMIN_MENU_DATA : ADMIN_MENU_DATA.filter(item => item.to !== '/app/admin/admins')
}
