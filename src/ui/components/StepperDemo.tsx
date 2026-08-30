import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepButton from "@mui/material/StepButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LinearScaleOutlined from "@mui/icons-material/LinearScaleOutlined";
import AltRouteOutlined from "@mui/icons-material/AltRouteOutlined";
import DemoSection from "./common/DemoSection";

const STEP_KEYS = ['step-account', 'step-shipping', 'step-review'];

// Stepper (wizard nhiều bước): 1 bản "linear" - phải Next tuần tự, không nhảy cóc được, có nút
// Back/Next/Reset và màn hình hoàn tất; 1 bản "non-linear" (StepButton) - click thẳng vào label
// để nhảy tới bước bất kỳ, không bắt buộc theo thứ tự. Cả 2 kiểu đều hay gặp trong wizard/form
// nhiều bước (đăng ký, checkout, thiết lập tài khoản...).
export default function StepperDemo() {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(0);
    const [nonLinearStep, setNonLinearStep] = useState(0);
    const [nonLinearCompleted, setNonLinearCompleted] = useState<Record<number, boolean>>({});

    const isLastStep = activeStep === STEP_KEYS.length - 1;
    const allDone = activeStep === STEP_KEYS.length;

    const handleNext = () => setActiveStep((s) => s + 1);
    const handleBack = () => setActiveStep((s) => s - 1);
    const handleReset = () => setActiveStep(0);

    const handleNonLinearComplete = () => {
        setNonLinearCompleted((c) => ({ ...c, [nonLinearStep]: true }));
        const next = STEP_KEYS.findIndex((_, i) => !nonLinearCompleted[i] && i !== nonLinearStep);
        setNonLinearStep(next === -1 ? nonLinearStep : next);
    };

    return (
        <Grid container spacing={2}>
            <Grid size={12}>
                <DemoSection title={t('stepper-linear')} description={t('stepper-linear-desc')} icon={LinearScaleOutlined} color="#2196F3">
                    <Stepper activeStep={activeStep}>
                        {STEP_KEYS.map((key) => (
                            <Step key={key}>
                                <StepLabel>{t(key)}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    {allDone ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ mb: 2 }}>{t('stepper-all-done')}</Typography>
                            <Button onClick={handleReset}>{t('reset')}</Button>
                        </Box>
                    ) : (
                        <Box sx={{ py: 3 }}>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                {t(`${STEP_KEYS[activeStep]}-desc`)}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 1 }}>
                                <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
                                    {t('back')}
                                </Button>
                                <Box sx={{ flex: '1 1 auto' }} />
                                <Button onClick={handleNext} variant="contained">
                                    {isLastStep ? t('finish') : t('next')}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DemoSection>
            </Grid>
            <Grid size={12}>
                <DemoSection title={t('stepper-non-linear')} description={t('stepper-non-linear-desc')} icon={AltRouteOutlined} color="#9C27B0">
                    <Stepper nonLinear activeStep={nonLinearStep}>
                        {STEP_KEYS.map((key, index) => (
                            <Step key={key} completed={!!nonLinearCompleted[index]}>
                                <StepButton onClick={() => setNonLinearStep(index)}>{t(key)}</StepButton>
                            </Step>
                        ))}
                    </Stepper>
                    <Box sx={{ py: 3 }}>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            {t(`${STEP_KEYS[nonLinearStep]}-desc`)}
                        </Typography>
                        <Button variant="outlined" onClick={handleNonLinearComplete}>
                            {t('mark-step-complete')}
                        </Button>
                    </Box>
                </DemoSection>
            </Grid>
        </Grid>
    );
}
