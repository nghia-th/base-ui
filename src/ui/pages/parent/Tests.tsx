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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentTests, QuizTest, QuizStudentLite } from "../../bloc/BlocParentTests";
import { QuizTestCreateRequest, QuizPracticeGenerateRequest } from "../../../api/QuizTestApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

const STATUS_COLOR: Record<string, 'warning' | 'success'> = {
    ASSIGNED: 'warning',
    COMPLETED: 'success'
};

const TEST_TYPE_COLOR: Record<string, 'default' | 'info'> = {
    REGULAR: 'default',
    PRACTICE: 'info'
};

// Trang "Đề kiểm tra" (khu vực Phụ huynh, /app/parent/tests - Task 5 backend). Tạo đề = giao đề
// luôn (không có bước giao riêng, xem TestApi.java) - chọn Học sinh + đặt tên + chọn câu hỏi từ
// 1 Bài học (Môn học -> Bài học -> tick chọn câu hỏi, đơn giản hoá so với backend thực ra cho phép
// trộn câu hỏi từ nhiều bài học khác nhau trong 1 đề - đủ dùng cho v1, xem ui-base-status.md).
//
// KHÔNG còn bước "Chọn Lớp" riêng (bỏ theo góp ý anh 2026-09-01: "chỉ cần chọn học sinh không cần
// chọn lớp bởi vì học sinh đã gán với lớp") - chọn Học sinh xong tự suy ra Lớp của học sinh đó
// (đã có sẵn classroomId trong QuizStudentLite) để tải Môn học đúng lớp, xem onFormStudentChange.
export default function Tests() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentTests);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const [filterStudentId, setFilterStudentId] = useState<number | ''>('');
    const [createOpen, setCreateOpen] = useState(false);
    const [detail, setDetail] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formStudentId, setFormStudentId] = useState<number | ''>('');
    const [formName, setFormName] = useState('');
    const [formSubjectId, setFormSubjectId] = useState<number | ''>('');
    const [formLessonId, setFormLessonId] = useState<number | ''>('');
    const [formQuestionIds, setFormQuestionIds] = useState<number[]>([]);

    // Dialog "Tạo đề ôn tập" riêng (2026-09-01) - tách khỏi dialog "Tạo đề kiểm tra" ở trên vì
    // luồng đơn giản hơn nhiều (không có Bài học/tick từng câu hỏi - server tự random cả Môn),
    // vẫn dùng lại đúng stream 'subjects' + bloc.loadSubjects(classroomId) đã có sẵn.
    const [practiceOpen, setPracticeOpen] = useState(false);
    const [practiceSubmitting, setPracticeSubmitting] = useState(false);
    const [pStudentId, setPStudentId] = useState<number | ''>('');
    const [pSubjectId, setPSubjectId] = useState<number | ''>('');
    const [pName, setPName] = useState('');
    const [pQuestionCount, setPQuestionCount] = useState('');

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onFilterChange = (value: number | '') => {
        setFilterStudentId(value);
        bloc.reloadTests(value === '' ? undefined : value);
    };

    const resetCreateForm = () => {
        setFormStudentId(''); setFormName(''); setFormSubjectId(''); setFormLessonId(''); setFormQuestionIds([]);
    };
    const openCreate = () => { resetCreateForm(); setCreateOpen(true); };
    const closeCreate = () => { setCreateOpen(false); setSubmitting(false); };

    // Chọn Học sinh là bước đầu tiên khi tạo đề - tự suy ra classroomId của học sinh đó (đã có sẵn
    // trong QuizStudentLite, không cần chọn Lớp riêng nữa - bỏ theo góp ý anh 2026-09-01) để tải
    // đúng Môn học của lớp đó ngay. Đổi Học sinh thì Môn học/Bài học/Câu hỏi cũ (nếu có, thuộc lớp
    // của học sinh trước) không còn hợp lệ nữa nên reset hết, giống hệt cách onFormSubjectChange
    // reset formLessonId bên dưới.
    const onFormStudentChange = (value: number | '', students: QuizStudentLite[]) => {
        setFormStudentId(value);
        setFormSubjectId(''); setFormLessonId(''); setFormQuestionIds([]);
        const classroomId = value === '' ? undefined : students.find((s) => s.id === value)?.classroomId;
        if (classroomId != null) bloc.loadSubjects(classroomId);
    };

    const onFormSubjectChange = (value: number) => {
        setFormSubjectId(value);
        setFormLessonId('');
        setFormQuestionIds([]);
        bloc.loadLessons(value);
    };
    const onFormLessonChange = (value: number) => {
        setFormLessonId(value);
        setFormQuestionIds([]);
        bloc.loadQuestions(value);
    };
    const toggleQuestion = (id: number) => {
        setFormQuestionIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    };

    const isCreateValid = formStudentId !== '' && formName.trim() !== '' && formQuestionIds.length > 0;

    const submitCreate = () => {
        if (!isCreateValid || typeof formStudentId !== 'number') return;
        setSubmitting(true);
        const request: QuizTestCreateRequest = { studentId: formStudentId, name: formName, questionIds: formQuestionIds };
        bloc.create(request, () => {
            enqueueSnackbar(t('quiz-test-created') as string, { variant: 'success' });
            closeCreate();
        }, (error) => { setSubmitting(false); showError(error); });
    };

    // Chọn Học sinh trong dialog "Tạo đề ôn tập" - giống hệt onFormStudentChange nhưng cho state
    // riêng (pStudentId/pSubjectId), dùng CHUNG stream 'subjects' của bloc (chỉ 1 trong 2 dialog
    // mở tại 1 thời điểm nên không xung đột).
    const onPracticeStudentChange = (value: number | '', students: QuizStudentLite[]) => {
        setPStudentId(value);
        setPSubjectId('');
        const classroomId = value === '' ? undefined : students.find((s) => s.id === value)?.classroomId;
        if (classroomId != null) bloc.loadSubjects(classroomId);
    };

    const resetPracticeForm = () => {
        setPStudentId(''); setPSubjectId(''); setPName(''); setPQuestionCount('');
    };
    const openPractice = () => { resetPracticeForm(); setPracticeOpen(true); };
    const closePractice = () => { setPracticeOpen(false); setPracticeSubmitting(false); };

    const isPracticeValid = pStudentId !== '' && pSubjectId !== '';

    const submitPractice = () => {
        if (!isPracticeValid || typeof pStudentId !== 'number' || typeof pSubjectId !== 'number') return;
        setPracticeSubmitting(true);
        const request: QuizPracticeGenerateRequest = {
            studentId: pStudentId,
            subjectId: pSubjectId,
            name: pName.trim() === '' ? undefined : pName,
            questionCount: pQuestionCount.trim() === '' ? undefined : Number(pQuestionCount)
        };
        bloc.generatePractice(request, () => {
            enqueueSnackbar(t('quiz-practice-test-created') as string, { variant: 'success' });
            closePractice();
        }, (error) => { setPracticeSubmitting(false); showError(error); });
    };

    const askRemove = (row: QuizTest) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-test-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-test-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const viewDetail = (row: QuizTest) => {
        bloc.loadDetail(row.id, (d) => setDetail(d), showError);
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'name', headerName: t('quiz-test-name') as string, flex: 1, minWidth: 180 },
        {
            field: 'studentId', headerName: t('quiz-students') as string, width: 160,
            // @mui/x-data-grid v7: valueGetter nhận thẳng (value, row, ...), KHÔNG phải object
            // params như v5/v6 - value ở đây chính là studentId (giá trị field gốc của cột này).
            valueGetter: (value: number) => {
                const students: QuizStudentLite[] = bloc.getField('students') ?? [];
                return students.find((s) => s.id === value)?.fullName ?? '—';
            }
        },
        {
            field: 'status', headerName: t('status') as string, width: 140,
            renderCell: (params) => (
                <Chip size="small" label={t(`quiz-test-status-${params.value}`)} color={STATUS_COLOR[params.value] ?? 'default'} />
            )
        },
        {
            field: 'testType', headerName: t('quiz-test-type') as string, width: 140,
            renderCell: (params) => (
                <Chip size="small" label={t(`quiz-test-type-${params.value}`)} color={TEST_TYPE_COLOR[params.value] ?? 'default'} />
            )
        },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<VisibilityOutlined fontSize="small" />} label="view" onClick={() => viewDetail(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    return (
        <Stack spacing={2}>
            <UIStream
                initialData={null}
                stream={bloc.getStream('students')}
                builder={(studentsSnap) => {
                    const students: QuizStudentLite[] = studentsSnap.data ?? [];
                    return (
                        <>
                            <Card sx={{ p: 2 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                    <FormControl size="small" sx={{ minWidth: 220 }}>
                                        <InputLabel>{t('quiz-filter-by-student')}</InputLabel>
                                        <Select
                                            label={t('quiz-filter-by-student')}
                                            value={filterStudentId}
                                            onChange={(e) => onFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
                                        >
                                            <MenuItem value="">{t('quiz-all-students')}</MenuItem>
                                            {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="outlined" startIcon={<AutorenewOutlined />} onClick={openPractice}>{t('quiz-practice-test-new')}</Button>
                                        <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>{t('quiz-test-new')}</Button>
                                    </Stack>
                                </Stack>
                            </Card>

                            <UIStream
                                initialData={null}
                                stream={bloc.getStream('tests')}
                                builder={(testsSnap) => (
                                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Box sx={{ height: 420 }}>
                                            <DataGrid
                                                rows={testsSnap.data ?? []}
                                                columns={columns}
                                                loading={testsSnap.data == null}
                                                disableRowSelectionOnClick
                                            />
                                        </Box>
                                    </Card>
                                )}
                            />

                            <Dialog open={createOpen} onClose={closeCreate} maxWidth="sm" fullWidth>
                                <DialogTitle>{t('quiz-test-new')}</DialogTitle>
                                <DialogContent>
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>{t('quiz-select-student')}</InputLabel>
                                            <Select
                                                label={t('quiz-select-student')}
                                                value={formStudentId}
                                                onChange={(e) => onFormStudentChange(e.target.value === '' ? '' : Number(e.target.value), students)}
                                            >
                                                {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label={t('quiz-test-name')}
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            fullWidth
                                        />
                                        <UIStream
                                            initialData={bloc.getField('subjects')}
                                            stream={bloc.getStream('subjects')}
                                            builder={(subjectsSnap) => (
                                                <FormControl fullWidth size="small" disabled={formStudentId === ''}>
                                                    <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                                    <Select
                                                        label={t('quiz-select-subject')}
                                                        value={formSubjectId}
                                                        onChange={(e) => onFormSubjectChange(Number(e.target.value))}
                                                    >
                                                        {(subjectsSnap.data ?? []).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                        <UIStream
                                            initialData={bloc.getField('lessons')}
                                            stream={bloc.getStream('lessons')}
                                            builder={(lessonsSnap) => (
                                                <FormControl fullWidth size="small" disabled={formSubjectId === ''}>
                                                    <InputLabel>{t('quiz-select-lesson')}</InputLabel>
                                                    <Select
                                                        label={t('quiz-select-lesson')}
                                                        value={formLessonId}
                                                        onChange={(e) => onFormLessonChange(Number(e.target.value))}
                                                    >
                                                        {(lessonsSnap.data ?? []).map((l: any) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                        {formLessonId !== '' && (
                                            <UIStream
                                                initialData={bloc.getField('questions')}
                                                stream={bloc.getStream('questions')}
                                                builder={(questionsSnap) => {
                                                    const questions: any[] = questionsSnap.data ?? [];
                                                    return (
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                                                {t('quiz-select-questions-count', { count: formQuestionIds.length })}
                                                            </Typography>
                                                            <Stack sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                                                {questions.map((q) => (
                                                                    <FormControlLabel
                                                                        key={q.id}
                                                                        control={<Checkbox checked={formQuestionIds.includes(q.id)} onChange={() => toggleQuestion(q.id)} />}
                                                                        label={q.content}
                                                                    />
                                                                ))}
                                                                {questions.length === 0 && questionsSnap.data != null && (
                                                                    <Typography variant="body2" color="text.secondary">{t('quiz-no-questions')}</Typography>
                                                                )}
                                                            </Stack>
                                                        </Box>
                                                    );
                                                }}
                                            />
                                        )}
                                    </Stack>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={closeCreate}>{t('cancel')}</Button>
                                    <Button variant="contained" disabled={submitting || !isCreateValid} onClick={submitCreate}>{t('quiz-assign-test')}</Button>
                                </DialogActions>
                            </Dialog>

                            {/* Dialog "Tạo đề ôn tập" (2026-09-01) - chọn Học sinh + Môn học là đủ, không có
                                bước Bài học/tick câu hỏi (server tự random toàn bộ câu hỏi của Môn, xem
                                TestService#generatePractice). Số câu để trống = server tự lấy mặc định 10. */}
                            <Dialog open={practiceOpen} onClose={closePractice} maxWidth="sm" fullWidth>
                                <DialogTitle>{t('quiz-practice-test-new')}</DialogTitle>
                                <DialogContent>
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.secondary">{t('quiz-practice-test-hint')}</Typography>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>{t('quiz-select-student')}</InputLabel>
                                            <Select
                                                label={t('quiz-select-student')}
                                                value={pStudentId}
                                                onChange={(e) => onPracticeStudentChange(e.target.value === '' ? '' : Number(e.target.value), students)}
                                            >
                                                {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <UIStream
                                            initialData={bloc.getField('subjects')}
                                            stream={bloc.getStream('subjects')}
                                            builder={(subjectsSnap) => (
                                                <FormControl fullWidth size="small" disabled={pStudentId === ''}>
                                                    <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                                    <Select
                                                        label={t('quiz-select-subject')}
                                                        value={pSubjectId}
                                                        onChange={(e) => setPSubjectId(Number(e.target.value))}
                                                    >
                                                        {(subjectsSnap.data ?? []).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                        <TextField
                                            label={t('quiz-test-name-optional')}
                                            value={pName}
                                            onChange={(e) => setPName(e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label={t('quiz-practice-question-count')}
                                            value={pQuestionCount}
                                            onChange={(e) => setPQuestionCount(e.target.value.replace(/[^0-9]/g, ''))}
                                            helperText={t('quiz-practice-question-count-hint')}
                                            fullWidth
                                        />
                                    </Stack>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={closePractice}>{t('cancel')}</Button>
                                    <Button variant="contained" disabled={practiceSubmitting || !isPracticeValid} onClick={submitPractice}>{t('quiz-practice-generate')}</Button>
                                </DialogActions>
                            </Dialog>

                            <Dialog open={detail != null} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
                                <DialogTitle>{detail?.name}</DialogTitle>
                                <DialogContent>
                                    <Stack spacing={1.5}>
                                        {(detail?.questions ?? []).map((q: any, i: number) => (
                                            <Box key={q.id}>
                                                <Typography variant="body2" fontWeight={700}>{i + 1}. {q.content}</Typography>
                                                <Stack sx={{ pl: 2 }}>
                                                    {q.choices.map((c: any) => (
                                                        <Stack key={c.id} direction="row" alignItems="center" spacing={1}>
                                                            {c.correct ? <CheckCircleOutlined color="success" fontSize="small" /> : <Box sx={{ width: 20 }} />}
                                                            <Typography variant="body2" color={c.correct ? 'success.main' : 'text.secondary'}>{c.content}</Typography>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setDetail(null)}>{t('close')}</Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    );
                }}
            />
        </Stack>
    );
}
