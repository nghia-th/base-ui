import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItemMui from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ButtonBase from "@mui/material/ButtonBase";
import MenuIcon from "@mui/icons-material/Menu";
import AppsOutlined from "@mui/icons-material/AppsOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import ViewSidebarOutlined from "@mui/icons-material/ViewSidebarOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import ShoppingCartOutlined from "@mui/icons-material/ShoppingCartOutlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CloudDoneOutlined from "@mui/icons-material/CloudDoneOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import PeopleAltOutlined from "@mui/icons-material/PeopleAltOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import LocalParkingOutlined from "@mui/icons-material/LocalParkingOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import { lang } from "../i18next/Lang";
import i18n from "../i18next/i18next";
import LocalStorage from "../../base/LocalStorage";
import { BreadcrumbItem } from "../AppMenuData";

interface AppTopbarProps {
    leftOffset: number;
    breadcrumb: BreadcrumbItem[];
    onMenuClick: () => void;
    onConfigClick: () => void;
    onRightMenuClick: () => void;
    fullName?: string;
    onLogout: () => void;
}

interface NotificationItem {
    icon: React.ElementType;
    color: string;
    titleKey: string;
    time: string;
}

const NOTIFICATIONS: NotificationItem[] = [
    { icon: ShoppingCartOutlined, color: '#2196F3', titleKey: 'notif-new-order', time: '2m' },
    { icon: ChatBubbleOutlineOutlined, color: '#9C27B0', titleKey: 'notif-new-comment', time: '15m' },
    { icon: CloudDoneOutlined, color: '#4CAF50', titleKey: 'notif-backup-done', time: '1h' },
    { icon: AssignmentOutlined, color: '#FF9800', titleKey: 'notif-approval', time: '3h' }
];

interface InternalApp {
    icon: React.ElementType;
    color: string;
    nameKey: string;
}

// Danh sách "app nội bộ" demo - tương đương nút "Module IS" bên module-ui (chuyển qua lại giữa
// các service khác trong hệ sinh thái: HR, chấm công, kiểm soát ra vào...). base-ui không có
// backend/service thật nên chỉ demo UI dạng app-launcher (giống Google Workspace) - bấm vào 1 app
// chỉ hiện toast, không điều hướng thật.
const INTERNAL_APPS: InternalApp[] = [
    { icon: PeopleAltOutlined, color: '#2196F3', nameKey: 'app-hr' },
    { icon: PaidOutlined, color: '#4CAF50', nameKey: 'app-payroll' },
    { icon: AccessTimeOutlined, color: '#FF9800', nameKey: 'app-attendance' },
    { icon: SecurityOutlined, color: '#F44336', nameKey: 'app-access-control' },
    { icon: BadgeOutlined, color: '#9C27B0', nameKey: 'app-visitor' },
    { icon: RestaurantOutlined, color: '#795548', nameKey: 'app-canteen' },
    { icon: LocalParkingOutlined, color: '#3F51B5', nameKey: 'app-parking' },
    { icon: VideocamOutlined, color: '#009688', nameKey: 'app-camera-ai' },
    { icon: InventoryOutlined, color: '#607D8B', nameKey: 'app-assets' }
];

