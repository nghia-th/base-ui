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
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocAdminAdmins, QuizAdminAdmin } from "../../bloc/BlocAdminAdmins";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Quản lý Admin" (khu vực Admin, /app/admin/admins, 2026-09-05) - list/create/xoá tài
// khoản Admin KHÁC qua BlocAdminAdmins (AdminManageApi.java bên backend). CHỈ tài khoản root mới
// vào được trang này (xem AppShell.tsx's RequireAdminRoot + AppMenuData.ts's adminSidebarMenu ẩn
// mục menu cho Admin thường) - chốt chặn dữ liệu thật vẫn ở AdminManageService#requireRoot bên
// backend. Cùng shape UIStream/DataGrid/Dialog như Parents.tsx (xem đó cho comment đầy đủ) - khác
// ở 2 điểm: (1) không có nút khoá/mở hay đặt lại mật khẩu (Admin không tự làm việc đó cho Admin
// khác trong v1, chỉ tạo/xoá); (2) cột "root" hiện Chip đánh dấu tài khoản root, và nút xoá bị ẩn
// hẳn cho đúng row đó (backend cũng chặn - QUIZ_031 ROOT_ADMIN_CANNOT_BE_DELETED - đây chỉ là
// hàng rào UX tránh Admin bấm nhầm rồi nhận lỗi).
export default function AdminAdmins() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocAdminAdmins);

    useEffect(() => {
        bloc.reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.save(() => {
            enqueueSnackbar(t('quiz-admin-admin-created') as string, { variant: 'success' });
            bloc.closeForm();
        }, showError);
    };

    const askRemove = (row: QuizAdminAdmin) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-admin-delete-admin-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-admin-admin-deleted') as string, { variant: 'success' });
                }, (error) => showError(error));
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'fullName', headerName: t('full-name') as string, flex: 1, minWidth: 160 },
        { field: 'email', headerName: t('email') as string, flex: 1, minWidth: 200 },
        {
            field: 'root', headerName: t('quiz-admin-admin-type') as string, width: 160,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={t(params.value ? 'quiz-admin-root' : 'quiz-admin-admin-regular')}
                    color={params.value ? 'primary' : 'default'}
                />
            )
        },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 80,
            getActions: (params) => params.row.root
                ? []
                : [<GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('admins')}
            builder={(snapshot) => {
                const rows: QuizAdminAdmin[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-admin-admins')}</Typography>
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
                                        <DialogTitle>{t('quiz-admin-admin-new')}</DialogTitle>
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
                    </>
                );
            }}
        />
    );
}
