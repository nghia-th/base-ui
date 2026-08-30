import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import DemoSection from "./common/DemoSection";

const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#009688'];

export default function MediaDemo() {
    const { t } = useTranslation();
    return (
        <>
            <DemoSection title={t('media')}>
                <Grid container spacing={2}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Card>
                                <CardMedia sx={{ height: 140, bgcolor: COLORS[i % COLORS.length] }} />
                                <CardContent>
                                    <Typography variant="subtitle2" fontWeight={700}>{t('media-item')} {i}</Typography>
                                    <Typography variant="body2" color="text.secondary">{t('panel-content-placeholder')}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DemoSection>
            <DemoSection title={t('avatars')}>
                <AvatarGroup max={4}>
                    {COLORS.map((c) => <Avatar key={c} sx={{ bgcolor: c }}>A</Avatar>)}
                </AvatarGroup>
            </DemoSection>
        </>
    );
}
