import React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import { MenuItem } from "../AppMenuData";
import AppMenuList from "./AppMenuList";
import { DRAWER_WIDTH } from "./layoutConstants";

interface AppSidebarProps {
    menu: MenuItem[];
    mode: 'static' | 'overlay';
    mobileOpen: boolean;
    onCloseMobile: () => void;
}

// Sidebar responsive chuẩn MUI. Thay cho AppMenu.js (PrimeReact) bên template-ui.
// - mode="static": Drawer "permanent" trên desktop (luôn chiếm chỗ), "temporary" trên mobile.
// - mode="overlay": luôn là Drawer "temporary" (nổi đè lên nội dung, không chiếm chỗ) ở mọi kích
//   thước màn hình - mở/đóng qua nút menu trên AppTopbar, giống chế độ "overlay" của IAppConfig.js.
export default function AppSidebar({ menu, mode, mobileOpen, onCloseMobile }: AppSidebarProps) {
    const content = (
        <div>
            <Toolbar sx={{ gap: 1 }}>
                <ApartmentOutlined color="primary" />
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                    base-ui
                </Typography>
            </Toolbar>
            <Divider />
            <AppMenuList items={menu} onNavigate={onCloseMobile} />
        </div>
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
        <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
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
                variant="permanent"
                sx={{
                    display: { xs: "none", sm: "block" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH }
                }}
                open
            >
                {content}
            </Drawer>
        </Box>
    );
}
