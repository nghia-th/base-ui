import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
import { AppContext, reUseBloc } from "../../base/AppContext";
import { BlocQuizLogin } from "../bloc/BlocQuizLogin";
import { BASE_URL } from "../../base/PrefixService";
import { quizErrorMessage } from "../../quiz-net/quizErrors";

// Đăng ký THẬT cho Hiểu Bài (Phụ huynh - quiz-service KHÔNG có tự đăng ký cho Học sinh, tài khoản
// Học sinh chỉ được Phụ huynh tạo qua "Học sinh" sau khi đăng nhập, xem AuthService.java's
// Javadoc). AuthApi.java's registerParent tự đăng nhập luôn (trả token) nên đăng ký xong vào
// thẳng /app/parent, không cần quay lại /login - dùng chung BlocQuizLogin (login/register cùng
// lưu token như nhau, xem BlocQuizLogin.ts's handleAuthSuccess).
export default function Register() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBloc(appContext, BlocQuizLogin);
    const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
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
        bloc.register(form.fullName, form.email, form.password, form.phone || undefined, () => {
            enqueueSnackbar(t('register-success') as string, { variant: 'success' });
            window.location.href = BASE_URL + '/app/parent';
        }, (error) => {
            setSubmitting(false);
            enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });
        });
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
                    <Typography variant="h6" fontWeight={700}>{t('app-name')}</Typography>
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
                    label={t('phone')}
                    fullWidth
                    margin="normal"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
