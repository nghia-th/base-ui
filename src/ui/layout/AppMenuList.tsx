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
}

// Render đệ quy cây menu (thay cho AppSubmenu.js bên template-ui): nhóm có "items" thì render
// dạng Collapse, item lá thì render ListItemButton điều hướng qua react-router. Ở depth gốc (0),
// item có "section" sẽ được chèn thêm 1 tiêu đề nhóm (uppercase, không click được) phía trên -
// giống nhãn "PAGES" / "ELEMENTS" bên Mira. Item có "badge" sẽ hiện thêm 1 Chip nhỏ cuối dòng.
export default function AppMenuList({ items, depth = 0, onNavigate }: AppMenuListProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

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
                        color={item.badge === 'new' ? 'error' : 'default'}
                        sx={{ height: 20, fontSize: 11, "& .MuiChip-label": { px: 0.8 } }}
                    />
                ) : null;

                const node = hasChildren ? (
                    (() => {
                        const isOpen = openMap[key] ?? true;
                        return (
                            <React.Fragment key={key}>
                                <ListItemButton
                                    onClick={() => setOpenMap((m) => ({ ...m, [key]: !isOpen }))}
                                    sx={{ pl: 2 + depth * 2 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={t(item.label)} />
                                    {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                </ListItemButton>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <AppMenuList items={item.items!} depth={depth + 1} onNavigate={onNavigate} />
                                </Collapse>
                            </React.Fragment>
                        );
                    })()
                ) : (
                    <ListItemButton
                        key={key}
                        selected={isActive}
                        sx={{ pl: 2 + depth * 2 }}
                        onClick={() => {
                            if (item.to) navigate(item.to);
                            onNavigate?.();
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
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
                                lineHeight: '32px', fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
                                bgcolor: 'transparent', color: 'text.disabled', mt: 1
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
