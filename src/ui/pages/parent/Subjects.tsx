import React, { useContext, useMemo, useState, useEffect } from "react";
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
import Grid from "@mui/material/Grid2";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentSubjects, QuizSubject, QuizLesson, QuizClassroomLite } from "../../bloc/BlocParentSubjects";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

interface NameFormState {
    id: number;
    name: string;
}

// Subject giờ bắt buộc thuộc 1 Classroom (xem QuizSubject.classroomId) nên cần form riêng khỏi
// NameFormState (Lesson vẫn chỉ có "name", không đổi).
interface SubjectFormState {
    id: number;
    name: string;
    classroomId: number | '';
}

const EMPTY_FORM: NameFormState = { id: 0, name: '' };
const EMPTY_SUBJECT_FORM: SubjectFormState = { id: 0, name: '', classroomId: '' };

// Trang "Môn học / Bài học" (khu vực Phụ huynh, /app/parent/subjects - Task 3 backend). Master-
// detail 1 màn hình: cột trái danh sách Subject (List), chọn 1 Subject thì cột phải hiện Lesson
// của Subject đó (DataGrid) - cả 2 phần dùng chung 1 Bloc (BlocParentSubjects) nhưng 2 stream
// riêng ('subjects' và 'lessons'), theo đúng lưu ý ở ui-base-status.md: Dialog phải nằm trong
// builder() của UIStream, không phải children.
export default function Subjects() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentSubjects);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const [filterClassroomId, setFilterClassroomId] = useState<number | ''>('');
    const [selectedSubject, setSelectedSubject] = useState<QuizSubject | null>(null);
    const [subjectForm, setSubjectForm] = useState<SubjectFormState | null>(null);
    const [lessonForm, setLessonForm] = useState<NameFormState | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Đổi Lớp đang lọc -> tải lại Subject theo đúng lớp đó (server-side filter, xem
    // BlocParentSubjects.reloadSubjects/QuizSubjectApi.list - cùng convention với
    // Tests.tsx's onFilterChange). Subject đang chọn không còn thuộc lớp mới -> bỏ chọn.
    const onFilterChange = (value: number | '') => {
        setFilterClassroomId(value);
        bloc.reloadSubjects(value === '' ? undefined : value);
        setSelectedSubject(null);
    };

    const selectSubject = (subject: QuizSubject) => {
        setSelectedSubject(subject);
        bloc.loadLessons(subject.id);
    };

    // --- Subject form ---
    // Mặc định Classroom của form mới = lớp đang lọc (nếu có chọn) - đỡ phải chọn lại khi đang
    // xem đúng 1 lớp; để trống (chọn "Tất cả lớp") thì form mới cũng để trống, bắt buộc tự chọn.
    const openNewSubject = () => setSubjectForm({ ...EMPTY_SUBJECT_FORM, classroomId: filterClassroomId });
    const openEditSubject = (subject: QuizSubject) => setSubjectForm({ id: subject.id, name: subject.name, classroomId: subject.classroomId });
    const closeSubjectForm = () => { setSubjectForm(null); setSubmitting(false); };

    const saveSubject = () => {
        if (!subjectForm || subjectForm.classroomId === '') return;
        setSubmitting(true);
        const onComplete = () => { closeSubjectForm(); };
        const onError = (error: any) => { setSubmitting(false); showError(error); };
        const request = { name: subjectForm.name, classroomId: subjectForm.classroomId };
        if (subjectForm.id > 0) {
            bloc.updateSubject(subjectForm.id, request, onComplete, onError);
        } else {
            bloc.createSubject(request, onComplete, onError);
        }
    };

    const askRemoveSubject = (subject: QuizSubject) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-subject-confirm',
            onYes: () => {
                bloc.removeSubject(subject.id, () => {
                    enqueueSnackbar(t('quiz-subject-deleted') as string, { variant: 'success' });
                    if (selectedSubject?.id === subject.id) setSelectedSubject(null);
                }, showError);
            }
        });
    };

    // --- Lesson form ---
    const openNewLesson = () => setLessonForm({ ...EMPTY_FORM });
    const openEditLesson = (lesson: QuizLesson) => setLessonForm({ id: lesson.id, name: lesson.name });
    const closeLessonForm = () => { setLessonForm(null); setSubmitting(false); };

    const saveLesson = () => {
        if (!lessonForm || !selectedSubject) return;
        setSubmitting(true);
        const onComplete = () => { closeLessonForm(); };
        const onError = (error: any) => { setSubmitting(false); showError(error); };
        if (lessonForm.id > 0) {
            bloc.updateLesson(lessonForm.id, selectedSubject.id, { name: lessonForm.name }, onComplete, onError);
        } else {
            bloc.createLesson({ subjectId: selectedSubject.id, name: lessonForm.name }, onComplete, onError);
        }
    };

    const askRemoveLesson = (lesson: QuizLesson) => {
        if (!selectedSubject) return;
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-lesson-confirm',
            onYes: () => {
                bloc.removeLesson(lesson.id, selectedSubject.id, () => {
                    enqueueSnackbar(t('quiz-lesson-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const lessonColumns: GridColDef[] = useMemo(() => [
        { field: 'name', headerName: t('quiz-lesson-name') as string, flex: 1, minWidth: 200 },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => openEditLesson(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemoveLesson(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t, selectedSubject]);

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('subjects')}
                    builder={(snapshot) => {
                        const subjects: QuizSubject[] = snapshot.data ?? [];
                        return (
                            <>
                                <Card sx={{ p: 2 }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="h6" fontWeight={700}>{t('quiz-subjects')}</Typography>
                                        <IconButton color="primary" onClick={openNewSubject}><AddOutlined /></IconButton>
                                    </Stack>
                                    <UIStream
                                        initialData={bloc.getField('classrooms')}
                                        stream={bloc.getStream('classrooms')}
                                        builder={(classroomsSnap) => (
                                            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                                <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                <Select
                                                    label={t('quiz-classrooms')}
                                                    value={filterClassroomId}
                                                    onChange={(e) => onFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                >
                                                    <MenuItem value="">{t('quiz-all-classrooms')}</MenuItem>
                                                    {(classroomsSnap.data ?? []).map((c: QuizClassroomLite) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                    <List disablePadding>
                                        {subjects.map((s) => (
                                            <ListItemButton
                                                key={s.id}
                                                selected={selectedSubject?.id === s.id}
                                                onClick={() => selectSubject(s)}
                                                sx={{ borderRadius: 1, mb: 0.5 }}
                                            >
                                                <ListItemText primary={s.name} />
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditSubject(s); }}>
                                                    <EditOutlined fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); askRemoveSubject(s); }}>
                                                    <DeleteOutlined fontSize="small" />
                                                </IconButton>
                                            </ListItemButton>
                                        ))}
                                        {subjects.length === 0 && snapshot.data != null && (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                                {t('quiz-no-subjects')}
                                            </Typography>
                                        )}
                                    </List>
                                </Card>

                                <Dialog open={subjectForm != null} onClose={closeSubjectForm} maxWidth="xs" fullWidth>
                                    <DialogTitle>{(subjectForm?.id ?? 0) > 0 ? t('quiz-subject-edit') : t('quiz-subject-new')}</DialogTitle>
                                    <DialogContent>
                                        <Stack spacing={2} sx={{ mt: 1 }}>
                                            <UIStream
                                                initialData={bloc.getField('classrooms')}
                                                stream={bloc.getStream('classrooms')}
                                                builder={(classroomsSnap) => (
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                        <Select
                                                            label={t('quiz-classrooms')}
                                                            value={subjectForm?.classroomId ?? ''}
                                                            onChange={(e) => setSubjectForm((s) => s && { ...s, classroomId: e.target.value === '' ? '' : Number(e.target.value) })}
                                                        >
                                                            {(classroomsSnap.data ?? []).map((c: QuizClassroomLite) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                            <TextField
                                                label={t('quiz-subject-name')}
                                                value={subjectForm?.name ?? ''}
                                                onChange={(e) => setSubjectForm((s) => s && { ...s, name: e.target.value })}
                                                autoFocus
                                                fullWidth
                                            />
                                        </Stack>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={closeSubjectForm}>{t('cancel')}</Button>
                                        <Button variant="contained" disabled={submitting || !subjectForm?.name || subjectForm?.classroomId === ''} onClick={saveSubject}>{t('save')}</Button>
                                    </DialogActions>
                                </Dialog>
                            </>
                        );
                    }}
                />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
                {selectedSubject == null ? (
                    <Card sx={{
                        p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', minHeight: 240, color: 'text.secondary'
                    }}>
                        <MenuBookOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                        <Typography variant="body1">{t('quiz-select-subject-hint')}</Typography>
                    </Card>
                ) : (
                    <UIStream
                        initialData={null}
                        stream={bloc.getStream('lessons')}
                        builder={(snapshot) => {
                            const lessons: QuizLesson[] = snapshot.data ?? [];
                            return (
                                <>
                                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography variant="h6" fontWeight={700}>
                                                {t('quiz-lessons-of', { subject: selectedSubject.name })}
                                            </Typography>
                                            <Button variant="contained" startIcon={<AddOutlined />} onClick={openNewLesson}>{t('new')}</Button>
                                        </Stack>
                                        <Box sx={{ height: 380 }}>
                                            <DataGrid
                                                rows={lessons}
                                                columns={lessonColumns}
                                                loading={snapshot.data == null}
                                                disableRowSelectionOnClick
                                            />
                                        </Box>
                                    </Card>

                                    <Dialog open={lessonForm != null} onClose={closeLessonForm} maxWidth="xs" fullWidth>
                                        <DialogTitle>{(lessonForm?.id ?? 0) > 0 ? t('quiz-lesson-edit') : t('quiz-lesson-new')}</DialogTitle>
                                        <DialogContent>
                                            <TextField
                                                label={t('quiz-lesson-name')}
                                                value={lessonForm?.name ?? ''}
                                                onChange={(e) => setLessonForm((s) => s && { ...s, name: e.target.value })}
                                                autoFocus
                                                fullWidth
                                                sx={{ mt: 1 }}
                                            />
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={closeLessonForm}>{t('cancel')}</Button>
                                            <Button variant="contained" disabled={submitting || !lessonForm?.name} onClick={saveLesson}>{t('save')}</Button>
                                        </DialogActions>
                                    </Dialog>
                                </>
                            );
                        }}
                    />
                )}
            </Grid>
        </Grid>
    );
}
