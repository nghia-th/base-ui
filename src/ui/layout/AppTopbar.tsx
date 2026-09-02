import React, { useRef, useState } from "react";
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

import ViewSidebarOutlined from "@mui/icons-material/ViewSidebarOutlined";
import MoreVertOutlined from "@mui/icons-material/MoreVertOutlined";
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
    bloc:any;
    leftOffset: number;
    breadcrumb: BreadcrumbItem[];
    onMenuClick: () => void;
    onConfigClick: () => void;
    onRightMenuClick: () => void;
    fullName?: string;
    onLogout: () => void;
}





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
export default function AppTopbar({bloc, leftOffset, breadcrumb, onMenuClick, onConfigClick, onRightMenuClick, fullName, onLogout }: AppTopbarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
    const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

    const [appsAnchor, setAppsAnchor] = useState<null | HTMLElement>(null);
    const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
    // Trên màn hình hẹp (mobile), nút "Ứng dụng nội bộ" tự thu vào menu "more" (3 chấm dọc) thay
    // vì hiện riêng từng icon - moreButtonRef dùng làm anchor chung cho Popover app-launcher khi
    // mở từ trong menu "more" (menu "more" đã đóng lúc đó nên không thể anchor vào chính item vừa
    // bấm được).
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    const changeLanguage = async (code: string) => {
        try {
            console.log(`Changing language to ${code}`);
            // await lang.loadLang(code, i18n);
            await bloc.loadLang(code)
        } catch (e) {
            // Show a snackbar error if language change fails
            enqueueSnackbar(t('error') as string, { variant: 'error' });
        } finally {
            // Always close the language menu
            setLangAnchor(null);
        }
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
            <Toolbar sx={{ gap: { xs: 0.25, sm: 1 } }}>
                <IconButton color="inherit" edge="start" onClick={onMenuClick}>
                    <MenuIcon />
                </IconButton>

                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ ml: 0.5, minWidth: 0, flexShrink: 1 }}>
                    {pageTitle}
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                {/* Ứng dụng nội bộ / ngôn ngữ / panel phải / cài đặt giao diện: hiện riêng từng icon
                    từ "sm" trở lên, gộp vào nút "more" (3 chấm) trên mobile để topbar không tràn -
                    xem nút more bên dưới. */}
                <Tooltip title={t('internal-apps') as string}>
                    <IconButton
                        color="inherit"
                        onClick={(e) => setAppsAnchor(e.currentTarget)}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
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
                    <IconButton
                        color="inherit"
                        onClick={(e) => setLangAnchor(e.currentTarget)}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        <TranslateOutlined />
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>
                    <MenuItemMui onClick={() => changeLanguage('vi')}>{t('vietnamese')}</MenuItemMui>
                    <MenuItemMui onClick={() => changeLanguage('en')}>{t('english')}</MenuItemMui>
                </Menu>




                <Tooltip title={t('right-menu') as string}>
                    <IconButton
                        color="inherit"
                        onClick={onRightMenuClick}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        <ViewSidebarOutlined sx={{ transform: "scaleX(-1)" }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title={t('theme-settings') as string}>
                    <IconButton
                        color="inherit"
                        onClick={onConfigClick}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        <SettingsOutlined />
                    </IconButton>
                </Tooltip>

                {/* Nút "more" (3 chấm dọc) - chỉ hiện trên mobile (xs), gộp 4 hành động ít quan
                    trọng hơn ở trên (app nội bộ/ngôn ngữ/panel phải/cài đặt) vào 1 menu duy nhất
                    để topbar không tràn ngang trên màn hình hẹp. */}
                <IconButton
                    ref={moreButtonRef}
                    color="inherit"
                    onClick={(e) => setMoreAnchor(e.currentTarget)}
                    sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                >
                    <MoreVertOutlined />
                </IconButton>
                <Menu anchorEl={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)}>
                    <MenuItemMui onClick={() => { setMoreAnchor(null); setAppsAnchor(moreButtonRef.current); }}>
                        <ListItemIcon><AppsOutlined fontSize="small" /></ListItemIcon>
                        {t('internal-apps')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setMoreAnchor(null); changeLanguage('vi'); }}>
                        <ListItemIcon><TranslateOutlined fontSize="small" /></ListItemIcon>
                        {t('vietnamese')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setMoreAnchor(null); changeLanguage('en'); }}>
                        <ListItemIcon><TranslateOutlined fontSize="small" /></ListItemIcon>
                        {t('english')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setMoreAnchor(null); onRightMenuClick(); }}>
                        <ListItemIcon><ViewSidebarOutlined fontSize="small" sx={{ transform: "scaleX(-1)" }} /></ListItemIcon>
                        {t('right-menu')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setMoreAnchor(null); onConfigClick(); }}>
                        <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
                        {t('theme-settings')}
                    </MenuItemMui>
                </Menu>

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
