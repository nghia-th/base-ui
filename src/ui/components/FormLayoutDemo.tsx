import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import ViewAgendaOutlined from "@mui/icons-material/ViewAgendaOutlined";
import DemoSection from "./common/DemoSection";

const COUNTRIES = ['vietnam', 'usa', 'japan', 'korea'];

export default function FormLayoutDemo() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('form-layout')} description={t('form-layout-desc') as string} icon={ViewAgendaOutlined} color="#2196F3">
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label={t('full-name')} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label={t('email')} type="email" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select label={t('country')} fullWidth defaultValue="vietnam">
                        {COUNTRIES.map((c) => <MenuItem key={c} value={c}>{t(c)}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label={t('phone')} fullWidth />
                </Grid>
                <Grid size={12}>
                    <TextField label={t('address')} fullWidth multiline rows={3} />
                </Grid>
                <Grid size={12}>
                    <FormControlLabel control={<Checkbox defaultChecked />} label={t('agree-terms') as string} />
                </Grid>
                <Grid size={12}>
                    <Button variant="contained">{t('save')}</Button>
                </Grid>
            </Grid>
        </DemoSection>
    );
}
