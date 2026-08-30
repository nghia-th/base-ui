import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import { MenuItem } from "../AppMenuData";
import { getIcon } from "./iconMap";
import AppMenuList from "./AppMenuList";
import { SLIM_WIDTH } from "./layoutConstants";

interface AppSlimMenuProps {
    menu: MenuItem[];
}

function SlimLeafItem({ item }: { item: MenuItem }) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const Icon = getIcon(item.icon);
    const isActive = !!item.to && location.pathname === item.to;

    return (
        <Tooltip title={t(item.label) as string} placement="right">
            <IconButton
                onClick={() => item.to && navigate(item.to)}
                sx={(theme) => ({
                    width: 48, height: 48, mx: "auto", mb: 0.5,
                    borderRadius: theme.custom.activeRadius,
                    color: isActive ? "sidebar.activeInk" : "inherit",
                    bgcolor: isActive ? "sidebar.activeBg" : "transparent",
                    "&:hover": { bgcolor: isActive ? "sidebar.activeBg" : "action.hover" }
                })}
            >
                <Icon />
            </IconButton>
        </Tooltip>
    );
}

// Item nhóm ở chế độ slim: hover vào icon sẽ mở flyout (Popper) liệt kê các item con bên phải,
// giống hành vi "menuMode === slim" của IAppSubmenu.js bên template-ui (onMenuItemMouseEnter).
function SlimGroupItem({ item }: { item: MenuItem }) {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const Icon = getIcon(item.icon);
    const open = Boolean(anchorEl);

    return (
        <Box
            onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
            onMouseLeave={() => setAnchorEl(null)}
        >
            <Tooltip title={open ? "" : (t(item.label) as string)} placement="right">
                <IconButton
                    sx={(theme) => ({
                        width: 48, height: 48, mx: "auto", mb: 0.5,
                        borderRadius: theme.custom.activeRadius, color: "inherit"
                    })}
                >
                    <Icon />
                </IconButton>
            </Tooltip>
            <Popper open={open} anchorEl={anchorEl} placement="right-start" sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}>
                <Paper elevation={6} sx={{ minWidth: 220, py: 1, ml: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2, py: 0.5 }}>
                        {t(item.label)}
                    </Typography>
                    <AppMenuList items={item.items ?? []} onNavigate={() => setAnchorEl(null)} />
                </Paper>
            </Popper>
        </Box>
    );
}

// Sidebar dạng "slim": chỉ hiện icon (~80px), hover vào nhóm để xem flyout menu con.
// Thay cho AppMenu.js khi menuMode = "slim" bên template-ui.
export default function AppSlimMenu({ menu }: AppSlimMenuProps) {
    return (
        <Box component="nav" sx={{ width: SLIM_WIDTH, flexShrink: 0 }}>
            <Drawer
                variant="permanent"
                open
                sx={{
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box", width: SLIM_WIDTH, overflowX: "visible", alignItems: "center",
                        bgcolor: "sidebar.bg", color: "sidebar.ink", borderRight: "1px solid", borderColor: "sidebar.border"
                    }
                }}
            >
                <Toolbar sx={{ justifyContent: "center", width: "100%" }}>
                    <ApartmentOutlined color="primary" />
                </Toolbar>
                <Box sx={{ width: "100%", py: 1 }}>
                    {menu.map((item) => (
                        <Box key={item.label + (item.to ?? "")} sx={{ display: "flex", justifyContent: "center" }}>
                            {item.items && item.items.length
                                ? <SlimGroupItem item={item} />
                                : <SlimLeafItem item={item} />}
                        </Box>
                    ))}
                </Box>
            </Drawer>
        </Box>
    );
}
