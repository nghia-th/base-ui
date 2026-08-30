import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { RIGHT_MENU_WIDTH } from "./layoutConstants";

interface AppRightMenuProps {
    open: boolean;
    onClose: () => void;
}

interface ActivityItem {
    color: string;
    titleKey: string;
    time: string;
}

const ACTIVITY: ActivityItem[] = [
    { color: '#4CAF50', titleKey: 'activity-new-order', time: '5m' },
    { color: '#2196F3', titleKey: 'activity-comment', time: '20m' },
    { color: '#FF9800', titleKey: 'activity-review', time: '1h' },
    { color: '#9C27B0', titleKey: 'activity-report', time: '3h' }
];

// Panel bên phải (thay cho IAppRightMenu.js) - độc lập với AppConfigDrawer (panel tuỳ chỉnh
// theme). Ở đây gồm: dòng thời gian hoạt động (Activity), 1 widget "Quick note" trung tính
// (thay cho "Quick Withdraw" mang tính domain tài chính của template-ui) và Shipment Tracking.
export default function AppRightMenu({ open, onClose }: AppRightMenuProps) {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const [note, setNote] = useState('');

    const saveNote = () => {
        enqueueSnackbar(t('toast-success-message') as string, { variant: 'success' });
        setNote('');
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: RIGHT_MENU_WIDTH, p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{t('right-menu')}</Typography>
                    <IconButton size="small" onClick={onClose}><CloseOutlined fontSize="small" /></IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>{t('activity')}</Typography>
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {ACTIVITY.map((a) => (
                        <Box key={a.titleKey} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: a.color, mt: 0.6, flexShrink: 0 }} />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2">{t(a.titleKey)}</Typography>
                                <Typography variant="caption" color="text.secondary">{a.time}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Stack>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('quick-note')}</Typography>
                <TextField
                    multiline
                    minRows={3}
                    fullWidth
                    size="small"
                    placeholder={t('quick-note-placeholder') as string}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    sx={{ mb: 1 }}
                />
                <Button variant="contained" size="small" fullWidth disabled={!note.trim()} onClick={saveNote}>
                    {t('save-note')}
                </Button>

                <Divider sx={{ my: 3 }} />

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{t('shipment-tracking')}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('shipment-tracking-desc')}
                </Typography>
                <Box
                    sx={{
                        height: 140,
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)"
                    }}
                />
            </Box>
        </Drawer>
    );
}
