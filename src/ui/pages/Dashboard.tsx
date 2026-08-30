import React, { useContext, useEffect } from "react";
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
import ShoppingCartOutlined from "@mui/icons-material/ShoppingCartOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { LineChart } from "@mui/x-charts/LineChart";
import { AppContext, reUseBlocContent } from "../../base/AppContext";
import { BlocDashboard } from "../bloc/BlocDashboard";
import UIStream from "../components/common/UIStream";

const STAT_CARDS = [
    { key: 'orders', label: 'orders', icon: ShoppingCartOutlined, color: '#2196F3' },
    { key: 'revenue', label: 'revenue', icon: PaidOutlined, color: '#4CAF50' },
    { key: 'customers', label: 'customers', icon: PeopleOutlined, color: '#FF9800' },
    { key: 'comments', label: 'comments', icon: ChatBubbleOutlineOutlined, color: '#9C27B0' }
];

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
                return (
                    <Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            {STAT_CARDS.map((c) => (
                                <Grid item xs={12} sm={6} md={3} key={c.key}>
                                    <Card>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{
                                                width: 48, height: 48, borderRadius: 2, bgcolor: `${c.color}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <c.icon sx={{ color: c.color }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h5" fontWeight={700}>
                                                    {data ? data[c.key] : '—'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">{t(c.label)}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Grid container spacing={2}>
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
                                            {t('recent-orders')}
                                        </Typography>
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
                                                {(data?.recent ?? []).map((row: any) => (
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
