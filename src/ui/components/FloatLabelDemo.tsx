import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import LabelOutlined from "@mui/icons-material/LabelOutlined";
import DemoSection from "./common/DemoSection";

// MUI TextField mặc định đã có "floating label" (label thu nhỏ lên trên khi field có giá trị/focus)
// - đây là hành vi built-in tương đương FloatLabelDemo bên PrimeReact.
export default function FloatLabelDemo() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('float-label')} description={t('float-label-desc') as string} icon={LabelOutlined} color="#FF9800">
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}><TextField label={t('username')} fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label={t('username')} fullWidth defaultValue="admin" /></Grid>
                <Grid item xs={12} sm={4}><TextField label={t('username')} fullWidth variant="filled" defaultValue="admin" /></Grid>
            </Grid>
        </DemoSection>
    );
}
