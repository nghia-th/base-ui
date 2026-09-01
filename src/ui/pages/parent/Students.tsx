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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentStudents, QuizStudent, QuizClassroomLite } from "../../bloc/BlocParentStudents";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Form đang mở trong Dialog: null = đóng, {id: 0, ...} = tạo mới, {id: <thật>, ...} = sửa.
// password để riêng field mode='create' (bắt buộc) khỏi mode='edit' (optional, để trống = giữ
// nguyên - xem StudentUpdateRequest.java) vì cùng field "password" nhưng ý nghĩa validate khác nhau.
interface StudentFormState {
    id: number;
    fullName: string;
    classroomId: number | '';
    username: string;
    password: string;
}

const EMPTY_FORM: StudentFormState = { id: 0, fullName: '', classroomId: '', username: '', password: '' };

// Trang "Quản lý học sinh" (khu vực Phụ huynh, /app/parent/students - Task 2 backend). Theo đúng
// recipe 5 bước ở Documentation.tsx: QuizStudentApi (bước 1) -> BlocParentStudents (bước 2) ->
// trang này (bước 3, dùng reUseBlocContent + UIStream giống Dashboard.tsx) -> route/menu đã thêm
// ở AppShell.tsx/AppMenuData.ts (bước 4) -> key dịch ở public/languages/*.json (bước 5).
export default function Students() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentStudents);

    const [form, setForm] = useState<StudentFormState | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const isEditing = (form?.id ?? 0) > 0;

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const openNew = () => setForm({ ...EMPTY_FORM });
    const openEdit = (row: QuizStudent) => setForm({ id: row.id, fullName: row.fullName, classroomId: row.classroomId, username: row.username, password: '' });
    const closeForm = () => { setForm(null); setSubmitting(false); };

    const save = () => {
        if (!form) return;
        setSubmitting(true);
        if (form.classroomId === '') return;
        if (isEditing) {
            bloc.update(form.id, {
                fullName: form.fullName,
                classroomId: form.classroomId,
                username: form.username,
                // Để trống = giữ nguyên mật khẩu cũ (StudentUpdateRequest.java) - chỉ gửi khi anh
                // thật sự gõ mật khẩu mới.
                password: form.password ? form.password : undefined
            }, () => {
                enqueueSnackbar(t('quiz-student-updated') as string, { variant: 'success' });
                closeForm();
            }, (error) => { setSubmitting(false); showError(error); });
        } else {
            bloc.create({
                fullName: form.fullName,
                classroomId: form.classroomId,
                username: form.username,
                password: form.password
            }, () => {
                enqueueSnackbar(t('quiz-student-created') as string, { variant: 'success' });
                closeForm();
            }, (error) => { setSubmitting(false); showError(error); });
        }
    };

    // ConfirmDialog tự gọi t(title)/t(message) bên trong nó (xem ConfirmDialog.tsx) - truyền
    // thẳng KEY dịch, không tự interpolate/tạo chuỗi sẵn ở đây (message còn được render qua
    // dangerouslySetInnerHTML nên càng không nên tự ghép fullName vào chuỗi HTML thô).
    const askRemove = (row: QuizStudent) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-student-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-student-deleted') as string, { variant: 'success' });
                }, (error) => showError(error));
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'fullName', headerName: t('full-name') as string, flex: 1, minWidth: 160 },
        {
            field: 'classroomId', headerName: t('quiz-classrooms') as string, width: 160,
            // @mui/x-data-grid v7: valueGetter nhận thẳng (value, row, ...) - xem Tests.tsx cho
            // cùng pattern resolve id -> tên qua bloc.getField() (đã initData() nên có sẵn).
            valueGetter: (value: number) => {
                const classrooms: QuizClassroomLite[] = bloc.getField('classrooms') ?? [];
                return classrooms.find((c) => c.id === value)?.name ?? '—';
            }
        },
        { field: 'username', headerName: t('username') as string, width: 160 },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => openEdit(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    // Dialog form nằm TRONG builder() của UIStream (không phải children của nó) vì UIStream.render()
    // chỉ render đúng những gì builder() trả về, bỏ qua children (xem UIStream.ts) - đặt Dialog ở
    // ngoài UIStream như children sẽ khiến nó không bao giờ hiện ra.
    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('students')}
            builder={(snapshot) => {
                const rows: QuizStudent[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-students')}</Typography>
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
                            <DialogTitle>{isEditing ? t('quiz-student-edit') : t('quiz-student-new')}</DialogTitle>
                            <DialogContent>
                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    <TextField
                                        label={t('full-name')}
                                        value={form?.fullName ?? ''}
                                        onChange={(e) => setForm((s) => s && { ...s, fullName: e.target.value })}
                                        autoFocus
                                        fullWidth
                                    />
                                    <UIStream
                                        initialData={bloc.getField('classrooms')}
                                        stream={bloc.getStream('classrooms')}
                                        builder={(classroomsSnap) => (
                                            <FormControl fullWidth size="small">
                                                <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                <Select
                                                    label={t('quiz-classrooms')}
                                                    value={form?.classroomId ?? ''}
                                                    onChange={(e) => setForm((s) => s && { ...s, classroomId: e.target.value === '' ? '' : Number(e.target.value) })}
                                                >
                                                    {(classroomsSnap.data ?? []).map((c: QuizClassroomLite) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                    <TextField
                                        label={t('username')}
                                        value={form?.username ?? ''}
                                        onChange={(e) => setForm((s) => s && { ...s, username: e.target.value })}
                                        fullWidth
                                    />
                                    <TextField
                                        label={t('password')}
                                        type="password"
                                        value={form?.password ?? ''}
                                        onChange={(e) => setForm((s) => s && { ...s, password: e.target.value })}
                                        helperText={isEditing ? t('quiz-password-optional-hint') : undefined}
                                        fullWidth
                                    />
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={closeForm}>{t('cancel')}</Button>
                                <Button
                                    variant="contained"
                                    disabled={submitting || !form?.fullName || form?.classroomId === '' || !form?.username || (!isEditing && !form?.password)}
                                    onClick={save}
                                >
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
