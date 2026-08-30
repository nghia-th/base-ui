import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import PrintOutlined from "@mui/icons-material/PrintOutlined";

const ITEMS = [
    { name: 'Ao thun', qty: 2, price: 150000 },
    { name: 'Quan jean', qty: 1, price: 420000 },
    { name: 'Giay the thao', qty: 1, price: 890000 }
];

export default function Invoice() {
    const { t } = useTranslation();
    const total = ITEMS.reduce((s, i) => s + i.qty * i.price, 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="outlined" startIcon={<PrintOutlined />} onClick={() => window.print()}>{t('print')}</Button>
            </Box>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>base-ui</Typography>
                        <Typography variant="body2" color="text.secondary">123 Nguyen Trai, TP.HCM</Typography>
                    </Box>
                    <Box textAlign="right">
                        <Typography variant="h6">{t('invoice')} #INV-0001</Typography>
                        <Typography variant="body2" color="text.secondary">{new Date().toLocaleDateString()}</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('product-name')}</TableCell>
                            <TableCell align="right">{t('quantity')}</TableCell>
                            <TableCell align="right">{t('price')}</TableCell>
                            <TableCell align="right">{t('total')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ITEMS.map((i) => (
                            <TableRow key={i.name}>
                                <TableCell>{i.name}</TableCell>
                                <TableCell align="right">{i.qty}</TableCell>
                                <TableCell align="right">{i.price.toLocaleString()}</TableCell>
                                <TableCell align="right">{(i.qty * i.price).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} align="right"><strong>{t('total')}</strong></TableCell>
                            <TableCell align="right"><strong>{total.toLocaleString()} đ</strong></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
