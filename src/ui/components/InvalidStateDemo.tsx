import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import DemoSection from "./common/DemoSection";

export default function InvalidStateDemo() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState(false);
    const isValid = /.+@.+\..+/.test(email);

    return (
        <DemoSection title={t('invalid-state')} description={t('invalid-state-desc') as string} icon={ErrorOutlineOutlined} color="#F44336">
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label={t('email')}
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched(true)}
                        error={touched && !isValid}
                        helperText={touched && !isValid ? t('invalid-email') : ' '}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label={t('required-field')} required fullWidth error helperText={t('field-required')} />
                </Grid>
                <Grid size={12}>
                    <Button variant="contained" disabled={!isValid} onClick={() => setTouched(true)}>{t('submit')}</Button>
                </Grid>
            </Grid>
        </DemoSection>
    );
}
