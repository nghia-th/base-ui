import React from "react";
import { useTranslation } from "react-i18next";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import IconButton from "@mui/material/IconButton";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import { COMPONENT_THEMES } from "../../theme/muiTheme";
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
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
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
            </Box>
        </Drawer>
    );
}
