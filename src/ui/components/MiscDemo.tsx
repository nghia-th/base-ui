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
import Pagination from "@mui/material/Pagination";
import MailOutline from "@mui/icons-material/MailOutline";
import IconButton from "@mui/material/IconButton";
import StarOutlined from "@mui/icons-material/StarOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import DonutLargeOutlined from "@mui/icons-material/DonutLargeOutlined";
import BlurOnOutlined from "@mui/icons-material/BlurOnOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import DemoSection from "./common/DemoSection";

export default function MiscDemo() {
    const { t } = useTranslation();
    const [rating, setRating] = useState<number | null>(3);
    const [page, setPage] = useState(1);
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('rating')} icon={StarOutlined} color="#FFC107">
                    <Rating value={rating} onChange={(_, v) => setRating(v)} />
                </DemoSection>
                <DemoSection title={t('chips-tags')} icon={LocalOfferOutlined} color="#009688">
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
                <DemoSection title={t('progress')} icon={DonutLargeOutlined} color="#3F51B5">
                    <LinearProgress sx={{ mb: 2 }} />
                    <CircularProgress size={28} />
                </DemoSection>
                <DemoSection title={t('skeleton')} icon={BlurOnOutlined} color="#607D8B">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rectangular" height={80} sx={{ my: 1, borderRadius: 1 }} />
                    <Skeleton variant="circular" width={40} height={40} />
                </DemoSection>
            </Grid>
            <Grid item xs={12}>
                <DemoSection title={t('pagination')} icon={GridViewOutlined} color="#FF9800">
                    <Stack spacing={2}>
                        <Pagination count={10} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                        <Pagination count={10} page={page} onChange={(_, v) => setPage(v)} variant="outlined" shape="rounded" />
                    </Stack>
                </DemoSection>
            </Grid>
        </Grid>
    );
}
