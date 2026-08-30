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
export const MENU_DATA: MenuItem[] = [
    { label: 'dashboard', icon: 'DashboardOutlined', to: '/', items: null, section: 'menu-section-main' },
    {
        label: 'ui-kit', icon: 'WidgetsOutlined', section: 'menu-section-elements', items: [
            { label: 'form-layout', icon: 'ViewAgendaOutlined', to: '/formlayout' },
            { label: 'input', icon: 'InputOutlined', to: '/input' },
            { label: 'float-label', icon: 'LabelOutlined', to: '/floatlabel' },
            { label: 'invalid-state', icon: 'ErrorOutlineOutlined', to: '/invalidstate' },
            { label: 'button', icon: 'SmartButtonOutlined', to: '/button' },
            { label: 'table', icon: 'TableChartOutlined', to: '/table' },
            { label: 'list', icon: 'ViewListOutlined', to: '/list' },
            { label: 'tree', icon: 'AccountTreeOutlined', to: '/tree' },
            { label: 'panel', icon: 'ViewCompactOutlined', to: '/panel' },
            { label: 'overlay', icon: 'LayersOutlined', to: '/overlay' },
            { label: 'media', icon: 'PermMediaOutlined', to: '/media' },
            { label: 'menu', icon: 'MenuOutlined', to: '/menu' },
            { label: 'messages', icon: 'MarkChatUnreadOutlined', to: '/messages' },
            { label: 'file', icon: 'AttachFileOutlined', to: '/file' },
            { label: 'chart', icon: 'BarChartOutlined', to: '/chart' },
            { label: 'misc', icon: 'MoreHorizOutlined', to: '/misc' }
        ]
    },
    {
        label: 'utilities', icon: 'BuildOutlined', items: [
            { label: 'icons', icon: 'EmojiSymbolsOutlined', to: '/icons' }
        ]
    },
    {
        label: 'pages', icon: 'AutoAwesomeMosaicOutlined', section: 'menu-section-pages', items: [
            { label: 'crud', icon: 'TableRowsOutlined', to: '/crud', badge: 12 },
            { label: 'calendar', icon: 'CalendarMonthOutlined', to: '/calendar' },
            { label: 'timeline', icon: 'TimelineOutlined', to: '/timeline' },
            { label: 'invoice', icon: 'ReceiptLongOutlined', to: '/invoice', badge: 3 },
            { label: 'help', icon: 'HelpOutlineOutlined', to: '/help' },
            { label: 'empty-page', icon: 'InsertDriveFileOutlined', to: '/empty' }
        ]
    },
    { label: 'documentation', icon: 'MenuBookOutlined', to: '/documentation', items: null, badge: 'new' }
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
