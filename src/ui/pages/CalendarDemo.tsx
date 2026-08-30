import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import Stack from "@mui/material/Stack";
import DemoSection from "../components/common/DemoSection";

export default function CalendarDemo() {
    const { t } = useTranslation();
    const [date, setDate] = useState<Date | null>(new Date());

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <DemoSection title={t('calendar')}>
                        <DateCalendar value={date} onChange={(v) => setDate(v)} />
                    </DemoSection>
                </Grid>
                <Grid item xs={12} md={6}>
                    <DemoSection title={t('date-time-pickers')}>
                        <Stack spacing={2}>
                            <DatePicker label={t('date')} value={date} onChange={(v) => setDate(v)} slotProps={{ textField: { fullWidth: true } }} />
                            <TimePicker label={t('time')} value={date} onChange={(v) => setDate(v)} slotProps={{ textField: { fullWidth: true } }} />
                        </Stack>
                    </DemoSection>
                </Grid>
            </Grid>
        </LocalizationProvider>
    );
}
