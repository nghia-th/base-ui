import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Collapse from "@mui/material/Collapse";
import Chip from "@mui/material/Chip";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { MenuItem } from "../AppMenuData";
import { getIcon } from "./iconMap";

interface AppMenuListProps {
    items: MenuItem[];
    depth?: number;
    onNavigate?: () => void;
    // "sidebar": item active tô theo palette.sidebar (activeBg/activeInk) + bo góc theo
    // theme.custom.activeRadius - dùng trong AppSidebar/AppSlimMenu (rail nền tối/màu riêng).
    // "plain" (mặc định): giữ màu MUI mặc định - dùng trong popup/flyout (Popper) nổi trên nền
    // Paper sáng bình thường, không phụ thuộc màu sidebar.
    variant?: 'sidebar' | 'plain';
}

// Render đệ quy cây menu (thay cho AppSubmenu.js bên template-ui): nhóm có "items" thì render
// dạng Collapse, item lá thì render ListItemButton điều hướng qua react-router. Ở depth gốc (0),
// item có "section" sẽ được chèn thêm 1 tiêu đề nhóm (uppercase, không click được) phía trên -
// giống nhãn "PAGES" / "ELEMENTS" bên Mira. Item có "badge" sẽ hiện thêm 1 Chip nhỏ cuối dòng.
export default function AppMenuList({ items, depth = 0, onNavigate, variant = 'plain' }: AppMenuListProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
    const isSidebar = variant === 'sidebar';

    return (
        <List disablePadding component="div">
            {items.map((item) => {
                const Icon = getIcon(item.icon);
                const hasChildren = !!(item.items && item.items.length);
                const isActive = !!item.to && location.pathname === item.to;
                const key = item.label + (item.to ?? "");
                const showSection = depth === 0 && !!item.section;

                const badgeChip = item.badge != null ? (
                    <Chip
                        label={item.badge}
                        size="small"
                        sx={isSidebar ? {
                            height: 20, fontSize: 11, bgcolor: "transparent", color: "inherit",
                            border: "1px solid currentColor", opacity: 0.8, "& .MuiChip-label": { px: 0.8 }
                        } : {
                            height: 20, fontSize: 11,
                            bgcolor: item.badge === 'new' ? 'error.main' : 'action.selected',
                            color: item.badge === 'new' ? 'error.contrastText' : 'text.secondary',
                            "& .MuiChip-label": { px: 0.8 }
                        }}
                    />
                ) : null;

                const itemSx = (theme: any) => ({
                    pl: 2 + depth * 2,
                    mx: isSidebar ? 1 : 0,
                    width: isSidebar ? 'auto' : undefined,
                    borderRadius: isSidebar ? theme.custom.activeRadius : 0,
                    color: 'inherit'
                });

                const activeSx = isSidebar && isActive ? {
                    bgcolor: 'sidebar.activeBg',
                    color: 'sidebar.activeInk',
                    '&:hover': { bgcolor: 'sidebar.activeBg' }
                } : {};

                const node = hasChildren ? (
                    (() => {
                        const isOpen = openMap[key] ?? true;
                        return (
                            <React.Fragment key={key}>
                                <ListItemButton
                                    onClick={() => setOpenMap((m) => ({ ...m, [key]: !isOpen }))}
                                    sx={itemSx}
                                >
                                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={t(item.label)} />
                                    {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                </ListItemButton>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <AppMenuList items={item.items!} depth={depth + 1} onNavigate={onNavigate} variant={variant} />
                                </Collapse>
                            </React.Fragment>
                        );
                    })()
                ) : (
                    <ListItemButton
                        key={key}
                        sx={[itemSx, activeSx]}
                        onClick={() => {
                            if (item.to) navigate(item.to);
                            onNavigate?.();
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                            <Icon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={t(item.label)} />
                        {badgeChip}
                    </ListItemButton>
                );

                if (!showSection) return node;

                return (
                    <React.Fragment key={`section-${key}`}>
                        <ListSubheader
                            component="div"
                            sx={{
                                position: 'static', lineHeight: '32px', fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
                                bgcolor: 'transparent', color: isSidebar ? 'sidebar.muted' : 'text.disabled', mt: 1
                            }}
                        >
                            {t(item.section!)}
                        </ListSubheader>
                        {node}
                    </React.Fragment>
                );
            })}
        </List>
    );
}
