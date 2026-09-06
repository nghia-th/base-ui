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
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DeleteSweepOutlined from "@mui/icons-material/DeleteSweepOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocParentClassrooms, QuizClassroom } from "../../bloc/BlocParentClassrooms";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Lớp học" (khu vực Phụ huynh, /app/parent/classrooms - MỚI, đứng đầu chuỗi Lớp -> Môn học
// -> Bài học -> Câu hỏi). Danh sách/CRUD đơn giản 1 cấp, cùng khuôn Students.tsx (DataGrid + Dialog
// thêm/sửa/xoá). Xoá Lớp (2026-09-06 revision) CASCADE luôn Học sinh/Môn học/Bài học/Câu hỏi/Đề
// kiểm tra thuộc lớp đó, không còn bị chặn (QUIZ_014/QUIZ_015 đã retired - xem
// CascadeDeleteService.java's javadoc).
//
// Xoá nhiều (2026-09-06, "xoa lop") - DataGrid checkboxSelection, stream 'classroomSelection'
// (BlocParentClassrooms), 2 nút "Xoá đã chọn"/"Xoá tất cả" dùng chung askRemoveMany().
//
// STATE MANAGEMENT (đổi 2026-09-01) - Dialog form dồn vào BlocParentClassrooms (form_view/req/
// submitting), xem comment ở BlocParentStudents.ts cho lý do chi tiết. TextField "name" uncontrolled.
export default function Classrooms() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentClassrooms);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.save(() => {
            const isEditing = (bloc.getField('form_view')?.id ?? 0) > 0;
            enqueueSnackbar(t(isEditing ? 'quiz-classroom-updated' : 'quiz-classroom-created') as string, { variant: 'success' });
            bloc.closeForm();
        }, showError);
    };

    const askRemove = (row: QuizClassroom) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-classroom-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-classroom-deleted') as string, { variant: 'success' });
                }, (error) => showError(error));
            }
        });
    };

    // Xoá nhiều Lớp (2026-09-06, "xoa lop") - "Xoá đã chọn" dùng đúng ids đang tick trong
    // DataGrid; "Xoá tất cả" không phụ thuộc tick, tự lấy toàn bộ id đang hiện trong bảng (client-
    // side, không cần endpoint riêng - xem BulkDeleteSupport.java's javadoc). Cả 2 dùng chung 1
    // hàm bên dưới, chỉ khác nguồn ids + message confirm.
    const askRemoveMany = (ids: number[]) => {
        if (ids.length === 0) return;
        bloc.confirm({
            title: 'delete',
            message: t('quiz-delete-selected-classrooms-confirm', { count: ids.length }) as string,
            onYes: () => {
                bloc.removeMany(ids, (result) => {
                    enqueueSnackbar(t('quiz-classrooms-bulk-deleted', { deleted: result.deletedCount, total: result.requested }) as string,
                        { variant: result.deletedCount === result.requested ? 'success' : 'warning' });
                }, (error) => showError(error));
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'name', headerName: t('quiz-classroom-name') as string, flex: 1, minWidth: 200 },
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
            stream={bloc.getStream('classrooms')}
            builder={(snapshot) => {
                const rows: QuizClassroom[] = snapshot.data ?? [];
                return (
                    <>
                        <UIStream
                            initialData={[]}
                            stream={bloc.getStream('classroomSelection')}
                            builder={(selSnap) => {
                                const selectedIds: number[] = selSnap.data ?? [];
                                return (
                                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" rowGap={1}>
                                            <Typography variant="h6" fontWeight={700}>{t('quiz-classrooms')}</Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {selectedIds.length > 0 && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('quiz-selected-count', { count: selectedIds.length })}
                                                    </Typography>
                                                )}
                                                <Button size="small" color="error" startIcon={<DeleteOutlined />} disabled={selectedIds.length === 0} onClick={() => askRemoveMany(selectedIds)}>
                                                    {t('quiz-delete-selected')}
                                                </Button>
                                                <Button size="small" color="error" startIcon={<DeleteSweepOutlined />} disabled={rows.length === 0} onClick={() => askRemoveMany(rows.map((r) => r.id))}>
                                                    {t('quiz-delete-all')}
                                                </Button>
                                                <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openNew()}>{t('new')}</Button>
                                            </Stack>
                                        </Stack>
                                        <Box sx={{ height: 420 }}>
                                            <DataGrid
                                                rows={rows}
                                                columns={columns}
                                                loading={snapshot.data == null}
                                                disableRowSelectionOnClick
                                                checkboxSelection
                                                rowSelectionModel={selectedIds}
                                                onRowSelectionModelChange={(model: GridRowSelectionModel) => bloc.changeClassroomSelection(model as number[])}
                                            />
                                        </Box>
                                    </Card>
                                );
                            }}
                        />

                        <UIStream
                            initialData={{ isShow: false, id: 0 }}
                            stream={bloc.getStream('form_view')}
                            builder={(viewSnap) => {
                                const view = viewSnap.data ?? { isShow: false, id: 0 };
                                const isEditing = (view.id ?? 0) > 0;
                                return (
                                    <AppDialog open={view.isShow === true} onClose={() => bloc.closeForm()} maxWidth="xs" title={isEditing ? t('quiz-classroom-edit') : t('quiz-classroom-new')} icon={isEditing ? EditOutlined : AddOutlined}>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    label={t('quiz-classroom-name')}
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
