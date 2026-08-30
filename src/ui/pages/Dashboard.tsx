import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItemMui from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import ShoppingCartOutlined from "@mui/icons-material/ShoppingCartOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { AppContext, reUseBlocContent } from "../../base/AppContext";
import { BlocDashboard } from "../bloc/BlocDashboard";
import UIStream from "../components/common/UIStream";
import StatCard from "../components/common/StatCard";

const STAT_CARDS = [
    { key: 'orders', label: 'orders', icon: ShoppingCartOutlined, color: '#2196F3', trend: 14, badge: 'monthly', highlighted: true },
    { key: 'revenue', label: 'revenue', icon: PaidOutlined, color: '#4CAF50', trend: -12 },
    { key: 'customers', label: 'customers', icon: PeopleOutlined, color: '#FF9800', trend: 8, badge: 'new' },
    { key: 'comments', label: 'comments', icon: ChatBubbleOutlineOutlined, color: '#9C27B0', trend: -5 }
];

const GOAL_TARGET = 35000;

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
    completed: 'success',
    pending: 'warning',
    cancelled: 'error'
};

// Trang Dashboard mẫu - minh hoạ trọn vẹn pattern: reUseBlocContent(BlocDashboard) -> initData()
// gọi apiRequest -> setStream('stats', ...) -> UIStream subscribe để render lại.
export default function Dashboard() {
    const { t } = useTranslation();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocDashboard);
    const [week, setWeek] = useState<'this' | 'last'>('this');

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('stats')}
            builder={(snapshot) => {
                const data = snapshot.data;
                const recentRows = data ? (week === 'this' ? data.recent : data.recentLastWeek) : [];
                const goalPct = data ? Math.min(100, Math.round((data.revenue / GOAL_TARGET) * 100)) : 0;
                return (
                    <Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            {STAT_CARDS.map((c) => (
                                <Grid item xs={12} sm={6} md={3} key={c.key}>
                                    <StatCard
                                        icon={c.icon}
                                        color={c.color}
                                        value={data ? data[c.key] : '—'}
                                        label={t(c.label)}
                                        trend={c.trend}
                                        trendLabel={t('since-last-week') as string}
                                        badge={c.badge ? (t(c.badge) as string) : undefined}
                                        highlighted={c.highlighted}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={7}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                            {t('weekly-overview')}
                                        </Typography>
                                        {data ? (
                                            <LineChart
                                                height={280}
                                                series={[{ data: data.series.values, label: t('orders') as string, color: '#2196F3' }]}
                                                xAxis={[{ scaleType: 'point', data: data.series.labels }]}
                                            />
                                        ) : <Box sx={{ height: 280 }} />}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                            {t('revenue-by-channel')}
                                        </Typography>
                                        {data ? (
                                            <PieChart
                                                height={280}
                                                series={[{
                                                    innerRadius: 50,
                                                    outerRadius: 100,
                                                    paddingAngle: 2,
                                                    cornerRadius: 3,
                                                    data: data.channels.map((c: any) => ({
                                                        id: c.id, value: c.value, label: t(c.labelKey) as string, color: c.color
                                                    }))
                                                }]}
                                            />
                                        ) : <Box sx={{ height: 280 }} />}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                                            {t('monthly-goal')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {t('monthly-goal-desc')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                                <CircularProgress variant="determinate" value={goalPct} size={120} thickness={5} />
                                                <Box sx={{
                                                    position: 'absolute', inset: 0, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Typography variant="h5" fontWeight={700}>{goalPct}%</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" align="center" color="text.secondary">
                                            {data ? `$${Number(data.revenue).toLocaleString()} / $${GOAL_TARGET.toLocaleString()}` : '—'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                {t('recent-orders')}
                                            </Typography>
                                            <Select
                                                size="small"
                                                value={week}
                                                onChange={(e) => setWeek(e.target.value as 'this' | 'last')}
                                            >
                                                <MenuItemMui value="this">{t('this-week')}</MenuItemMui>
                                                <MenuItemMui value="last">{t('last-week')}</MenuItemMui>
                                            </Select>
                                        </Box>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>{t('id')}</TableCell>
                                                    <TableCell>{t('customer')}</TableCell>
                                                    <TableCell>{t('status')}</TableCell>
                                                    <TableCell align="right">{t('amount')}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentRows.map((row: any) => (
                                                    <TableRow key={row.id} hover>
                                                        <TableCell>{row.id}</TableCell>
                                                        <TableCell>{row.customer}</TableCell>
                                                        <TableCell>
                                                            <Chip size="small" label={t(row.status)} color={STATUS_COLOR[row.status]} />
                                                        </TableCell>
                                                        <TableCell align="right">${row.amount}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                );
            }}
        />
    );
}