// Thay cho IAppTopbar.js: menu button, tiêu đề trang hiện tại (thay cho ô search), app-launcher
// (thay cho nút "Module IS"), chuông thông báo (Badge + dropdown), đổi ngôn ngữ, mở
// AppConfigDrawer (tuỳ chỉnh theme), menu user (Profile/Settings/Calendar/Inbox), nút mở
// AppRightMenu (panel bên phải), và nút Log out đứng riêng (giống module-ui, có confirm trước
// khi đăng xuất thật - xem AppShell.tsx).
export default function AppTopbar({ leftOffset, breadcrumb, onMenuClick, onConfigClick, onRightMenuClick, fullName, onLogout }: AppTopbarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
    const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
    const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
    const [appsAnchor, setAppsAnchor] = useState<null | HTMLElement>(null);

    const changeLanguage = async (code: string) => {
        await lang.loadLang(code, i18n);
        setLangAnchor(null);
    };

    const currentCrumb = breadcrumb.find((b) => b.path === location.pathname);
    const pageTitle = currentCrumb ? t(currentCrumb.label) : '';

    const openApp = (app: InternalApp) => {
        setAppsAnchor(null);
        enqueueSnackbar(t('open-app-toast', { app: t(app.nameKey) }) as string, { variant: 'info' });
    };

    return (
        <AppBar
            position="fixed"
            color="inherit"
            sx={{
                width: { sm: `calc(100% - ${leftOffset}px)` },
                ml: { sm: `${leftOffset}px` },
                transition: (theme) => theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen
                })
            }}
        >
            <Toolbar sx={{ gap: 1 }}>
                <IconButton color="inherit" edge="start" onClick={onMenuClick}>
                    <MenuIcon />
                </IconButton>

                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ ml: 0.5 }}>
                    {pageTitle}
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title={t('internal-apps') as string}>
                    <IconButton color="inherit" onClick={(e) => setAppsAnchor(e.currentTarget)}>
                        <AppsOutlined />
                    </IconButton>
                </Tooltip>
                <Popover
                    anchorEl={appsAnchor}
                    open={!!appsAnchor}
                    onClose={() => setAppsAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Box sx={{ p: 2, width: 280 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>{t('internal-apps')}</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            {INTERNAL_APPS.map((app) => (
                                <ButtonBase
                                    key={app.nameKey}
                                    onClick={() => openApp(app)}
                                    sx={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
                                        p: 1, borderRadius: 2, textAlign: 'center',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: '50%', bgcolor: `${app.color}1f`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <app.icon sx={{ color: app.color, fontSize: 20 }} />
                                    </Box>
                                    <Typography variant="caption" noWrap sx={{ maxWidth: '100%' }}>{t(app.nameKey)}</Typography>
                                </ButtonBase>
                            ))}
                        </Box>
                    </Box>
                </Popover>

                <Tooltip title={t('language') as string}>
                    <IconButton color="inherit" onClick={(e) => setLangAnchor(e.currentTarget)}>
                        <TranslateOutlined />
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>
                    <MenuItemMui onClick={() => changeLanguage('vi')}>{t('vietnamese')}</MenuItemMui>
                    <MenuItemMui onClick={() => changeLanguage('en')}>{t('english')}</MenuItemMui>
                </Menu>

                <Tooltip title={t('notifications') as string}>
                    <IconButton color="inherit" onClick={(e) => setNotifAnchor(e.currentTarget)}>
                        <Badge badgeContent={NOTIFICATIONS.length} color="error">
                            <NotificationsOutlined />
                        </Badge>
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)}>
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{t('notifications')}</Typography>
                    </Box>
                    <Divider />
                    {NOTIFICATIONS.map((n) => (
                        <MenuItemMui key={n.titleKey} onClick={() => setNotifAnchor(null)} sx={{ py: 1.2 }}>
                            <ListItemIcon>
                                <n.icon fontSize="small" sx={{ color: n.color }} />
                            </ListItemIcon>
                            <Box>
                                <Typography variant="body2">{t(n.titleKey)}</Typography>
                                <Typography variant="caption" color="text.secondary">{n.time}</Typography>
                            </Box>
                        </MenuItemMui>
                    ))}
                </Menu>

                <Tooltip title={t('right-menu') as string}>
                    <IconButton color="inherit" onClick={onRightMenuClick}>
                        <ViewSidebarOutlined sx={{ transform: "scaleX(-1)" }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title={t('theme-settings') as string}>
                    <IconButton color="inherit" onClick={onConfigClick}>
                        <SettingsOutlined />
                    </IconButton>
                </Tooltip>

                <Tooltip title={fullName ?? t('account') as string}>
                    <IconButton onClick={(e) => setUserAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                            {(fullName ?? LocalStorage.getItem('fullName') ?? 'U').charAt(0).toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={userAnchor} open={!!userAnchor} onClose={() => setUserAnchor(null)}>
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                            {fullName ?? LocalStorage.getItem('fullName') ?? ''}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItemMui onClick={() => { setUserAnchor(null); navigate('/demo/profile'); }}>
                        <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>
                        {t('profile')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setUserAnchor(null); onConfigClick(); }}>
                        <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
                        {t('settings')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setUserAnchor(null); navigate('/demo/calendar'); }}>
                        <ListItemIcon><CalendarMonthOutlined fontSize="small" /></ListItemIcon>
                        {t('calendar')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setUserAnchor(null); navigate('/demo/messages'); }}>
                        <ListItemIcon><InboxOutlined fontSize="small" /></ListItemIcon>
                        {t('inbox')}
                    </MenuItemMui>
                </Menu>

                <Tooltip title={t('log-out') as string}>
                    <IconButton color="error" onClick={onLogout} sx={{ ml: 0.5 }}>
                        <LogoutOutlined />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
}
