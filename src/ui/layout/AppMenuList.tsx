import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
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
// dạng Collapse, item lá thì render ListItemButton điều hướng qua react-router.
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

                if (hasChildren) {
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
                }

                return (
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
                    </ListItemButton>
                );
            })}
        </List>
    );
}
