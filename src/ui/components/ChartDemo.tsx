import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import DemoSection from "./common/DemoSection";

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

export default function ChartDemo() {
    const { t } = useTranslation();
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('bar-chart')}>
                    <BarChart
                        height={280}
                        xAxis={[{ scaleType: 'band', data: MONTHS }]}
                        series={[
                            { data: [12, 19, 8, 15, 22, 17], label: t('product-a') as string },
                            { data: [8, 11, 14, 9, 12, 20], label: t('product-b') as string }
                        ]}
                    />
                </DemoSection>
            </Grid>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('line-chart')}>
                    <LineChart
                        height={280}
                        xAxis={[{ scaleType: 'point', data: MONTHS }]}
                        series={[{ data: [30, 45, 28, 52, 40, 60], label: t('revenue') as string }]}
                    />
                </DemoSection>
            </Grid>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('pie-chart')}>
                    <PieChart
                        height={280}
                        series={[{
                            data: [
                                { id: 0, value: 40, label: t('desktop') as string },
                                { id: 1, value: 35, label: t('mobile') as string },
                                { id: 2, value: 25, label: t('tablet') as string }
                            ]
                        }]}
                    />
                </DemoSection>
            </Grid>
        </Grid>
    );
}
