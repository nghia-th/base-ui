import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentClassrooms, QuizClassroom } from "../../bloc/BlocParentClassrooms";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Form đang mở trong Dialog: null = đóng, {id: 0, ...} = tạo mới, {id: <thật>, ...} = sửa - giống
// hệt pattern StudentFormState ở Students.tsx, chỉ 1 field "name".
interface ClassroomFormState {
    id: number;
    name: string;
}

const EMPTY_FORM: ClassroomFormState = { id: 0, name: '' };

// Trang "Lớp học" (khu vực Phụ huynh, /app/parent/classrooms - MỚI, đứng đầu chuỗi Lớp -> Môn học
// -> Bài học -> Câu hỏi). Danh sách/CRUD đơn giản 1 cấp, cùng khuôn Students.tsx (DataGrid + Dialog
// thêm/sửa/xoá). Xoá Lớp bị chặn nếu còn Học sinh hoặc Môn học thuộc lớp đó (QUIZ_014/QUIZ_015,
// xem ClassroomService.java) - hiện lỗi rõ ràng qua quizErrorMessage như mọi trang khác.
export default function Classrooms() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentClassrooms);

    const [form, setForm] = useState<ClassroomFormState | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const isEditing = (form?.id ?? 0) > 0;

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const openNew = () => setForm({ ...EMPTY_FORM });
    const openEdit = (row: QuizClassroom) => setForm({ id: row.id, name: row.name });
    const closeForm = () => { setForm(null); setSubmitting(false); };

    const save = () => {
        if (!form) return;
        setSubmitting(true);
        const request = { name: form.name };
        if (isEditing) {
            bloc.update(form.id, request, () => {
                enqueueSnackbar(t('quiz-classroom-updated') as string, { variant: 'success' });
                closeForm();
            }, (error) => { setSubmitting(false); showError(error); });
        } else {
            bloc.create(request, () => {
                enqueueSnackbar(t('quiz-classroom-created') as string, { variant: 'success' });
                closeForm();
            }, (error) => { setSubmitting(false); showError(error); });
        }
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

    const columns: GridColDef[] = useMemo(() => [
        { field: 'name', headerName: t('quiz-classroom-name') as string, flex: 1, minWidth: 200 },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => openEdit(params.row)} />,
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
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-classrooms')}</Typography>
                                <Button variant="contained" startIcon={<AddOutlined />} onClick={openNew}>{t('new')}</Button>
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

                        <Dialog open={form != null} onClose={closeForm} maxWidth="xs" fullWidth>
                            <DialogTitle>{isEditing ? t('quiz-classroom-edit') : t('quiz-classroom-new')}</DialogTitle>
                            <DialogContent>
                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    <TextField
                                        label={t('quiz-classroom-name')}
                                        value={form?.name ?? ''}
                                        onChange={(e) => setForm((s) => s && { ...s, name: e.target.value })}
                                        autoFocus
                                        fullWidth
                                    />
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={closeForm}>{t('cancel')}</Button>
                                <Button variant="contained" disabled={submitting || !form?.name} onClick={save}>
                                    {t('save')}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </>
                );
            }}
        />
    );
}
