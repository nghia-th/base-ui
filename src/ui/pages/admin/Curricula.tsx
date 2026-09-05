import React, { useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocAdminCurricula } from "../../bloc/BlocAdminCurricula";
import { QuizCurriculum } from "../../../api/QuizCurriculumApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Quản lý Bộ sách" (khu vực Admin, /app/admin/curricula - MỚI, 2026-09-05) - thay cho danh
// sách 3 giá trị cứng cũ (Kết nối tri thức/Chân trời sáng tạo/Cánh diều) từng nằm trực tiếp trong
// admin/Library.tsx - theo yêu cầu của anh: "chổ bộ sách phải được adminh tao hiện tại đang set
// cứng". Không root-only - mọi Admin đều quản lý được (giống Thư viện sách giáo khoa, khác "Quản
// lý Admin"), xem CurriculumService.java's javadoc. Xoá 1 Bộ sách đang có tài liệu dùng tên đó bị
// chặn (QUIZ_037), hiện lỗi rõ ràng qua quizErrorMessage như mọi trang khác. Cùng khuôn DataGrid +
// Dialog thêm/sửa/xoá hệt Classrooms.tsx (khu vực Phụ huynh).
export default function AdminCurricula() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocAdminCurricula);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.save(() => {
            const isEditing = (bloc.getField('form_view')?.id ?? 0) > 0;
            enqueueSnackbar(t(isEditing ? 'quiz-curriculum-updated' : 'quiz-curriculum-created') as string, { variant: 'success' });
            bloc.closeForm();
        }, showError);
    };

    const askRemove = (row: QuizCurriculum) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-curriculum-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-curriculum-deleted') as string, { variant: 'success' });
                }, (error) => showError(error));
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'name', headerName: t('quiz-curriculum-name') as string, flex: 1, minWidth: 200 },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => bloc.openEdit(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('curricula')}
            builder={(snapshot) => {
                const rows: QuizCurriculum[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-admin-curricula')}</Typography>
                                <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openNew()}>{t('new')}</Button>
                            </Stack>
                            <Box sx={{ height: 420 }}>
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    loading={snapshot.data == null}
                                    disableRowSelectionOnClick
                                />
                            </Box>
                        </Card>

                        <UIStream
                            initialData={{ isShow: false, id: 0 }}
                            stream={bloc.getStream('form_view')}
                            builder={(viewSnap) => {
                                const view = viewSnap.data ?? { isShow: false, id: 0 };
                                const isEditing = (view.id ?? 0) > 0;
                                return (
                                    <AppDialog open={view.isShow === true} onClose={() => bloc.closeForm()} maxWidth="xs" title={isEditing ? t('quiz-curriculum-edit') : t('quiz-curriculum-new')} icon={isEditing ? EditOutlined : AddOutlined}>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    label={t('quiz-curriculum-name')}
                                                    defaultValue={bloc.getField('name', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('name', e.target.value, 'req')}
                                                    autoFocus
                                                    fullWidth
                                                />
                                            </Stack>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => bloc.closeForm()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
                                            <UIStream
                                                initialData={false}
                                                stream={bloc.getStream('submitting')}
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
                    </>
                );
            }}
        />
    );
}
