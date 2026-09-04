import React, { useContext, useEffect } from "react";
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
import Stack from "@mui/material/Stack";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import { AppContext, reUseBloc } from "../../../base/AppContext";
import { BlocQuizLogin } from "../../bloc/BlocQuizLogin";
import { BASE_URL } from "../../../base/PrefixService";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang đăng nhập RIÊNG cho tài khoản quản trị viên (Admin, 2026-09-04) - route /admin/login
// (AppWrapper.tsx), tách khỏi Login.tsx's ToggleButtonGroup Phụ huynh/Học sinh có chủ đích: Admin
// không có đăng ký, không hiện công khai lẫn với 2 role kia (chỉ tới được đây qua link nhỏ ở cuối
// Login.tsx - "thêm link đăng nhập cho tài khoản quản trị", xem Login.tsx's comment) - cùng
// BlocQuizLogin với Login.tsx (reUseBloc(appContext, BlocQuizLogin) trả về CÙNG 1 instance, xem
// AppContext.ts), chỉ khác: tự setStream('role','admin') 1 lần lúc mount thay vì có
// ToggleButtonGroup cho người dùng chọn, và không có nút "Đăng ký"/"Quên mật khẩu" (không áp dụng
// cho Admin trong v1).
export default function AdminLogin() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const loginBloc = reUseBloc(appContext, BlocQuizLogin);

    useEffect(() => {
        document.title = t('quiz-admin-login-title') as string;
        loginBloc.setStream('role', 'admin');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const doLogin = () => {
        loginBloc.doLogin((res: any) => {
            enqueueSnackbar(t(res.messageKey ?? 'login-success') as string, { variant: 'success' });
            window.location.href = BASE_URL + '/app/admin/parents';
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
                        <AdminPanelSettingsOutlined />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>{t('app-name')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('quiz-admin-login-title')}</Typography>
                </Box>

                <TextField
                    label={t('email')}
                    fullWidth
                    margin="normal"
                    autoFocus
                    onChange={(e) => loginBloc.setStream('identifier', e.target.value, 'req')}
                    onKeyDown={onKeyDown}
                />
                <TextField
                    label={t('password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    onChange={(e) => loginBloc.setStream('password', e.target.value, 'req')}
                    onKeyDown={onKeyDown}
                />

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
                        <Link component={RouterLink} to="/login">{t('quiz-back-to-user-login')}</Link>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}
