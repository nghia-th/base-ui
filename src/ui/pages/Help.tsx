import React from "react";
import { useTranslation } from "react-i18next";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import DemoSection from "../components/common/DemoSection";

const FAQ_KEYS = ['faq-1', 'faq-2', 'faq-3'];

export default function Help() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('help')} description={t('help-desc') as string}>
            {FAQ_KEYS.map((k) => (
                <Accordion key={k}>
                    <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                        <Typography fontWeight={600}>{t(`${k}-q`)}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography color="text.secondary">{t(`${k}-a`)}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </DemoSection>
    );
}
