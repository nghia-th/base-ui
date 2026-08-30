import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import LocalStorage from "../../base/LocalStorage";

// Trang tài khoản đầy đủ (thay cho việc chỉ có 1 vài mục "chết" trong menu user ở AppTopbar):
// 3 tab - Thông tin cá nhân / Bảo mật (đổi mật khẩu) / Thông báo. Chưa nối API thật (base-ui chưa
// có backend) nên các nút Save chỉ hiện toast xác nhận, giống style demo login/logout hiện có.
export default function Profile() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const [tab, setTab] = useState(0);
    const fullName = LocalStorage.getItem('fullName') || t('demo-role');

    const [form, setForm] = useState({
        fullName: fullName,
        email: 'user@example.com',
        phone: '',
        jobTitle: '',
        bio: ''
    });

    const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

    const [notif, setNotif] = useState({ email: true, push: true, sms: false });

    const saveProfile = () => enqueueSnackbar(t('toast-success-message') as string, { variant: 'success' });
    const savePassword = () => {
        setPwd({ current: '', next: '', confirm: '' });
        enqueueSnackbar(t('toast-success-message') as string, { variant: 'success' });
    };
    const saveNotif = () => enqueueSnackbar(t('toast-success-message') as string, { variant: 'success' });

    return (
        <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                            <Avatar sx={{ width: 88, height: 88, mx: 'auto', fontSize: 32, bgcolor: 'primary.main' }}>
                                {fullName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Button
                                size="small"
                                variant="contained"
                                sx={{ minWidth: 0, width: 32, height: 32, borderRadius: '50%', position: 'absolute', right: -4, bottom: -4, p: 0 }}
                            >
                                <PhotoCameraOutlined fontSize="small" />
                            </Button>
                        </Box>
                        <Typography variant="h6" fontWeight={700}>{fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('demo-role')}</Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={8}>
                <Card>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Tab icon={<PersonOutlined fontSize="small" />} iconPosition="start" label={t('personal-info')} />
                        <Tab icon={<LockOutlined fontSize="small" />} iconPosition="start" label={t('security')} />
                        <Tab icon={<NotificationsActiveOutlined fontSize="small" />} iconPosition="start" label={t('notifications')} />
                    </Tabs>

                    {tab === 0 && (
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label={t('full-name')} value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label={t('email')} value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label={t('phone')} value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label={t('job-title')} value={form.jobTitle}
                                        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline rows={3} label={t('bio')} value={form.bio}
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2.5 }} />
                            <Button variant="contained" onClick={saveProfile}>{t('save-changes')}</Button>
                        </CardContent>
                    )}

                    {tab === 1 && (
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth type="password" label={t('current-password')} value={pwd.current}
                                        onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="password" label={t('new-password')} value={pwd.next}
                                        onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="password" label={t('confirm-password')} value={pwd.confirm}
                                        onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2.5 }} />
                            <Button variant="contained" onClick={savePassword}>{t('save-changes')}</Button>
                        </CardContent>
                    )}

                    {tab === 2 && (
                        <CardContent>
                            <Stack spacing={1}>
                                <FormControlLabel
                                    control={<Switch checked={notif.email} onChange={(e) => setNotif({ ...notif, email: e.target.checked })} />}
                                    label={t('email-notifications')}
                                />
                                <FormControlLabel
                                    control={<Switch checked={notif.push} onChange={(e) => setNotif({ ...notif, push: e.target.checked })} />}
                                    label={t('push-notifications')}
                                />
                                <FormControlLabel
                                    control={<Switch checked={notif.sms} onChange={(e) => setNotif({ ...notif, sms: e.target.checked })} />}
                                    label={t('sms-notifications')}
                                />
                            </Stack>
                            <Divider sx={{ my: 2.5 }} />
                            <Button variant="contained" onClick={saveNotif}>{t('save-changes')}</Button>
                        </CardContent>
                    )}
                </Card>
            </Grid>
        </Grid>
    );
}
