import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { MenuItem } from "../AppMenuData";
import { getIcon } from "./iconMap";
import AppMenuList from "./AppMenuList";
import { HORIZONTAL_MENU_HEIGHT, TOPBAR_HEIGHT } from "./layoutConstants";

interface AppHorizontalMenuProps {
    menu: MenuItem[];
}

function HorizontalGroupItem({ item }: { item: MenuItem }) {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const Icon = getIcon(item.icon);
    const open = Boolean(anchorEl);

    return (
        <Box
            onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
            onMouseLeave={() => setAnchorEl(null)}
        >
            <Button
                color="inherit"
                startIcon={<Icon fontSize="small" />}
                endIcon={<ExpandMore fontSize="small" />}
                sx={{ height: HORIZONTAL_MENU_HEIGHT, textTransform: "none" }}
            >
                {t(item.label)}
            </Button>
            <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}>
                <Paper elevation={6} sx={{ minWidth: 220, py: 1 }}>
                    <AppMenuList items={item.items ?? []} onNavigate={() => setAnchorEl(null)} />
                </Paper>
            </Popper>
        </Box>
    );
}

function HorizontalLeafItem({ item }: { item: MenuItem }) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const Icon = getIcon(item.icon);
    const isActive = !!item.to && location.pathname === item.to;

    return (
        <Button
            color={isActive ? "primary" : "inherit"}
            startIcon={<Icon fontSize="small" />}
            onClick={() => item.to && navigate(item.to)}
            sx={{ height: HORIZONTAL_MENU_HEIGHT, textTransform: "none", fontWeight: isActive ? 700 : 400 }}
        >
            {t(item.label)}
        </Button>
    );
}

// Thanh menu ngang thay cho sidebar khi menuMode = "horizontal", đặt ngay dưới AppTopbar -
// giống hành vi menuMode "horizontal" của IAppSubmenu.js bên template-ui (hover mở dropdown).
export default function AppHorizontalMenu({ menu }: AppHorizontalMenuProps) {
    return (
        <Box
            sx={{
                position: "fixed",
                top: TOPBAR_HEIGHT,
                left: 0,
                right: 0,
                zIndex: (theme) => theme.zIndex.appBar - 1,
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                px: 2,
                gap: 0.5,
                overflowX: "auto",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
            }}
        >
            {menu.map((item) => (
                <Box key={item.label + (item.to ?? "")}>
                    {item.items && item.items.length
                        ? <HorizontalGroupItem item={item} />
                        : <HorizontalLeafItem item={item} />}
                </Box>
            ))}
        </Box>
    );
}
