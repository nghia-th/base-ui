import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import DemoSection from "./common/DemoSection";

const SEVERITIES = ['success', 'info', 'warning', 'error'] as const;

export default function MessagesDemo() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const [shown, setShown] = useState<typeof SEVERITIES[number][]>([...SEVERITIES]);

    return (
        <>
            <DemoSection title={t('inline-messages')}>
                <Stack spacing={1.5}>
                    {SEVERITIES.filter((s) => shown.includes(s)).map((s) => (
                        <Alert key={s} severity={s} onClose={() => setShown((arr) => arr.filter((x) => x !== s))}>
                            <AlertTitle>{t(s)}</AlertTitle>
                            {t('panel-content-placeholder')}
                        </Alert>
                    ))}
                </Stack>
            </DemoSection>
            <DemoSection title={t('toast-messages')}>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    {SEVERITIES.map((s) => (
                        <Button key={s} variant="outlined" onClick={() => enqueueSnackbar(t(`toast-${s}-message`) as string, { variant: s })}>
                            {t(s)}
                        </Button>
                    ))}
                </Stack>
            </DemoSection>
        </>
    );
}
