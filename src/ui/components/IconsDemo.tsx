import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AutoAwesomeMosaicOutlined from "@mui/icons-material/AutoAwesomeMosaicOutlined";
import { ICON_MAP } from "../layout/iconMap";
import DemoSection from "./common/DemoSection";

export default function IconsDemo() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('icons')} description={t('icons-desc') as string} icon={AutoAwesomeMosaicOutlined} color="#009688">
            <Grid container spacing={2}>
                {Object.entries(ICON_MAP).map(([name, Icon]) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={name}>
                        <Box sx={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                            p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' }
                        }}>
                            <Icon />
                            <Typography variant="caption" noWrap sx={{ maxWidth: '100%' }}>{name}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </DemoSection>
    );
}
