import React, { useEffect, useState } from "react";
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
import MarkEmailReadOutlined from "@mui/icons-material/MarkEmailReadOutlined";

// Trang "Quên mật khẩu" - chỉ demo UI (base-ui chưa nối backend thật, giống Login.tsx): nhập
// email -> giả lập gửi link đặt lại mật khẩu -> hiện màn hình xác nhận đã gửi.
export default function ForgotPassword() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        document.title = t('forgot-password') as string;
    }, [t]);

    const submit = () => {
        if (!email) {
            enqueueSnackbar(t('required-field') as string, { variant: 'warning' });
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSent(true);
        }, 400);
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default', p: 2
        }}>
            <Paper elevation={3} sx={{ p: 4, width: 380, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
                        <MarkEmailReadOutlined />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>{t('forgot-password')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                        {sent ? t('reset-link-sent-desc') : t('forgot-password-desc')}
                    </Typography>
                </Box>

                {!sent ? (
                    <>
                        <TextField
                            label={t('email')}
                            fullWidth
                            margin="normal"
                            value={email}
                            autoFocus
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                        />
                        <Button fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={submitting} onClick={submit}>
                            {t('send-reset-link')}
                        </Button>
                    </>
                ) : (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 1 }}>
                        <strong>{email}</strong>
                    </Typography>
                )}

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
                    <Link component={RouterLink} to="/login">{t('back-to-login')}</Link>
                </Typography>
            </Paper>
        </Box>
    );
}
