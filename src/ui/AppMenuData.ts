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
