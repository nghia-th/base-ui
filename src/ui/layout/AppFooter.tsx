import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

export default function AppFooter() {
    const { t } = useTranslation();
    return (
        <Box component="footer" sx={{ py: 2, textAlign: "center", opacity: 0.7 }}>
            <Typography variant="caption">
                base-ui &copy; {new Date().getFullYear()} — {t('powered-by-mui-bloc')}
            </Typography>
        </Box>
    );
}
