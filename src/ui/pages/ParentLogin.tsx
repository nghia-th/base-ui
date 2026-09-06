import React, { useContext, useEffect } from "react";
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
import { BlocQuizLogin } from "../bloc/BlocQuizLogin";
import { BASE_URL } from "../../base/PrefixService";
import UIStream from "../components/common/UIStream";
import { quizErrorMessage } from "../../quiz-net/quizErrors";

// Form dang nhap THAT cho Phu huynh (quiz-service) - route /parent-login (2026-09-06, ban sua 2
// cua thiet ke lai dang nhap - xem Login.tsx's comment dau file de biet toan bo boi canh). Truoc
// day noi dung file nay chinh la Login.tsx (route /login) khi /login con la form Phu huynh truc
// tiep; GIO /login da thanh 1 trang CHON VAI TRO (3 o Quan tri vien/Phu huynh/Hoc sinh - xem
// Login.tsx), form that su nam o day.
//
// role KHONG can set thu cong o day - BlocQuizLogin's doLogin() tu mac dinh 'parent' khi khong co
// stream 'role' nao khac duoc set (xem do) - dung y het truoc day.
export default function ParentLogin() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();
    const appContext = useContext(AppContext);
    const loginBloc = reUseBloc(appContext, BlocQuizLogin);
    const locSearch = new URLSearchParams(location.search);

    useEffect(() => {
        document.title = t('log-in') as string;
    }, [t]);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const doLogin = () => {
        loginBloc.doLogin((res: any) => {
            enqueueSnackbar(t(res.messageKey ?? 'login-success') as string, { variant: 'success' });
            const url = locSearch.get('url');
            window.location.href = BASE_URL + (url ?? '/app/parent');
        }, showError);
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
                    <Typography variant="h6" fontWeight={700}>{t('app-name')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('log-in')}</Typography>
                </Box>

                <TextField
                    label={t('quiz-login-identifier')}
                    fullWidth
                    margin="normal"
                    autoFocus
                    // 2026-09-06 - xem Login.tsx's comment "TAT GOI Y TRINH DUYET".
                    autoComplete="off"
                    onChange={(e) => loginBloc.setStream('identifier', e.target.value, 'req')}
                    onKeyDown={onKeyDown}
                />
                <TextField
                    label={t('password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    autoComplete="current-password"
                    onChange={(e) => loginBloc.setStream('password', e.target.value, 'req')}
                    onKeyDown={onKeyDown}
                />
                <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                    <Link component={RouterLink} to="/forgot-password" variant="body2">
                        {t('forgot-password')}
                    </Link>
                </Box>

                <UIStream
                    initialData={false}
                    stream={loginBloc.getStream('submitting')}
                    builder={(submittingSnap) => (
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3 }}
                            disabled={submittingSnap.data === true}
                            onClick={doLogin}
                        >
                            {t('log-in')}
                        </Button>
                    )}
                />

                <Stack sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        {t('dont-have-account')} <Link component={RouterLink} to="/register">{t('register')}</Link>
                    </Typography>
                </Stack>

                <Stack sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login">{t('quiz-back-to-user-login')}</Link>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}
