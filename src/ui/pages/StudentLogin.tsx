import React, { useContext, useEffect } from "react";
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
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { AppContext, reUseBloc } from "../../base/AppContext";
import { BlocStudentLogin, QuizFamilyMember, STUDENT_LOGIN_PARENT_KEY } from "../bloc/BlocStudentLogin";
import LocalStorage from "../../base/LocalStorage";
import { BASE_URL } from "../../base/PrefixService";
import UIStream from "../components/common/UIStream";
import { quizErrorMessage } from "../../quiz-net/quizErrors";

// Trang dang nhap danh rieng cho Hoc sinh (2026-09-06, thiet ke lai dang nhap - xem Login.tsx's
// comment dau file de biet toan bo ly do/thiet ke).
//
// BAN SUA 2 (2026-09-06, theo de xuat moi cua anh): buoc "chon Phu huynh" da chuyen thanh 1 POPUP
// tren trang /login (LoginChooser, xem Login.tsx) - trang nay KHONG con buoc 'identifier' nua,
// chi con dung khi DA CO parentIdentifier luu san trong localStorage (popup ben /login ghi vao
// truoc khi dieu huong toi day). Neu mo thang /student-login ma chua co gi luu (vd go thang URL,
// hoac vua bam "Khong phai gia dinh nay?") - TU DONG dieu huong nguoc ve /login de chon lai, khong
// hien UI nhap lieu nao o day ca.
export default function StudentLogin() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const loginBloc = reUseBloc(appContext, BlocStudentLogin);

    useEffect(() => {
        document.title = t('quiz-student-login-title') as string;
        // Chua chon Phu huynh o dau ca -> khong co gi de tra cuu o day, dieu huong nguoc ve /login
        // (chooser) de bam lai o "Hoc sinh" (se hien popup chon Phu huynh) - xem comment dau file.
        if (!LocalStorage.getItem(STUDENT_LOGIN_PARENT_KEY)) {
            navigate('/login', { replace: true });
            return;
        }
        loginBloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const doLoginSelected = () => {
        loginBloc.loginSelected((res: any) => {
            enqueueSnackbar(t(res.messageKey ?? 'login-success') as string, { variant: 'success' });
            window.location.href = BASE_URL + '/app/student/tests';
        }, showError);
    };

    const doManualLogin = () => {
        loginBloc.doLogin((res: any) => {
            enqueueSnackbar(t(res.messageKey ?? 'login-success') as string, { variant: 'success' });
            window.location.href = BASE_URL + '/app/student/tests';
        }, showError);
    };

    const doChangeFamily = () => {
        loginBloc.changeFamily();
        navigate('/login', { replace: true });
    };

    const onKeyDownPassword = (e: React.KeyboardEvent) => { if (e.key === 'Enter') doLoginSelected(); };
    const onKeyDownManual = (e: React.KeyboardEvent) => { if (e.key === 'Enter') doManualLogin(); };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default', p: 2
        }}>
            <Paper elevation={3} sx={{ p: 4, width: 380, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
                        <SchoolOutlined />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>{t('app-name')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('quiz-student-login-title')}</Typography>
                </Box>

                <UIStream
                    initialData="picker"
                    stream={loginBloc.getStream('step')}
                    builder={(stepSnap) => {
                        const step = stepSnap.data ?? 'picker';

                        // Buoc 1: BAM CHON ten (khong phai o nhap chu) - diem mau chot chan trinh
                        // duyet goi y nham mat khau da luu cua Phu huynh (xem Login.tsx's comment).
                        if (step === 'picker') {
                            return (
                                <>
                                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                                        {t('quiz-student-pick-name-title')}
                                    </Typography>
                                    <UIStream
                                        initialData={false}
                                        stream={loginBloc.getStream('submitting')}
                                        builder={(submittingSnap) => {
                                            if (submittingSnap.data === true) {
                                                return (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                                        <CircularProgress size={28} />
                                                    </Box>
                                                );
                                            }
                                            const students: QuizFamilyMember[] = loginBloc.getField('students') ?? [];
                                            if (students.length === 0) {
                                                return (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {t('quiz-student-no-family-found')}
                                                    </Typography>
                                                );
                                            }
                                            return (
                                                <List sx={{ mb: 1 }}>
                                                    {students.map((s) => (
                                                        <ListItemButton
                                                            key={s.id}
                                                            onClick={() => loginBloc.pickStudent(s)}
                                                            sx={{ borderRadius: 2, mb: 0.5 }}
                                                        >
                                                            <ListItemAvatar>
                                                                <Avatar>{(s.fullName || '?').charAt(0).toUpperCase()}</Avatar>
                                                            </ListItemAvatar>
                                                            <ListItemText primary={s.fullName} />
                                                        </ListItemButton>
                                                    ))}
                                                </List>
                                            );
                                        }}
                                    />
                                    <Stack sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                            <Link component="button" type="button" onClick={doChangeFamily} color="text.secondary">
                                                {t('quiz-student-change-family')}
                                            </Link>
                                        </Typography>
                                    </Stack>
                                </>
                            );
                        }

                        // Buoc 2: da biet studentId, chi go mat khau.
                        if (step === 'password') {
                            const selected: QuizFamilyMember | null = loginBloc.getField('selectedStudent');
                            return (
                                <>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1, mb: 1 }}>
                                        <Avatar>{(selected?.fullName || '?').charAt(0).toUpperCase()}</Avatar>
                                        <Typography variant="subtitle1" fontWeight={600}>{selected?.fullName}</Typography>
                                    </Stack>
                                    <TextField
                                        label={t('password')}
                                        type="password"
                                        fullWidth
                                        margin="normal"
                                        autoFocus
                                        // 2026-09-06: autoComplete="new-password" (khong phai "off" -
                                        // Chrome co xu huong lo ma "off" tren o mat khau, "new-password"
                                        // moi la meo hieu qua hon de chan goi y dien mat khau da luu -
                                        // xem Login.tsx's comment "TAT GOI Y TRINH DUYET").
                                        autoComplete="new-password"
                                        onChange={(e) => loginBloc.setStream('password', e.target.value, 'req')}
                                        onKeyDown={onKeyDownPassword}
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
                                                onClick={doLoginSelected}
                                            >
                                                {t('log-in')}
                                            </Button>
                                        )}
                                    />
                                    <Stack sx={{ mt: 2 }}>
                                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                            <Link component="button" type="button" onClick={() => loginBloc.backToPicker()} color="text.secondary">
                                                {t('quiz-student-not-me')}
                                            </Link>
                                        </Typography>
                                    </Stack>
                                </>
                            );
                        }

                        // Buoc du phong 'manual': go thang username/password (hanh vi CU) - dung
                        // BlocQuizLogin's doLogin() ke thua nguyen xi (role da la 'student' tu
                        // initData()).
                        return (
                            <>
                                <TextField
                                    label={t('username')}
                                    fullWidth
                                    margin="normal"
                                    autoFocus
                                    autoComplete="off"
                                    onChange={(e) => loginBloc.setStream('identifier', e.target.value, 'req')}
                                    onKeyDown={onKeyDownManual}
                                />
                                <TextField
                                    label={t('password')}
                                    type="password"
                                    fullWidth
                                    margin="normal"
                                    autoComplete="new-password"
                                    onChange={(e) => loginBloc.setStream('password', e.target.value, 'req')}
                                    onKeyDown={onKeyDownManual}
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
                                            onClick={doManualLogin}
                                        >
                                            {t('log-in')}
                                        </Button>
                                    )}
                                />
                                <Stack sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                        <Link component="button" type="button" onClick={() => loginBloc.backFromManual()} color="text.secondary">
                                            {t('back')}
                                        </Link>
                                    </Typography>
                                </Stack>
                            </>
                        );
                    }}
                />

                {/* Link nho toi nhanh du phong "Dang nhap thu cong" - chi hien o buoc 'picker' (an
                    o 'password' vi da chon dung ten, khong can; an o chinh 'manual' vi dang o do roi). */}
                <UIStream
                    initialData="picker"
                    stream={loginBloc.getStream('step')}
                    builder={(stepSnap) => {
                        if ((stepSnap.data ?? 'picker') !== 'picker') return <></>;
                        return (
                            <Stack sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                    <Link component="button" type="button" onClick={() => loginBloc.useManualLogin()} color="text.secondary">
                                        {t('quiz-student-login-manual-link')}
                                    </Link>
                                </Typography>
                            </Stack>
                        );
                    }}
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
