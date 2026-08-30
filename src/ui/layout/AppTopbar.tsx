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
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import { DRAWER_WIDTH } from "./layoutConstants";
import { lang } from "../i18next/Lang";
import i18n from "../i18next/i18next";
import LocalStorage from "../../base/LocalStorage";

interface AppTopbarProps {
    onMenuClick: () => void;
    onConfigClick: () => void;
    fullName?: string;
    onLogout: () => void;
}

export default function AppTopbar({ onMenuClick, onConfigClick, fullName, onLogout }: AppTopbarProps) {
    const { t } = useTranslation();
    const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
    const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

    const changeLanguage = async (code: string) => {
        await lang.loadLang(code, i18n);
        setLangAnchor(null);
    };

    return (
        <AppBar
            position="fixed"
            color="inherit"
            sx={{
                width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                ml: { sm: `${DRAWER_WIDTH}px` }
            }}
        >
            <Toolbar sx={{ gap: 1 }}>
                <IconButton
                    color="inherit"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ display: { sm: "none" } }}
                >
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
                    <MenuItemMui onClick={() => { setUserAnchor(null); onLogout(); }}>
                        <LogoutOutlined fontSize="small" sx={{ mr: 1 }} />
                        {t('log-out')}
                    </MenuItemMui>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
