import React from "react";
import { useTranslation } from "react-i18next";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import IconButton from "@mui/material/IconButton";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Switch from "@mui/material/Switch";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import { COMPONENT_THEMES, VISUAL_STYLES, VisualStyleKey, SIDEBAR_BG_PRESETS } from "../../theme/muiTheme";
import { UIState } from "../bloc/BlocApp";

interface AppConfigDrawerProps {
    open: boolean;
    onClose: () => void;
    ui: UIState;
    onChange: (patch: Partial<UIState>) => void;
}

// Thay cho AppConfig.js: panel tuỳ biến theme (light/dark + accent color) - lưu qua
// BlocApp.saveUI() nên giữ được lựa chọn qua LocalStorage giống module-ui.
export default function AppConfigDrawer({ open, onClose, ui, onChange }: AppConfigDrawerProps) {
    const { t } = useTranslation();
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 300, p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{t('theme-settings')}</Typography>
                    <IconButton size="small" onClick={onClose}><CloseOutlined fontSize="small" /></IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('visual-style')}</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                    {(Object.keys(VISUAL_STYLES) as VisualStyleKey[]).map((key) => {
                        const style = VISUAL_STYLES[key];
                        const selected = (ui.visualStyle ?? 'a') === key;
                        return (
                            <Box
                                key={key}
                                onClick={() => onChange({ visualStyle: key })}
                                sx={{
                                    display: "flex", alignItems: "center", gap: 1.5, p: 1, borderRadius: 2,
                                    cursor: "pointer", border: "1.5px solid",
                                    borderColor: selected ? "primary.main" : "divider",
                                    bgcolor: selected ? "action.selected" : "transparent"
                                }}
                            >
                                <Box sx={{
                                    width: 30, height: 22, borderRadius: 1, flexShrink: 0, display: "flex", overflow: "hidden",
                                    border: "1px solid rgba(0,0,0,0.1)"
                                }}>
                                    <Box sx={{ width: "34%", bgcolor: style.sidebar.light.bg }} />
                                    <Box sx={{ flexGrow: 1, bgcolor: style.cardBg.light }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>{style.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>{t(`visual-style-${key}-desc`)}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('menu-type')}</Typography>
                <RadioGroup
                    value={ui.menuMode}
                    onChange={(_, v) => onChange({ menuMode: v })}
                    sx={{ mb: 3 }}
                >
                    <FormControlLabel value="static" control={<Radio size="small" />} label={t('static')} />
                    <FormControlLabel value="overlay" control={<Radio size="small" />} label={t('overlay')} />
                    <FormControlLabel value="slim" control={<Radio size="small" />} label={t('slim')} />
                    <FormControlLabel value="horizontal" control={<Radio size="small" />} label={t('horizontal')} />
                </RadioGroup>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('color-scheme')}</Typography>
                <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={ui.colorScheme}
                    onChange={(_, v) => v && onChange({ colorScheme: v })}
                    sx={{ mb: 3 }}
                >
                    <ToggleButton value="light"><LightModeOutlined fontSize="small" sx={{ mr: 1 }} />{t('light')}</ToggleButton>
                    <ToggleButton value="dark"><DarkModeOutlined fontSize="small" sx={{ mr: 1 }} />{t('dark')}</ToggleButton>
                </ToggleButtonGroup>

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('accent-color')}</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                    {Object.entries(COMPONENT_THEMES).map(([key, color]) => (
                        <Box
                            key={key}
                            onClick={() => onChange({ componentTheme: key })}
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: color,
                                cursor: "pointer",
                                border: ui.componentTheme === key ? "2px solid" : "2px solid transparent",
                                borderColor: ui.componentTheme === key ? "text.primary" : "transparent",
                                boxShadow: 1
                            }}
                        />
                    ))}
                </Box>

                <Box
                    onClick={() => onChange({ sidebarSyncAccent: !(ui.sidebarSyncAccent ?? true) })}
                    sx={{
                        display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2,
                        cursor: "pointer", bgcolor: "action.hover"
                    }}
                >
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{t('sidebar-sync-accent')}</Typography>
                        <Typography variant="caption" color="text.secondary">{t('sidebar-sync-accent-desc')}</Typography>
                    </Box>
                    <Switch
                        size="small"
                        checked={ui.sidebarSyncAccent ?? true}
                        onChange={(e) => onChange({ sidebarSyncAccent: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('sidebar-bg-color')}</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                    <Box
                        onClick={() => onChange({ sidebarColor: null })}
                        sx={{
                            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            bgcolor: "background.paper",
                            border: !ui.sidebarColor ? "2px solid" : "1px solid",
                            borderColor: !ui.sidebarColor ? "text.primary" : "divider",
                            boxShadow: 1
                        }}
                        title={t('use-default')}
                    >
                        <CloseOutlined fontSize="small" sx={{ opacity: 0.5 }} />
                    </Box>
                    {SIDEBAR_BG_PRESETS.map((color) => (
                        <Box
                            key={color}
                            onClick={() => onChange({ sidebarColor: color })}
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: color,
                                cursor: "pointer",
                                border: ui.sidebarColor?.toLowerCase() === color ? "2px solid" : "1px solid",
                                borderColor: ui.sidebarColor?.toLowerCase() === color ? "text.primary" : "rgba(0,0,0,0.15)",
                                boxShadow: 1
                            }}
                        />
                    ))}
                    <Box
                        component="label"
                        sx={{
                            width: 32, height: 32, borderRadius: "50%", cursor: "pointer", position: "relative",
                            overflow: "hidden", boxShadow: 1, border: "1px solid rgba(0,0,0,0.15)",
                            background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                        title={t('custom-color')}
                    >
                        <input
                            type="color"
                            value={ui.sidebarColor ?? "#122038"}
                            onChange={(e) => onChange({ sidebarColor: e.target.value })}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }}
                        />
                    </Box>
                </Box>
            </Box>
        </Drawer>
    );
}
