import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import DemoSection from "./common/DemoSection";

export default function PanelDemo() {
    const { t } = useTranslation();
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('accordion')}>
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
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{t('card-panel')}</Typography>
                <Card>
                    <CardHeader avatar={<SettingsOutlined color="primary" />} title={t('server-settings')} subheader={t('panel-content-placeholder')} />
                    <CardContent>
                        <Typography variant="body2" color="text.secondary">{t('panel-content-placeholder')}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
