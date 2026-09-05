import React from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import UIStream from "./UIStream";
import AppDialog from "../dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../dialogs/dialogToneStyles";
import LocalStorage from "../../../base/LocalStorage";
import { BASE_URL } from "../../../base/PrefixService";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";
import { BlocApp } from "../../bloc/BlocApp";

interface ChangePasswordDialogProps {
    bloc: BlocApp;
}

// Dialog đổi mật khẩu tự phục vụ (2026-09-04, cả 3 role: Parent/Student/Admin) - mở qua
// AppTopbar.tsx's menu người dùng (onChangePasswordClick), render ở AppShell.tsx cùng chỗ với
// AppConfigDrawer/AppRightMenu. Dùng lại blocApp (đã sẵn có ở AppShell cho mọi trang đã đăng
// nhập) thay vì tạo Bloc riêng - xem BlocApp.ts's openChangePassword/closeChangePassword/
// saveChangePassword.
// <p>
// Thành công KHÔNG chỉ đóng dialog - backend đã đăng xuất NGAY mọi phiên (kể cả phiên hiện tại,
// xem AuthService#changePassword's javadoc), nên access token hiện tại hỏng ngay từ request kế
// tiếp. Phải xoá LocalStorage + điều hướng /login giống hệt AppShell.tsx's handleLogout, không
// gọi QuizAuthApi.logout() thêm (invalidateSessions phía backend đã thu hồi mọi refresh token
// rồi, gọi lại chỉ dư thừa).
export default function ChangePasswordDialog({ bloc }: ChangePasswordDialogProps) {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.saveChangePassword(() => {
            enqueueSnackbar(t('quiz-change-password-success') as string, { variant: 'success' });
            bloc.closeChangePassword();
            LocalStorage.deleteToken();
            LocalStorage.deleteRefreshToken();
            window.location.href = BASE_URL + '/login';
        }, showError);
    };

    return (
        <UIStream
            initialData={{ isShow: false }}
            stream={bloc.getStream('change_password_view')}
            builder={(viewSnap) => {
                const view = viewSnap.data ?? { isShow: false };
                return (
                    <AppDialog open={view.isShow === true} onClose={() => bloc.closeChangePassword()} title={t('change-password')} icon={VpnKeyOutlined}>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label={t('current-password')}
                                    type="password"
                                    defaultValue={bloc.getField('oldPassword', 'req_change_password') ?? ''}
                                    onChange={(e) => bloc.setField('oldPassword', e.target.value, 'req_change_password')}
                                    autoFocus
                                    fullWidth
                                />
                                <TextField
                                    label={t('new-password')}
                                    type="password"
                                    defaultValue={bloc.getField('newPassword', 'req_change_password') ?? ''}
                                    onChange={(e) => bloc.setField('newPassword', e.target.value, 'req_change_password')}
                                    fullWidth
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => bloc.closeChangePassword()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
                            <UIStream
                                initialData={false}
                                stream={bloc.getStream('change_password_submitting')}
                                builder={(submittingSnap) => (
                                    <Button variant="contained" color="primary" startIcon={<CheckOutlined />} disabled={submittingSnap.data === true} onClick={save} sx={DIALOG_PRIMARY_BUTTON_SX}>
                                        {t('save')}
                                    </Button>
                                )}
                            />
                        </DialogActions>
                    </AppDialog>
                );
            }}
        />
    );
}
