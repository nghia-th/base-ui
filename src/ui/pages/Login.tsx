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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { AppContext, reUseBloc } from "../../base/AppContext";
import { BlocQuizLogin, QuizLoginRole } from "../bloc/BlocQuizLogin";
import { BASE_URL } from "../../base/PrefixService";

// Đăng nhập THẬT cho Hiểu Bài (quiz-service), thay cho pattern demo (BlocLogin.ts, login giả bằng
// setTimeout, giữ nguyên không xoá để tham khảo pattern cũ). Chỉ 1 route /login dùng chung cho cả
// "/" (Hiểu Bài thật) và "/demo" (trang tham khảo UI-kit) - xem AppWrapper.tsx - nên trang này giờ
// là cổng vào duy nhất, cần chọn Phụ huynh/Học sinh vì quiz-service có 2 endpoint login riêng biệt
// theo role (AuthApi.java: /api/auth/parent/login và /api/auth/student/login).
export default function Login() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();
    const appContext = useContext(AppContext);
    const loginBloc = reUseBloc(appContext, BlocQuizLogin);
    const locSearch = new URLSearchParams(location.search);

    const [role, setRole] = useState<QuizLoginRole>('parent');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = t('log-in') as string;
    }, [t]);

    const onRoleChange = (_e: React.MouseEvent<HTMLElement>, value: QuizLoginRole | null) => {
        if (value) {
            setRole(value);
        }
    };

    const doLogin = () => {
        if (!identifier || !password) {
            enqueueSnackbar(t('please-enter-login-info') as string, { variant: 'error' });
            return;
        }
        setSubmitting(true);
        loginBloc.setField('loginInfo', { identifier, password });
        loginBloc.login(role, (res: any) => {
            setSubmitting(false);
            enqueueSnackbar(t(res.messageKey ?? 'login-success') as string, { variant: 'success' });
            const url = locSearch.get('url');
            // Vào thẳng khu vực đúng role vừa đăng nhập (/app/parent hoặc /app/student/tests - xem
            // AppShell.tsx/RequireQuizRole; học sinh không có trang tổng quan riêng, /app/student/tests
            // LÀ trang chủ - xem AppMenuData.ts) trừ khi có "url" chỉ định cụ thể (vd bị AppWrapper.tsx
            // redirect về /login?url=... vì hết hạn đăng nhập ở 1 trang cụ thể nào đó).
            window.location.href = BASE_URL + (url ?? (role === 'student' ? '/app/student/tests' : '/app/parent'));
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
                    <Typography variant="h6" fontWeight={700}>{t('app-name')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('log-in')}</Typography>
                </Box>

                <ToggleButtonGroup
                    value={role}
                    exclusive
                    fullWidth
                    onChange={onRoleChange}
                    sx={{ mt: 1, mb: 1 }}
                >
                    <ToggleButton value="parent">{t('quiz-role-parent')}</ToggleButton>
                    <ToggleButton value="student">{t('quiz-role-student')}</ToggleButton>
                </ToggleButtonGroup>

                <TextField
                    label={role === 'parent' ? t('email') : t('username')}
                    fullWidth
                    margin="normal"
                    value={identifier}
                    autoFocus
                    onChange={(e) => setIdentifier(e.target.value)}
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
                {role === 'parent' && (
                    <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                        <Link component={RouterLink} to="/forgot-password" variant="body2">
                            {t('forgot-password')}
                        </Link>
                    </Box>
                )}

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

                {role === 'parent' && (
                    <Stack sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            {t('dont-have-account')} <Link component={RouterLink} to="/register">{t('register')}</Link>
                        </Typography>
                    </Stack>
                )}
            </Paper>
        </Box>
    );
}
