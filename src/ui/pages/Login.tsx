import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { AppContext, reUseBloc } from "../../base/AppContext";
import { BlocLogin } from "../bloc/BlocLogin";
import LocalStorage from "../../base/LocalStorage";
import { BASE_URL } from "../../base/PrefixService";

// Thay cho Login.js (module-ui, PrimeReact) - vẫn theo đúng pattern:
// reUseBloc(appContext, BlocLogin) -> loginBloc.login(onComplete, onError).
export default function Login() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();
    const appContext = useContext(AppContext);
    const loginBloc = reUseBloc(appContext, BlocLogin);
    const locSearch = new URLSearchParams(location.search);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = t('log-in') as string;
    }, [t]);

    const doLogin = () => {
        setSubmitting(true);
        loginBloc.setField('loginInfo', { username, password });
        loginBloc.login((res: any) => {
            setSubmitting(false);
            enqueueSnackbar(t(res.messageKey ?? 'login-success') as string, { variant: 'success' });
            LocalStorage.setItem('fullName', res?.data?.fullName ?? '');
            LocalStorage.setItem('userId', res?.data?.userId ?? '');
            LocalStorage.setItem('i18nextLng', res?.data?.lang ?? 'vi');
            LocalStorage.setItem('avatar', res?.data?.avatar ?? '');
            const url = locSearch.get('url');
            window.location.href = BASE_URL + (url ?? '/');
        }, (error: any) => {
            setSubmitting(false);
            enqueueSnackbar(t(error.messageKey ?? 'error') as string, { variant: 'error' });
        });
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') doLogin();
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default', p: 2
        }}>
            <Paper elevation={3} sx={{ p: 4, width: 380, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
                        <LockOutlined />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>base-ui</Typography>
                    <Typography variant="body2" color="text.secondary">{t('log-in')}</Typography>
                </Box>

                <TextField
                    label={t('username')}
                    fullWidth
                    margin="normal"
                    value={username}
                    autoFocus
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={onKeyDown}
                />
                <TextField
                    label={t('password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onKeyDown}
                />
                <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                    <Link component={RouterLink} to="/forgot-password" variant="body2">
                        {t('forgot-password')}
                    </Link>
                </Box>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mt: 3 }}
                    disabled={submitting}
                    onClick={doLogin}
                >
                    {t('log-in')}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                    {t('demo-login-hint')}
                </Typography>

                <Stack sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        {t('dont-have-account')} <Link component={RouterLink} to="/register">{t('register')}</Link>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}
