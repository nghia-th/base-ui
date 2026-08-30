import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";

export default function EmptyPage() {
    const { t } = useTranslation();
    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 320, color: 'text.secondary'
        }}>
            <InsertDriveFileOutlined sx={{ fontSize: 56, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">{t('empty-page-message')}</Typography>
        </Box>
    );
}
