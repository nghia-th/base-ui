import React, { useContext, useEffect, useRef, useState } from "react";
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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Radio from "@mui/material/Radio";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentQuestions, QuizQuestion, QuizImportResult } from "../../bloc/BlocParentQuestions";
import { QuizQuestionRequest } from "../../../api/QuizQuestionApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

interface ChoiceFormState {
    content: string;
    correct: boolean;
}

interface QuestionFormState {
    id: number;
    content: string;
    knowledgeTag: string;
    choices: ChoiceFormState[];
}

const EMPTY_CHOICE: ChoiceFormState = { content: '', correct: false };
const emptyForm = (): QuestionFormState => ({ id: 0, content: '', knowledgeTag: '', choices: [{ ...EMPTY_CHOICE }, { ...EMPTY_CHOICE }] });

// Trang "Ngân hàng câu hỏi" (khu vực Phụ huynh, /app/parent/questions - Task 4 backend, mở rộng
// 2026-09-01). Chọn Lớp học -> Môn học -> Bài học (3 Select phụ thuộc, cùng cascade-clear-tầng-con
// pattern với Tests.tsx) trước khi hiện/thao tác Question của bài học đó, vì QuestionApi.java's
// list() bắt buộc lessonId. Thêm/sửa câu hỏi qua Dialog với danh sách lựa chọn động (thêm/bớt
// dòng, radio chọn đáp án đúng - chỉ 1 lựa chọn được đúng tại 1 thời điểm). Ngoài nhập tay còn có
// nhập từ file Excel/CSV (tải mẫu -> điền -> upload, best-effort theo từng dòng).
export default function Questions() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentQuestions);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const [classroomId, setClassroomId] = useState<number | ''>('');
    const [subjectId, setSubjectId] = useState<number | ''>('');
    const [lessonId, setLessonId] = useState<number | ''>('');
    const [form, setForm] = useState<QuestionFormState | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<QuizImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Đổi Lớp -> chỉ tải lại Môn học theo đúng lớp đó, tự bỏ chọn Môn/Bài (không còn hợp lệ nữa) -
    // cùng quy tắc "đổi tầng cha thì xoá mọi tầng con, chỉ tải lại đúng 1 tầng kế tiếp" đã dùng ở
    // Tests.tsx's onFormClassroomChange/onFormSubjectChange (xem BlocParentTests.ts).
    const onClassroomChange = (value: number | '') => {
        setClassroomId(value);
        setSubjectId('');
        setLessonId('');
        bloc.loadSubjects(value === '' ? undefined : value);
    };
    const onSubjectChange = (value: number) => {
        setSubjectId(value);
        setLessonId('');
        bloc.loadLessons(value);
    };
    const onLessonChange = (value: number) => {
        setLessonId(value);
        bloc.loadQuestions(value);
    };

    const openNew = () => setForm(emptyForm());
    const openEdit = (q: QuizQuestion) => setForm({
        id: q.id, content: q.content, knowledgeTag: q.knowledgeTag ?? '',
        choices: q.choices.map((c) => ({ content: c.content, correct: c.correct }))
    });
    const closeForm = () => { setForm(null); setSubmitting(false); };

    const setChoiceContent = (index: number, content: string) =>
        setForm((s) => s && { ...s, choices: s.choices.map((c, i) => (i === index ? { ...c, content } : c)) });
    const setChoiceCorrect = (index: number) =>
        setForm((s) => s && { ...s, choices: s.choices.map((c, i) => ({ ...c, correct: i === index })) });
    const addChoice = () => setForm((s) => s && { ...s, choices: [...s.choices, { ...EMPTY_CHOICE }] });
    const removeChoice = (index: number) => setForm((s) => s && { ...s, choices: s.choices.filter((_, i) => i !== index) });

    const isFormValid = !!form && form.content.trim() !== '' && form.choices.length >= 2 &&
        form.choices.every((c) => c.content.trim() !== '') && form.choices.some((c) => c.correct);

    const save = () => {
        if (!form || typeof lessonId !== 'number' || !isFormValid) return;
        setSubmitting(true);
        const request: QuizQuestionRequest = {
            lessonId,
            content: form.content,
            knowledgeTag: form.knowledgeTag || undefined,
            choices: form.choices.map((c) => ({ content: c.content, correct: c.correct }))
        };
        const onComplete = () => {
            enqueueSnackbar(t(form.id > 0 ? 'quiz-question-updated' : 'quiz-question-created') as string, { variant: 'success' });
            closeForm();
        };
        const onError = (error: any) => { setSubmitting(false); showError(error); };
        if (form.id > 0) bloc.update(form.id, request, onComplete, onError);
        else bloc.create(request, onComplete, onError);
    };

    const askRemove = (q: QuizQuestion) => {
        if (typeof lessonId !== 'number') return;
        bloc.confirm({
            title: 'delete',
            message: 'quiz-delete-question-confirm',
            onYes: () => {
                bloc.remove(q.id, lessonId, () => {
                    enqueueSnackbar(t('quiz-question-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const download = (format: 'xlsx' | 'csv') => bloc.downloadTemplate(format, showError);

    const openImport = () => { setImportResult(null); setImportOpen(true); };
    const closeImport = () => { setImportOpen(false); setImporting(false); setImportResult(null); };
    const onImportFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || typeof lessonId !== 'number') return;
        setImporting(true);
        bloc.importFile(lessonId, file, (result) => {
            setImporting(false);
            setImportResult(result);
        }, (error) => { setImporting(false); showError(error); });
    };

    return (
        <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <UIStream
                            initialData={null}
                            stream={bloc.getStream('classrooms')}
                            builder={(snapshot) => (
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('quiz-select-classroom')}</InputLabel>
                                    <Select
                                        label={t('quiz-select-classroom')}
                                        value={classroomId}
                                        onChange={(e) => onClassroomChange(e.target.value === '' ? '' : Number(e.target.value))}
                                    >
                                        <MenuItem value="">{t('quiz-all-classrooms')}</MenuItem>
                                        {(snapshot.data ?? []).map((c: any) => (
                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <UIStream
                            initialData={null}
                            stream={bloc.getStream('subjects')}
                            builder={(snapshot) => (
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                    <Select
                                        label={t('quiz-select-subject')}
                                        value={subjectId}
                                        onChange={(e) => onSubjectChange(Number(e.target.value))}
                                    >
                                        {(snapshot.data ?? []).map((s: any) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <UIStream
                            initialData={null}
                            stream={bloc.getStream('lessons')}
                            builder={(snapshot) => (
                                <FormControl fullWidth size="small" disabled={subjectId === ''}>
                                    <InputLabel>{t('quiz-select-lesson')}</InputLabel>
                                    <Select
                                        label={t('quiz-select-lesson')}
                                        value={lessonId}
                                        onChange={(e) => onLessonChange(Number(e.target.value))}
                                    >
                                        {(snapshot.data ?? []).map((l: any) => (
                                            <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>
                </Grid>
            </Card>

            {lessonId === '' ? (
                <Card sx={{
                    p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: 200, color: 'text.secondary'
                }}>
                    <HelpOutlineOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body1">{t('quiz-select-lesson-hint')}</Typography>
                </Card>
            ) : (
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('questions')}
                    builder={(snapshot) => {
                        const questions: QuizQuestion[] = snapshot.data ?? [];
                        return (
                            <>
                                <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                        <Typography variant="h6" fontWeight={700}>{t('quiz-questions')}</Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Button size="small" startIcon={<DownloadOutlined />} onClick={() => download('xlsx')}>{t('quiz-download-template-xlsx')}</Button>
                                            <Button size="small" startIcon={<DownloadOutlined />} onClick={() => download('csv')}>{t('quiz-download-template-csv')}</Button>
                                            <Button size="small" variant="outlined" startIcon={<UploadFileOutlined />} onClick={openImport}>{t('quiz-import-questions')}</Button>
                                            <Button variant="contained" startIcon={<AddOutlined />} onClick={openNew}>{t('new')}</Button>
                                        </Stack>
                                    </Stack>

                                    {questions.length === 0 && snapshot.data != null && (
                                        <Typography variant="body2" color="text.secondary">{t('quiz-no-questions')}</Typography>
                                    )}

                                    {questions.map((q, qi) => (
                                        <Accordion key={q.id} disableGutters>
                                            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', pr: 1 }}>
                                                    <Typography sx={{ flexGrow: 1 }}>{qi + 1}. {q.content}</Typography>
                                                    {q.knowledgeTag && <Chip size="small" label={q.knowledgeTag} />}
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(q); }}>
                                                        <EditOutlined fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); askRemove(q); }}>
                                                        <DeleteOutlined fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Stack spacing={0.5} sx={{ mb: 1 }}>
                                                    {q.choices.map((c) => (
                                                        <Stack key={c.id} direction="row" alignItems="center" spacing={1}>
                                                            {c.correct ? <CheckCircleOutlined color="success" fontSize="small" /> : <Box sx={{ width: 20 }} />}
                                                            <Typography variant="body2" color={c.correct ? 'success.main' : 'text.primary'} fontWeight={c.correct ? 700 : 400}>
                                                                {c.content}
                                                            </Typography>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Card>

                                <Dialog open={form != null} onClose={closeForm} maxWidth="sm" fullWidth>
                                    <DialogTitle>{(form?.id ?? 0) > 0 ? t('quiz-question-edit') : t('quiz-question-new')}</DialogTitle>
                                    <DialogContent>
                                        <Stack spacing={2} sx={{ mt: 1 }}>
                                            <TextField
                                                label={t('quiz-question-content')}
                                                value={form?.content ?? ''}
                                                onChange={(e) => setForm((s) => s && { ...s, content: e.target.value })}
                                                autoFocus
                                                multiline
                                                minRows={2}
                                                fullWidth
                                            />
                                            <TextField
                                                label={t('quiz-question-knowledge-tag')}
                                                value={form?.knowledgeTag ?? ''}
                                                onChange={(e) => setForm((s) => s && { ...s, knowledgeTag: e.target.value })}
                                                fullWidth
                                            />
                                            <Typography variant="subtitle2">{t('quiz-question-choices')}</Typography>
                                            <Stack spacing={1}>
                                                {form?.choices.map((c, i) => (
                                                    <Stack key={i} direction="row" alignItems="center" spacing={1}>
                                                        <Radio
                                                            checked={c.correct}
                                                            onChange={() => setChoiceCorrect(i)}
                                                            title={t('quiz-correct-answer') as string}
                                                        />
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            placeholder={`${t('quiz-question-choices')} ${i + 1}`}
                                                            value={c.content}
                                                            onChange={(e) => setChoiceContent(i, e.target.value)}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            disabled={(form?.choices.length ?? 0) <= 2}
                                                            onClick={() => removeChoice(i)}
                                                        >
                                                            <CloseOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                            <Button size="small" startIcon={<AddOutlined />} onClick={addChoice} sx={{ alignSelf: 'flex-start' }}>
                                                {t('quiz-add-choice')}
                                            </Button>
                                        </Stack>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={closeForm}>{t('cancel')}</Button>
                                        <Button variant="contained" disabled={submitting || !isFormValid} onClick={save}>{t('save')}</Button>
                                    </DialogActions>
                                </Dialog>

                                <Dialog open={importOpen} onClose={closeImport} maxWidth="xs" fullWidth>
                                    <DialogTitle>{t('quiz-import-dialog-title')}</DialogTitle>
                                    <DialogContent>
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.csv" hidden onChange={onImportFileChosen} />
                                        <Stack spacing={2} sx={{ mt: 1 }} alignItems="flex-start">
                                            <Typography variant="body2" color="text.secondary">{t('quiz-import-hint')}</Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={importing ? <CircularProgress size={16} /> : <UploadFileOutlined />}
                                                disabled={importing}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {t('quiz-import-pick-file')}
                                            </Button>
                                            {importResult && (
                                                <Alert severity={importResult.errors.length === 0 ? 'success' : 'warning'} sx={{ width: '100%' }}>
                                                    {t('quiz-import-result-summary', { success: importResult.successCount, total: importResult.totalRows })}
                                                    {importResult.errors.length > 0 && (
                                                        <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                                                            {importResult.errors.map((err, i) => (
                                                                <li key={i}>
                                                                    <Typography variant="body2">
                                                                        {t('quiz-import-row-error', { row: err.rowNumber, reason: err.reason })}
                                                                    </Typography>
                                                                </li>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Alert>
                                            )}
                                        </Stack>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={closeImport}>{t('close')}</Button>
                                    </DialogActions>
                                </Dialog>
                            </>
                        );
                    }}
                />
            )}
        </Stack>
    );
}
