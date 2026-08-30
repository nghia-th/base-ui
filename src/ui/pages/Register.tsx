import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";

// Trang "Đăng ký" - chỉ demo UI (base-ui chưa nối backend thật, giống Login.tsx/BlocLogin.ts):
// validate tối thiểu ở client rồi giả lập tạo tài khoản thành công, quay lại /login.
export default function Register() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = t('register') as string;
    }, [t]);

    const submit = () => {
        if (!form.fullName || !form.email || !form.password) {
            enqueueSnackbar(t('required-field') as string, { variant: 'warning' });
            return;
        }
        if (form.password !== form.confirm) {
            enqueueSnackbar(t('passwords-not-match') as string, { variant: 'error' });
            return;
        }
        if (!agree) {
            enqueueSnackbar(t('agree-terms') as string, { variant: 'warning' });
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            enqueueSnackbar(t('register-success') as string, { variant: 'success' });
            navigate('/login');
        }, 400);
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default', p: 2
        }}>
            <Paper elevation={3} sx={{ p: 4, width: 400, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
                        <PersonAddOutlined />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>base-ui</Typography>
                    <Typography variant="body2" color="text.secondary">{t('register')}</Typography>
                </Box>

                <TextField
                    label={t('full-name')}
                    fullWidth
                    margin="normal"
                    value={form.fullName}
                    autoFocus
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
                <TextField
                    label={t('email')}
                    fullWidth
                    margin="normal"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <TextField
                    label={t('password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <TextField
                    label={t('confirm-password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <FormControlLabel
                    sx={{ mt: 0.5 }}
                    control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
                    label={t('agree-terms')}
                />

                <Button fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submitting} onClick={submit}>
                    {t('create-account')}
                </Button>

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
                    {t('already-have-account')} <Link component={RouterLink} to="/login">{t('log-in')}</Link>
                </Typography>
            </Paper>
        </Box>
    );
}
