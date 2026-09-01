import React, { useContext, useEffect } from "react";
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
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentSubjects, QuizSubject, QuizLesson, QuizClassroomLite } from "../../bloc/BlocParentSubjects";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Môn học / Bài học" (khu vực Phụ huynh, /app/parent/subjects - Task 3 backend). Master-
// detail 1 màn hình: cột trái danh sách Subject (List), chọn 1 Subject thì cột phải hiện Lesson
// của Subject đó (DataGrid) - cả 2 phần dùng chung 1 Bloc (BlocParentSubjects) nhưng nhiều stream
// riêng, theo đúng lưu ý ở ui-base-status.md: Dialog phải nằm trong builder() của UIStream, không
// phải children.
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") - TOÀN BỘ
// useState cũ (filterClassroomId/selectedSubject/subjectForm/lessonForm/submitting/ảnh...) dời
// vào BlocParentSubjects, xem comment "State giao diện dời từ useState vào đây" ở đó cho chi tiết
// từng stream. selectedSubject bọc UIStream NGOÀI CÙNG (cả 2 cột trái/phải đều phụ thuộc), các
// Dialog + field cần phản ứng live (Select) bọc UIStream hẹp riêng, TextField thường uncontrolled.
export default function Subjects() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentSubjects);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveSubject = () => {
        bloc.saveSubject(() => bloc.closeSubjectForm(), showError);
    };

    const askRemoveSubject = (subject: QuizSubject) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-subject-confirm',
            onYes: () => {
                bloc.removeSubject(subject.id, () => {
                    enqueueSnackbar(t('quiz-subject-deleted') as string, { variant: 'success' });
                    bloc.askRemoveSubjectCleanup(subject.id);
                }, showError);
            }
        });
    };

    const saveLesson = (subjectId: number) => {
        bloc.saveLesson(subjectId, () => bloc.closeLessonForm(), showError);
    };

    const onImageFileSelected = (subjectId: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        bloc.uploadImageForCurrentLesson(subjectId, file, showError);
    };

    const removeLessonImage = (subjectId: number) => {
        bloc.removeImageForCurrentLesson(subjectId, showError);
    };

    const askRemoveLesson = (lesson: QuizLesson, subjectId: number) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-lesson-confirm',
            onYes: () => {
                bloc.removeLesson(lesson.id, subjectId, () => {
                    enqueueSnackbar(t('quiz-lesson-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const lessonColumns = (subjectId: number): GridColDef[] => [
        { field: 'name', headerName: t('quiz-lesson-name') as string, flex: 1, minWidth: 200 },
        {
            field: 'textbookPage', headerName: t('quiz-lesson-textbook-page') as string, width: 110,
            valueGetter: (_value, row) => (row as QuizLesson).textbookPage ?? ''
        },
        {
            field: 'hasImage', headerName: t('quiz-lesson-image') as string, width: 80, sortable: false,
            renderCell: (params) => (params.row as QuizLesson).hasImage
                ? <CheckCircleOutlined fontSize="small" color="success" />
                : null
        },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => bloc.openEditLesson(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemoveLesson(params.row, subjectId)} />
            ]
        }
    ];

    return (
        <UIStream
            initialData={bloc.getField('selectedSubject') ?? null}
            stream={bloc.getStream('selectedSubject')}
            builder={(selectedSnap) => {
                const selectedSubject: QuizSubject | null = selectedSnap.data ?? null;
                // KHÔNG dùng useMemo ở đây - đây là closure builder() của UIStream, được gọi từ
                // render() của 1 class component (UIStream.ts), không phải function component nên
                // không được gọi hook (vi phạm Rules of Hooks). Mảng cột nhỏ, tạo lại mỗi lần
                // 'selectedSubject' đổi (không phải mỗi phím gõ) là chấp nhận được.
                const lessonColumnsMemo = selectedSubject ? lessonColumns(selectedSubject.id) : [];

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
                                                    <IconButton color="primary" onClick={() => bloc.openNewSubject()}><AddOutlined /></IconButton>
                                                </Stack>
                                                <UIStream
                                                    initialData={bloc.getField('classrooms')}
                                                    stream={bloc.getStream('classrooms')}
                                                    builder={(classroomsSnap) => {
                                                        // Cần classroomsSnap ở CẢ Select lọc lẫn List bên dưới (mỗi Subject hiện kèm
                                                        // tên Lớp) nên bọc chung 1 UIStream ngoài cùng thay vì lồng riêng cho Select
                                                        // như trước - lý do anh test thấy 2 môn cùng tên "Toán" không phân biệt được
                                                        // thuộc Lớp nào khi lọc "Tất cả lớp" (2026-09-01).
                                                        const classrooms: QuizClassroomLite[] = classroomsSnap.data ?? [];
                                                        const classroomName = (classroomId: number) =>
                                                            classrooms.find((c) => c.id === classroomId)?.name ?? '';
                                                        return (
                                                            <>
                                                                <UIStream
                                                                    initialData={bloc.getField('filterClassroomId') ?? ''}
                                                                    stream={bloc.getStream('filterClassroomId')}
                                                                    builder={(filterSnap) => (
                                                                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                                                            <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                                            <Select
                                                                                label={t('quiz-classrooms')}
                                                                                value={filterSnap.data ?? ''}
                                                                                onChange={(e) => bloc.changeFilterClassroom(e.target.value === '' ? '' : Number(e.target.value))}
                                                                            >
                                                                                <MenuItem value="">{t('quiz-all-classrooms')}</MenuItem>
                                                                                {classrooms.map((c: QuizClassroomLite) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                                            </Select>
                                                                        </FormControl>
                                                                    )}
                                                                />
                                                                <List disablePadding>
                                                                    {subjects.map((s) => (
                                                                        <ListItemButton
                                                                            key={s.id}
                                                                            selected={selectedSubject?.id === s.id}
                                                                            onClick={() => bloc.selectSubject(s)}
                                                                            sx={{ borderRadius: 1, mb: 0.5 }}
                                                                        >
                                                                            <ListItemText primary={s.name} secondary={classroomName(s.classroomId)} />
                                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); bloc.openEditSubject(s); }}>
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
                                                            </>
                                                        );
                                                    }}
                                                />
                                            </Card>

                                            <UIStream
                                                initialData={{ isShow: false, id: 0 }}
                                                stream={bloc.getStream('subject_form_view')}
                                                builder={(viewSnap) => {
                                                    const view = viewSnap.data ?? { isShow: false, id: 0 };
                                                    const isEditing = (view.id ?? 0) > 0;
                                                    return (
                                                        <Dialog open={view.isShow === true} onClose={() => bloc.closeSubjectForm()} maxWidth="xs" fullWidth>
                                                            <DialogTitle>{isEditing ? t('quiz-subject-edit') : t('quiz-subject-new')}</DialogTitle>
                                                            <DialogContent>
                                                                <Stack spacing={2} sx={{ mt: 1 }}>
                                                                    <UIStream
                                                                        initialData={bloc.getField('classrooms')}
                                                                        stream={bloc.getStream('classrooms')}
                                                                        builder={(classroomsSnap) => (
                                                                            <UIStream
                                                                                initialData={bloc.getField('subjectFormClassroomId', 'subjectReq') ?? ''}
                                                                                stream={bloc.getStream('subjectFormClassroomId')}
                                                                                builder={(classroomIdSnap) => (
                                                                                    <FormControl fullWidth size="small">
                                                                                        <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                                                        <Select
                                                                                            label={t('quiz-classrooms')}
                                                                                            value={classroomIdSnap.data ?? ''}
                                                                                            onChange={(e) => bloc.setStream('subjectFormClassroomId', e.target.value === '' ? '' : Number(e.target.value), 'subjectReq')}
                                                                                        >
                                                                                            {(classroomsSnap.data ?? []).map((c: QuizClassroomLite) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                                                        </Select>
                                                                                    </FormControl>
                                                                                )}
                                                                            />
                                                                        )}
                                                                    />
                                                                    <TextField
                                                                        label={t('quiz-subject-name')}
                                                                        defaultValue={bloc.getField('subjectFormName', 'subjectReq') ?? ''}
                                                                        onChange={(e) => bloc.setStream('subjectFormName', e.target.value, 'subjectReq')}
                                                                        autoFocus
                                                                        fullWidth
                                                                    />
                                                                </Stack>
                                                            </DialogContent>
                                                            <DialogActions>
                                                                <Button onClick={() => bloc.closeSubjectForm()}>{t('cancel')}</Button>
                                                                <UIStream
                                                                    initialData={false}
                                                                    stream={bloc.getStream('submitting')}
                                                                    builder={(submittingSnap) => (
                                                                        <Button variant="contained" disabled={submittingSnap.data === true} onClick={saveSubject}>{t('save')}</Button>
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
                                                        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openNewLesson()}>{t('new')}</Button>
                                                    </Stack>
                                                    <Box sx={{ height: 380 }}>
                                                        <DataGrid
                                                            rows={lessons}
                                                            columns={lessonColumnsMemo}
                                                            loading={snapshot.data == null}
                                                            disableRowSelectionOnClick
                                                        />
                                                    </Box>
                                                </Card>

                                                <UIStream
                                                    initialData={{ isShow: false, id: 0 }}
                                                    stream={bloc.getStream('lesson_form_view')}
                                                    builder={(viewSnap) => {
                                                        const view = viewSnap.data ?? { isShow: false, id: 0 };
                                                        const isEditing = (view.id ?? 0) > 0;
                                                        return (
                                                            <Dialog open={view.isShow === true} onClose={() => bloc.closeLessonForm()} maxWidth="sm" fullWidth>
                                                                <DialogTitle>{isEditing ? t('quiz-lesson-edit') : t('quiz-lesson-new')}</DialogTitle>
                                                                <DialogContent>
                                                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                                                        <TextField
                                                                            label={t('quiz-lesson-name')}
                                                                            defaultValue={bloc.getField('lessonName', 'lessonReq') ?? ''}
                                                                            onChange={(e) => bloc.setStream('lessonName', e.target.value, 'lessonReq')}
                                                                            autoFocus
                                                                            fullWidth
                                                                        />
                                                                        <TextField
                                                                            label={t('quiz-lesson-summary')}
                                                                            defaultValue={bloc.getField('lessonSummary', 'lessonReq') ?? ''}
                                                                            onChange={(e) => bloc.setStream('lessonSummary', e.target.value, 'lessonReq')}
                                                                            fullWidth
                                                                            multiline
                                                                            minRows={2}
                                                                            helperText={t('quiz-lesson-summary-hint')}
                                                                        />
                                                                        <TextField
                                                                            label={t('quiz-lesson-content')}
                                                                            defaultValue={bloc.getField('lessonContent', 'lessonReq') ?? ''}
                                                                            onChange={(e) => bloc.setStream('lessonContent', e.target.value, 'lessonReq')}
                                                                            fullWidth
                                                                            multiline
                                                                            minRows={4}
                                                                            helperText={t('quiz-lesson-content-hint')}
                                                                        />
                                                                        <TextField
                                                                            label={t('quiz-lesson-textbook-page')}
                                                                            type="number"
                                                                            defaultValue={bloc.getField('lessonTextbookPage', 'lessonReq') ?? ''}
                                                                            onChange={(e) => bloc.setStream('lessonTextbookPage', e.target.value === '' ? '' : Number(e.target.value), 'lessonReq')}
                                                                            fullWidth
                                                                            sx={{ maxWidth: 200 }}
                                                                            inputProps={{ min: 1 }}
                                                                        />

                                                                        <Box>
                                                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('quiz-lesson-image')}</Typography>
                                                                            {!isEditing ? (
                                                                                <Typography variant="body2" color="text.secondary">{t('quiz-lesson-image-save-first')}</Typography>
                                                                            ) : (
                                                                                <Stack direction="row" spacing={2} alignItems="center">
                                                                                    <UIStream
                                                                                        initialData={false}
                                                                                        stream={bloc.getStream('lessonImageLoading')}
                                                                                        builder={(loadingSnap) => (
                                                                                            loadingSnap.data === true ? (
                                                                                                <CircularProgress size={64} />
                                                                                            ) : (
                                                                                                <UIStream
                                                                                                    initialData={null}
                                                                                                    stream={bloc.getStream('lessonImagePreviewUrl')}
                                                                                                    builder={(urlSnap) => (
                                                                                                        urlSnap.data ? (
                                                                                                            <Box
                                                                                                                component="img"
                                                                                                                src={urlSnap.data}
                                                                                                                alt=""
                                                                                                                sx={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                                                                                                            />
                                                                                                        ) : (
                                                                                                            <Box sx={{
                                                                                                                width: 96, height: 96, borderRadius: 1, border: '1px dashed',
                                                                                                                borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                                                            }}>
                                                                                                                <ImageOutlined color="disabled" />
                                                                                                            </Box>
                                                                                                        )
                                                                                                    )}
                                                                                                />
                                                                                            )
                                                                                        )}
                                                                                    />
                                                                                    <Stack spacing={1}>
                                                                                        <UIStream
                                                                                            initialData={false}
                                                                                            stream={bloc.getStream('lessonImageUploading')}
                                                                                            builder={(uploadingSnap) => (
                                                                                                <Button
                                                                                                    component="label"
                                                                                                    variant="outlined"
                                                                                                    size="small"
                                                                                                    startIcon={<ImageOutlined />}
                                                                                                    disabled={uploadingSnap.data === true}
                                                                                                >
                                                                                                    {uploadingSnap.data === true ? t('quiz-lesson-image-uploading') : t('quiz-lesson-image-upload')}
                                                                                                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onImageFileSelected(selectedSubject.id)} />
                                                                                                </Button>
                                                                                            )}
                                                                                        />
                                                                                        <UIStream
                                                                                            initialData={false}
                                                                                            stream={bloc.getStream('lessonHasImage')}
                                                                                            builder={(hasImageSnap) => (
                                                                                                hasImageSnap.data === true ? (
                                                                                                    <Button color="error" size="small" onClick={() => removeLessonImage(selectedSubject.id)}>
                                                                                                        {t('quiz-lesson-image-remove')}
                                                                                                    </Button>
                                                                                                ) : null
                                                                                            )}
                                                                                        />
                                                                                    </Stack>
                                                                                </Stack>
                                                                            )}
                                                                        </Box>
                                                                    </Stack>
                                                                </DialogContent>
                                                                <DialogActions>
                                                                    <Button onClick={() => bloc.closeLessonForm()}>{t('cancel')}</Button>
                                                                    <UIStream
                                                                        initialData={false}
                                                                        stream={bloc.getStream('submitting')}
                                                                        builder={(submittingSnap) => (
                                                                            <Button variant="contained" disabled={submittingSnap.data === true} onClick={() => saveLesson(selectedSubject.id)}>{t('save')}</Button>
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
                            )}
                        </Grid>
                    </Grid>
                );
            }}
        />
    );
}
