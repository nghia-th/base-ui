import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItemMui from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
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
import { lang } from "../i18next/Lang";
import i18n from "../i18next/i18next";
import LocalStorage from "../../base/LocalStorage";

interface AppTopbarProps {
    leftOffset: number;
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

// Thay cho IAppTopbar.js: menu button, search, chuông thông báo (Badge + dropdown), đổi ngôn
// ngữ, mở AppConfigDrawer (tuỳ chỉnh theme), menu user đầy đủ hơn (Profile/Settings/Calendar/
// Inbox/Log out), và nút mở AppRightMenu (panel bên phải) - tương đương .right-sidebar-item.
export default function AppTopbar({ leftOffset, onMenuClick, onConfigClick, onRightMenuClick, fullName, onLogout }: AppTopbarProps) {
    const { t } = useTranslation();
    const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
    const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
    const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

    const changeLanguage = async (code: string) => {
        await lang.loadLang(code, i18n);
        setLangAnchor(null);
    };

    return (
        <AppBar
            position="fixed"
            color="inherit"
            sx={{
                width: { sm: `calc(100% - ${leftOffset}px)` },
                ml: { sm: `${leftOffset}px` }
            }}
        >
            <Toolbar sx={{ gap: 1 }}>
                <IconButton color="inherit" edge="start" onClick={onMenuClick}>
                    <MenuIcon />
                </IconButton>

                <Box
                    sx={{
                        display: { xs: "none", sm: "flex" },
                        alignItems: "center",
                        bgcolor: "action.hover",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        flexGrow: 1,
                        maxWidth: 360
                    }}
                >
                    <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                    <InputBase placeholder={t('search') as string} fullWidth />
                </Box>

                <Box sx={{ flexGrow: 1 }} />

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
                    <MenuItemMui onClick={() => setUserAnchor(null)}>
                        <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>
                        {t('profile')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => { setUserAnchor(null); onConfigClick(); }}>
                        <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
                        {t('settings')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => setUserAnchor(null)}>
                        <ListItemIcon><CalendarMonthOutlined fontSize="small" /></ListItemIcon>
                        {t('calendar')}
                    </MenuItemMui>
                    <MenuItemMui onClick={() => setUserAnchor(null)}>
                        <ListItemIcon><InboxOutlined fontSize="small" /></ListItemIcon>
                        {t('inbox')}
                    </MenuItemMui>
                    <Divider />
                    <MenuItemMui onClick={() => { setUserAnchor(null); onLogout(); }}>
                        <ListItemIcon><LogoutOutlined fontSize="small" /></ListItemIcon>
                        {t('log-out')}
                    </MenuItemMui>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
