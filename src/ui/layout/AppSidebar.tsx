import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import { MenuItem } from "../AppMenuData";
import AppMenuList from "./AppMenuList";
import { DRAWER_WIDTH } from "./layoutConstants";

interface AppSidebarProps {
    menu: MenuItem[];
    mode: 'static' | 'overlay';
    mobileOpen: boolean;
    onCloseMobile: () => void;
    fullName?: string;
    // Chỉ dùng cho mode="static": có cho phép nút menu (3 gạch) trên AppTopbar ẩn/hiện sidebar
    // desktop hay không. Mặc định true (hiện) để không đổi hành vi cũ khi không truyền prop này.
    desktopOpen?: boolean;
}

// Sidebar responsive chuẩn MUI. Thay cho AppMenu.js (PrimeReact) bên template-ui.
// - mode="static": Drawer "persistent" trên desktop (chiếm chỗ khi mở, nhưng vẫn ẩn/hiện được qua
//   nút menu - trước đây là "permanent" nên luôn bỏ qua prop open, khiến nút 3 gạch không có tác
//   dụng gì trên desktop), "temporary" trên mobile.
// - mode="overlay": luôn là Drawer "temporary" (nổi đè lên nội dung, không chiếm chỗ) ở mọi kích
//   thước màn hình - mở/đóng qua nút menu trên AppTopbar, giống chế độ "overlay" của IAppConfig.js.
export default function AppSidebar({ menu, mode, mobileOpen, onCloseMobile, fullName, desktopOpen = true }: AppSidebarProps) {
    const { t } = useTranslation();
    const content = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "sidebar.bg", color: "sidebar.ink" }}>
            <Toolbar sx={{ gap: 1, flexShrink: 0 }}>
                <ApartmentOutlined color="primary" />
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: "inherit" }}>
                    base-ui
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: "sidebar.border" }} />
            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                <AppMenuList items={menu} onNavigate={onCloseMobile} variant="sidebar" />
            </Box>
            <Divider sx={{ borderColor: "sidebar.border" }} />
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: "sidebar.activeBg", color: "sidebar.activeInk" }}>
                    {(fullName ?? "U").charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ color: "inherit" }}>{fullName || t('account')}</Typography>
                    <Typography variant="caption" noWrap sx={{ color: "sidebar.muted" }}>{t('demo-role')}</Typography>
                </Box>
            </Box>
        </Box>
    );

    if (mode === 'overlay') {
        return (
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onCloseMobile}
                ModalProps={{ keepMounted: true }}
                sx={{
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH }
                }}
            >
                {content}
            </Drawer>
        );
    }

    return (
        <Box
            component="nav"
            sx={{
                width: { sm: desktopOpen ? DRAWER_WIDTH : 0 },
                flexShrink: { sm: 0 },
                transition: (theme) => theme.transitions.create("width", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen
                })
            }}
        >
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onCloseMobile}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", sm: "none" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH }
                }}
            >
                {content}
            </Drawer>
            <Drawer
                variant="persistent"
                open={desktopOpen}
                sx={{
                    display: { xs: "none", sm: "block" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH }
                }}
            >
                {content}
            </Drawer>
        </Box>
    );
}
