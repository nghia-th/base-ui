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

// Trang "Quản lý học sinh" (khu vực Phụ huynh, /app/parent/students - Task 2 backend). Theo đúng
// recipe 5 bước ở Documentation.tsx: QuizStudentApi (bước 1) -> BlocParentStudents (bước 2) ->
// trang này (bước 3, dùng reUseBlocContent + UIStream giống Dashboard.tsx) -> route/menu đã thêm
// ở AppShell.tsx/AppMenuData.ts (bước 4) -> key dịch ở public/languages/*.json (bước 5).
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") - Dialog
// form không còn useState nữa, mọi thứ dồn vào BlocParentStudents (form_view/req/submitting) -
// xem comment ở đó. TextField (fullName/username/password) giờ uncontrolled (defaultValue đọc 1
// lần lúc Dialog mount, KHÔNG có value=) nên gõ chữ không re-render trang - Select (classroomId)
// vẫn cần controlled nên bọc UIStream riêng, hẹp.
export default function Students() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentStudents);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.save(() => {
            const isEditing = (bloc.getField('form_view')?.id ?? 0) > 0;
            enqueueSnackbar(t(isEditing ? 'quiz-student-updated' : 'quiz-student-created') as string, { variant: 'success' });
            bloc.closeForm();
        }, showError);
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
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => bloc.openEdit(params.row)} />,
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
                                    <Dialog open={view.isShow === true} onClose={() => bloc.closeForm()} maxWidth="xs" fullWidth>
                                        <DialogTitle>{isEditing ? t('quiz-student-edit') : t('quiz-student-new')}</DialogTitle>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    label={t('full-name')}
                                                    defaultValue={bloc.getField('fullName', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('fullName', e.target.value, 'req')}
                                                    autoFocus
                                                    fullWidth
                                                />
                                                <UIStream
                                                    initialData={bloc.getField('classrooms')}
                                                    stream={bloc.getStream('classrooms')}
                                                    builder={(classroomsSnap) => (
                                                        <UIStream
                                                            initialData={bloc.getField('classroomId', 'req') ?? ''}
                                                            stream={bloc.getStream('classroomId')}
                                                            builder={(classroomIdSnap) => (
                                                                <FormControl fullWidth size="small">
                                                                    <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                                    <Select
                                                                        label={t('quiz-classrooms')}
                                                                        value={classroomIdSnap.data ?? ''}
                                                                        onChange={(e) => bloc.setStream('classroomId', e.target.value === '' ? '' : Number(e.target.value), 'req')}
                                                                    >
                                                                        {(classroomsSnap.data ?? []).map((c: QuizClassroomLite) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                                    </Select>
                                                                </FormControl>
                                                            )}
                                                        />
                                                    )}
                                                />
                                                <TextField
                                                    label={t('username')}
                                                    defaultValue={bloc.getField('username', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('username', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label={t('password')}
                                                    type="password"
                                                    defaultValue={bloc.getField('password', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('password', e.target.value, 'req')}
                                                    helperText={isEditing ? t('quiz-password-optional-hint') : undefined}
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
