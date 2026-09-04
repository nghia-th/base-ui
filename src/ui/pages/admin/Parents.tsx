import React, { useContext, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import LockOpenOutlined from "@mui/icons-material/LockOpenOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocAdminParents, QuizAdminParent } from "../../bloc/BlocAdminParents";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Quản lý phụ huynh" (khu vực Admin, /app/admin/parents) - list/create/khoá-mở/xoá Parent
// qua BlocAdminParents (AdminParentApi.java bên backend). Theo đúng recipe 5 bước ở
// Documentation.tsx, cùng shape UIStream/DataGrid/Dialog như Students.tsx (xem đó cho comment đầy
// đủ về state management) - khác ở 2 điểm: (1) không có nút Sửa (Admin không sửa thông tin Parent,
// chỉ tạo/khoá-mở/xoá - AdminParentApi.java không có PUT); (2) cột "active" hiện Chip trạng thái +
// nút khoá/mở thay cho nút Sửa.
export default function AdminParents() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocAdminParents);

    useEffect(() => {
        bloc.reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.save(() => {
            enqueueSnackbar(t('quiz-admin-parent-created') as string, { variant: 'success' });
            bloc.closeForm();
        }, showError);
    };

    // Khoá/mở - 2 lời nhắc riêng (khác nhau hẳn về mức độ cảnh báo: khoá đăng xuất ngay lập tức
    // Parent + mọi Student của họ, mở chỉ đơn thuần cho phép đăng nhập lại) thay vì dùng chung 1
    // ConfirmDialog cho cả 2 chiều.
    const askSetActive = (row: QuizAdminParent, active: boolean) => {
        bloc.confirm({
            title: active ? 'quiz-admin-activate' : 'quiz-admin-deactivate',
            message: active ? 'quiz-admin-activate-confirm' : 'quiz-admin-deactivate-confirm',
            onYes: () => {
                bloc.setActive(row.id, active, () => {
                    enqueueSnackbar(t('quiz-admin-parent-active-updated') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    // 2026-09-04 - Admin đặt lại mật khẩu cho Parent (mở dialog nhập newPassword, xem
    // BlocAdminParents.ts's openResetPassword/saveResetPassword). Không có ConfirmDialog trước -
    // hành động này chỉ có tác dụng sau khi Admin thực sự bấm "Lưu" trong dialog (khác
    // khoá/xoá ở trên vốn chỉ 1 click là xong ngay nên cần hỏi lại trước).
    const askResetPassword = (row: QuizAdminParent) => {
        bloc.openResetPassword(row.id);
    };

    const saveResetPassword = () => {
        bloc.saveResetPassword(() => {
            enqueueSnackbar(t('quiz-admin-parent-password-reset') as string, { variant: 'success' });
            bloc.closeResetPassword();
        }, showError);
    };

    const askRemove = (row: QuizAdminParent) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-admin-delete-parent-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-admin-parent-deleted') as string, { variant: 'success' });
                }, (error) => showError(error));
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'fullName', headerName: t('full-name') as string, flex: 1, minWidth: 160 },
        { field: 'email', headerName: t('email') as string, flex: 1, minWidth: 200 },
        { field: 'phone', headerName: t('phone') as string, width: 140 },
        {
            field: 'active', headerName: t('status') as string, width: 140,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={t(params.value ? 'quiz-admin-parent-active' : 'quiz-admin-parent-inactive')}
                    color={params.value ? 'success' : 'default'}
                />
            )
        },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                params.row.active
                    ? <GridActionsCellItem icon={<LockOutlined fontSize="small" />} label="deactivate" onClick={() => askSetActive(params.row, false)} />
                    : <GridActionsCellItem icon={<LockOpenOutlined fontSize="small" />} label="activate" onClick={() => askSetActive(params.row, true)} />,
                <GridActionsCellItem icon={<VpnKeyOutlined fontSize="small" />} label="reset-password" onClick={() => askResetPassword(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('parents')}
            builder={(snapshot) => {
                const rows: QuizAdminParent[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-admin-parents')}</Typography>
                                <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openNew()}>{t('new')}</Button>
                            </Stack>
                            <Box sx={{ height: 480 }}>
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    loading={snapshot.data == null}
                                    disableRowSelectionOnClick
                                />
                            </Box>
                        </Card>

                        <UIStream
                            initialData={{ isShow: false }}
                            stream={bloc.getStream('form_view')}
                            builder={(viewSnap) => {
                                const view = viewSnap.data ?? { isShow: false };
                                return (
                                    <Dialog open={view.isShow === true} onClose={() => bloc.closeForm()} maxWidth="xs" fullWidth>
                                        <DialogTitle>{t('quiz-admin-parent-new')}</DialogTitle>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    label={t('full-name')}
                                                    defaultValue={bloc.getField('fullName', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('fullName', e.target.value, 'req')}
                                                    autoFocus
                                                    fullWidth
                                                />
                                                <TextField
                                                    label={t('email')}
                                                    defaultValue={bloc.getField('email', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('email', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label={t('phone')}
                                                    defaultValue={bloc.getField('phone', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('phone', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label={t('password')}
                                                    type="password"
                                                    defaultValue={bloc.getField('password', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('password', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                            </Stack>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => bloc.closeForm()}>{t('cancel')}</Button>
                                            <UIStream
                                                initialData={false}
                                                stream={bloc.getStream('submitting')}
                                                builder={(submittingSnap) => (
                                                    <Button variant="contained" disabled={submittingSnap.data === true} onClick={save}>
                                                        {t('save')}
                                                    </Button>
                                                )}
                                            />
                                        </DialogActions>
                                    </Dialog>
                                );
                            }}
                        />

                        <UIStream
                            initialData={{ isShow: false, parentId: null }}
                            stream={bloc.getStream('reset_password_view')}
                            builder={(resetViewSnap) => {
                                const resetView = resetViewSnap.data ?? { isShow: false, parentId: null };
                                return (
                                    <Dialog open={resetView.isShow === true} onClose={() => bloc.closeResetPassword()} maxWidth="xs" fullWidth>
                                        <DialogTitle>{t('quiz-admin-parent-reset-password')}</DialogTitle>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    label={t('new-password')}
                                                    type="password"
                                                    defaultValue={bloc.getField('newPassword', 'req_reset') ?? ''}
                                                    onChange={(e) => bloc.setField('newPassword', e.target.value, 'req_reset')}
                                                    autoFocus
                                                    fullWidth
                                                />
                                            </Stack>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => bloc.closeResetPassword()}>{t('cancel')}</Button>
                                            <UIStream
                                                initialData={false}
                                                stream={bloc.getStream('reset_submitting')}
                                                builder={(submittingSnap) => (
                                                    <Button variant="contained" disabled={submittingSnap.data === true} onClick={saveResetPassword}>
                                                        {t('save')}
                                                    </Button>
                                                )}
                                            />
                                        </DialogActions>
                                    </Dialog>
                                );
                            }}
                        />
                    </>
                );
            }}
        />
    );
}
