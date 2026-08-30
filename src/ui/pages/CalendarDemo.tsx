import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import Stack from "@mui/material/Stack";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import DemoSection from "../components/common/DemoSection";

export default function CalendarDemo() {
    const { t } = useTranslation();
    const [date, setDate] = useState<Date | null>(new Date());

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <DemoSection title={t('calendar')} icon={CalendarMonthOutlined} color="#2196F3">
                        <DateCalendar value={date} onChange={(v) => setDate(v)} />
                    </DemoSection>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <DemoSection title={t('date-time-pickers')} icon={AccessTimeOutlined} color="#FF9800">
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
