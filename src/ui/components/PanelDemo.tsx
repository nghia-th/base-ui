import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import ViewCompactOutlined from "@mui/icons-material/ViewCompactOutlined";
import Box from "@mui/material/Box";
import DemoSection from "./common/DemoSection";

export default function PanelDemo() {
    const { t } = useTranslation();
    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
                <DemoSection title={t('accordion')} icon={ViewCompactOutlined} color="#3F51B5">
                    {[1, 2, 3].map((i) => (
                        <Accordion key={i}>
                            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                                <Typography>{t('panel')} {i}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">{t('panel-content-placeholder')}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </DemoSection>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: 2, bgcolor: "#9C27B01f",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <SettingsOutlined sx={{ color: "#9C27B0", fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t('card-panel')}</Typography>
                </Box>
                <Card sx={{ mb: 2 }}>
                    <CardHeader avatar={<SettingsOutlined color="primary" />} title={t('server-settings')} subheader={t('panel-content-placeholder')} />
                    <CardContent>
                        <Typography variant="body2" color="text.secondary">{t('panel-content-placeholder')}</Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{t('outlined')}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('panel-content-placeholder')}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
