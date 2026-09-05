import React from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import UIStream from "./UIStream";
import AppDialog from "../dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../dialogs/dialogToneStyles";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";
import { BlocApp } from "../../bloc/BlocApp";

interface SetUsernameDialogProps {
    bloc: BlocApp;
}

// Self-service "set/change username" dialog (2026-09-05, Parent or Admin only - see
// AuthService#setUsername's javadoc), same shell pattern as ChangePasswordDialog.tsx (reuses
// blocApp, opened from AppTopbar.tsx's user menu). Unlike ChangePasswordDialog, success does NOT
// force-logout - just close the dialog and show a success snackbar, see BlocApp.ts's
// saveSetUsername.
export default function SetUsernameDialog({ bloc }: SetUsernameDialogProps) {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.saveSetUsername(() => {
            enqueueSnackbar(t('quiz-set-username-success') as string, { variant: 'success' });
            bloc.closeSetUsername();
        }, showError);
    };

    return (
        <UIStream
            initialData={{ isShow: false }}
            stream={bloc.getStream('set_username_view')}
            builder={(viewSnap) => {
                const view = viewSnap.data ?? { isShow: false };
                return (
                    <AppDialog open={view.isShow === true} onClose={() => bloc.closeSetUsername()} title={t('quiz-set-username-title')} icon={BadgeOutlined}>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label={t('username')}
                                    defaultValue={bloc.getField('username', 'req_set_username') ?? ''}
                                    onChange={(e) => bloc.setField('username', e.target.value, 'req_set_username')}
                                    autoFocus
                                    fullWidth
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => bloc.closeSetUsername()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
                            <UIStream
                                initialData={false}
                                stream={bloc.getStream('set_username_submitting')}
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
