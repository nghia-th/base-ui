import React from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SvgIcon from "@mui/material/SvgIcon";

interface StatusPageProps {
    code: string;
    titleKey: string;
    messageKey: string;
    icon: typeof SvgIcon;
    color?: string;
}

// Component dùng chung cho NotFound/Error/AccessDenied - 1 khung "trạng thái" đơn giản.
export default function StatusPage({ code, titleKey, messageKey, icon: Icon, color = 'text.secondary' }: StatusPageProps) {
    const { t } = useTranslation();
    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', p: 3, bgcolor: 'background.default'
        }}>
            <Icon sx={{ fontSize: 72, color, mb: 2 }} />
            <Typography variant="h3" fontWeight={700}>{code}</Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>{t(titleKey)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 420 }}>
                {t(messageKey)}
            </Typography>
            <Button component={RouterLink} to="/" variant="contained">{t('back-to-home')}</Button>
        </Box>
    );
}
