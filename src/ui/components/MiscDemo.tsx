import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Badge from "@mui/material/Badge";
import MailOutline from "@mui/icons-material/MailOutline";
import IconButton from "@mui/material/IconButton";
import DemoSection from "./common/DemoSection";

export default function MiscDemo() {
    const { t } = useTranslation();
    const [rating, setRating] = useState<number | null>(3);
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('rating')}>
                    <Rating value={rating} onChange={(_, v) => setRating(v)} />
                </DemoSection>
                <DemoSection title={t('chips-tags')}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={t('new')} color="primary" />
                        <Chip label={t('beta')} color="secondary" variant="outlined" />
                        <Chip label={t('deprecated')} color="error" size="small" />
                        <Badge badgeContent={4} color="error">
                            <IconButton><MailOutline /></IconButton>
                        </Badge>
                    </Stack>
                </DemoSection>
            </Grid>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('progress')}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <CircularProgress size={28} />
                </DemoSection>
                <DemoSection title={t('skeleton')}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rectangular" height={80} sx={{ my: 1, borderRadius: 1 }} />
                    <Skeleton variant="circular" width={40} height={40} />
                </DemoSection>
            </Grid>
        </Grid>
    );
}
