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
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import { AppContext, reUseBloc } from "../../base/AppContext";
import { BlocQuizLogin } from "../bloc/BlocQuizLogin";
import { BASE_URL } from "../../base/PrefixService";
import { quizErrorMessage } from "../../quiz-net/quizErrors";
import UIStream from "../components/common/UIStream";

// Đăng ký THẬT cho Hiểu Bài (Phụ huynh - quiz-service KHÔNG có tự đăng ký cho Học sinh, tài khoản
// Học sinh chỉ được Phụ huynh tạo qua "Học sinh" sau khi đăng nhập, xem AuthService.java's
// Javadoc). AuthApi.java's registerParent tự đăng nhập luôn (trả token) nên đăng ký xong vào
// thẳng /app/parent, không cần quay lại /login - dùng chung BlocQuizLogin (login/register cùng
// lưu token như nhau, xem BlocQuizLogin.ts's handleAuthSuccess).
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") - y hệt lý
// do đổi ở Login.tsx: 5 ô input đều KHÔNG controlled, chỉ đẩy giá trị vào bloc qua objectKey 'req'
// lúc onChange; "agree" (Checkbox) và "submitting" (nút) mỗi cái 1 stream riêng, bọc hẹp đúng chỗ
// cần phản ứng lại. Validate (thiếu field/mật khẩu không khớp/chưa đồng ý điều khoản) dời hẳn vào
// BlocQuizLogin#register - component chỉ còn gọi bloc.register() và hiển thị lỗi trả về.
export default function Register() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBloc(appContext, BlocQuizLogin);

    useEffect(() => {
        document.title = t('register') as string;
    }, [t]);

    // messageKey validate cục bộ dùng lại đúng variant cũ (warning cho "thiếu field"/"chưa đồng ý
    // điều khoản", error cho các trường hợp còn lại) - BlocQuizLogin#register gắn kèm `variant`
    // vào error object khi tự validate, để không làm loãng đi UX cũ (đã có sẵn trước khi dời logic
    // vào bloc).
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const submit = () => {
        bloc.register(() => {
            enqueueSnackbar(t('register-success') as string, { variant: 'success' });
            window.location.href = BASE_URL + '/app/parent';
        }, showError);
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
                    autoFocus
                    onChange={(e) => bloc.setStream('fullName', e.target.value, 'req')}
                />
                <TextField
                    label={t('email')}
                    fullWidth
                    margin="normal"
                    onChange={(e) => bloc.setStream('email', e.target.value, 'req')}
                />
                <TextField
                    label={t('phone')}
                    fullWidth
                    margin="normal"
                    onChange={(e) => bloc.setStream('phone', e.target.value, 'req')}
                />
                <TextField
                    label={t('quiz-username-optional')}
                    fullWidth
                    margin="normal"
                    onChange={(e) => bloc.setStream('username', e.target.value, 'req')}
                />
                <TextField
                    label={t('password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    onChange={(e) => bloc.setStream('password', e.target.value, 'req')}
                />
                <TextField
                    label={t('confirm-password')}
                    type="password"
                    fullWidth
                    margin="normal"
                    onChange={(e) => bloc.setStream('confirm', e.target.value, 'req')}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <UIStream
                    initialData={false}
                    stream={bloc.getStream('agree')}
                    builder={(agreeSnap) => (
                        <FormControlLabel
                            sx={{ mt: 0.5 }}
                            control={<Checkbox checked={agreeSnap.data === true} onChange={(e) => bloc.setStream('agree', e.target.checked)} />}
                            label={t('agree-terms')}
                        />
                    )}
                />

                <UIStream
                    initialData={false}
                    stream={bloc.getStream('submitting')}
                    builder={(submittingSnap) => (
                        <Button fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={submittingSnap.data === true} onClick={submit}>
                            {t('create-account')}
                        </Button>
                    )}
                />

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
                    {t('already-have-account')} <Link component={RouterLink} to="/login">{t('log-in')}</Link>
                </Typography>
            </Paper>
        </Box>
    );
}
