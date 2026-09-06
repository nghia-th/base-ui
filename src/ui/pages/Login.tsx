import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LockOutlined from "@mui/icons-material/LockOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import FamilyRestroomOutlined from "@mui/icons-material/FamilyRestroomOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import AppDialog from "../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../components/dialogs/dialogToneStyles";
import LocalStorage from "../../base/LocalStorage";
import { STUDENT_LOGIN_PARENT_KEY } from "../bloc/BlocStudentLogin";

// Trang CHON VAI TRO dang nhap (LoginChooser) - route /login (2026-09-06, ban sua 2 cua thiet ke
// lai dang nhap, thay cho ban sua 1 truoc do - xem claude/login-redesign-2026-09-06.md de biet
// toan bo lich su/ly do). De xuat MOI cua anh: "mo dau vao dang nhap muon co 3 o: Quan tri vien/
// Phu huynh/Hoc sinh, chon 1 trong 3 o do thi tuong ung di toi dang nhap tung chuc nang rieng".
//
// 3 O CHON:
//   - "Phu huynh" -> dieu huong sang /parent-login (ParentLogin.tsx, form that su, giu nguyen
//     query string ?url=... de sau khi dang nhap xong quay lai dung trang ban dau da yeu cau).
//   - "Hoc sinh" -> NEU da co parentIdentifier luu san (localStorage, dang nhap thanh cong lan
//     truoc) thi di THANG sang /student-login (khong hoi lai) - dung y "neu dang nhap thanh cong
//     se luu thong tin phu huynh de lan sau khong phai chon nua". NEU CHUA co, hien 1 POPUP
//     ("Chon phu huynh") de go thong tin Phu huynh (email/sdt/username) TRUOC KHI vao trang nhap
//     lieu cua Hoc sinh - dung y "truoc khi vao trang nhap thong tin thi show popup chon phu
//     huynh roi chuyen sang login danh cho hoc sinh". Popup nay CHI luu chuoi da go vao
//     localStorage roi dieu huong - KHONG tu goi API tra cuu o day (tranh goi API 2 lan) -
//     StudentLogin.tsx's initData() se tu tra cuu that su khi mo trang do (xem BlocStudentLogin.ts).
//   - "Quan tri vien" -> dieu huong sang /admin/login (AdminLogin.tsx, GIU NGUYEN 100% khong doi
//     theo dung yeu cau "doi voi admin thi nhu cu" cua anh).
//
// TAT GOI Y TRINH DUYET (best-effort, theo yeu cau "neu duoc tat goi y cua trinh duyet" cua anh):
// o nhap Phu huynh trong popup nay dung autoComplete="off". Luu y day chi la TIN HIEU GOI Y cho
// trinh duyet, KHONG phai co che bat buoc - Chrome/Edge hien dai van co the tu quyet dinh hien goi
// y username/password da luu bat chap thuoc tinh nay trong 1 so truong hop (day la han che da
// biet cua chuan HTML autocomplete, khong co cach nao phia web page ep buoc 100% duoc) - diem mau
// chot THAT SU chan duoc loi goi y nham la thiet ke "BAM CHON ten thay vi go chu" o buoc ke tiep
// (StudentLogin.tsx's buoc 'picker') - 1 nut bam khong phai o nhap chu nen trinh duyet KHONG CO
// GI de goi y vao do ca, khac voi autoComplete chi la 1 goi y co the bi bo qua.
export default function Login() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();
    const [studentDialogOpen, setStudentDialogOpen] = useState(false);
    const [parentIdentifier, setParentIdentifier] = useState('');

    useEffect(() => {
        document.title = t('log-in') as string;
    }, [t]);

    const goParent = () => navigate(`/parent-login${location.search}`);

    const goAdmin = () => navigate('/admin/login');

    const goStudent = () => {
        if (LocalStorage.getItem(STUDENT_LOGIN_PARENT_KEY)) {
            navigate('/student-login');
            return;
        }
        setParentIdentifier('');
        setStudentDialogOpen(true);
    };

    const submitStudentDialog = () => {
        const trimmed = parentIdentifier.trim();
        if (!trimmed) {
            enqueueSnackbar(t('please-enter-login-info') as string, { variant: 'warning' });
            return;
        }
        LocalStorage.setItem(STUDENT_LOGIN_PARENT_KEY, trimmed);
        setStudentDialogOpen(false);
        navigate('/student-login');
    };

    const onKeyDownDialog = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') submitStudentDialog();
    };

    const roles: { icon: React.ElementType; label: string; onClick: () => void }[] = [
        { icon: PersonOutlined, label: t('quiz-role-parent'), onClick: goParent },
        { icon: SchoolOutlined, label: t('quiz-role-student'), onClick: goStudent },
        { icon: AdminPanelSettingsOutlined, label: t('quiz-role-admin'), onClick: goAdmin },
    ];

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
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        {t('quiz-login-choose-role-title')}
                    </Typography>
                </Box>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <ButtonBase
                                key={role.label}
                                onClick={role.onClick}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5, width: '100%',
                                    px: 2, py: 1.5, borderRadius: 2, border: '1px solid',
                                    borderColor: 'divider', textAlign: 'left',
                                    '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
                                }}
                            >
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <Icon />
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
                                    {role.label}
                                </Typography>
                                <ChevronRightOutlined color="action" />
                            </ButtonBase>
                        );
                    })}
                </Stack>
            </Paper>

            <AppDialog
                open={studentDialogOpen}
                onClose={() => setStudentDialogOpen(false)}
                title={t('quiz-student-choose-parent-title')}
                icon={FamilyRestroomOutlined}
            >
                <DialogContent>
                    <TextField
                        label={t('quiz-student-parent-identifier-label')}
                        helperText={t('quiz-student-parent-identifier-hint')}
                        fullWidth
                        margin="normal"
                        autoFocus
                        // 2026-09-06 - xem comment dau file "TAT GOI Y TRINH DUYET".
                        autoComplete="off"
                        value={parentIdentifier}
                        onChange={(e) => setParentIdentifier(e.target.value)}
                        onKeyDown={onKeyDownDialog}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStudentDialogOpen(false)} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>
                        {t('cancel')}
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<CheckOutlined />} onClick={submitStudentDialog} sx={DIALOG_PRIMARY_BUTTON_SX}>
                        {t('next')}
                    </Button>
                </DialogActions>
            </AppDialog>
        </Box>
    );
}
