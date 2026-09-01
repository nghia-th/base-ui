import React, { useContext, useEffect, useRef } from "react";
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
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
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
import VolumeUpOutlined from "@mui/icons-material/VolumeUpOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentQuestions, QuizQuestion, QuizImportResult } from "../../bloc/BlocParentQuestions";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Ngân hàng câu hỏi" (khu vực Phụ huynh, /app/parent/questions - Task 4 backend, mở rộng
// 2026-09-01). Chọn Lớp học -> Môn học -> Bài học (3 Select phụ thuộc, cùng cascade-clear-tầng-con
// pattern với Tests.tsx) trước khi hiện/thao tác Question của bài học đó, vì QuestionApi.java's
// list() bắt buộc lessonId. Thêm/sửa câu hỏi qua Dialog với danh sách lựa chọn động (thêm/bớt
// dòng, radio chọn đáp án đúng - chỉ 1 lựa chọn được đúng tại 1 thời điểm). Ngoài nhập tay còn có
// nhập từ file Excel/CSV (tải mẫu -> điền -> upload, best-effort theo từng dòng).
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới" +
// BlocParentQuestions.ts's comment "State giao diện dời từ useState vào đây" cho chi tiết từng
// stream) - riêng "choices" (mảng động) là ca đặc biệt: gõ NỘI DUNG 1 lựa chọn chỉ mutate trực
// tiếp phần tử mảng trong bloc (không setStream, không re-render); CHỈ khi cấu trúc đổi (thêm/bớt
// dòng, đổi đáp án đúng) mới setStream('choicesMeta', ...) để vẽ lại đúng số dòng/đáp án đang chọn.
export default function Questions() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentQuestions);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = () => {
        const lessonId = bloc.getField('filterLessonId');
        if (typeof lessonId !== 'number') return;
        bloc.saveQuestion(lessonId, () => {
            const isEditing = (bloc.getField('question_form_view')?.id ?? 0) > 0;
            enqueueSnackbar(t(isEditing ? 'quiz-question-updated' : 'quiz-question-created') as string, { variant: 'success' });
            bloc.closeQuestionForm();
        }, showError);
    };

    const askRemove = (q: QuizQuestion) => {
        const lessonId = bloc.getField('filterLessonId');
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

    const onImportFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        const lessonId = bloc.getField('filterLessonId');
        if (!file || typeof lessonId !== 'number') return;
        bloc.runImport(lessonId, file, showError);
    };

    const onAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        bloc.uploadAudioForCurrentQuestion(file, showError);
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
                                <UIStream
                                    initialData={bloc.getField('filterClassroomId') ?? ''}
                                    stream={bloc.getStream('filterClassroomId')}
                                    builder={(filterSnap) => (
                                        <FormControl fullWidth size="small">
                                            <InputLabel>{t('quiz-select-classroom')}</InputLabel>
                                            <Select
                                                label={t('quiz-select-classroom')}
                                                value={filterSnap.data ?? ''}
                                                onChange={(e) => bloc.changeFilterClassroom(e.target.value === '' ? '' : Number(e.target.value))}
                                            >
                                                <MenuItem value="">{t('quiz-all-classrooms')}</MenuItem>
                                                {(snapshot.data ?? []).map((c: any) => (
                                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <UIStream
                            initialData={null}
                            stream={bloc.getStream('subjects')}
                            builder={(snapshot) => (
                                <UIStream
                                    initialData={bloc.getField('filterSubjectId') ?? ''}
                                    stream={bloc.getStream('filterSubjectId')}
                                    builder={(filterSnap) => (
                                        <FormControl fullWidth size="small">
                                            <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                            <Select
                                                label={t('quiz-select-subject')}
                                                value={filterSnap.data ?? ''}
                                                onChange={(e) => bloc.changeFilterSubject(Number(e.target.value))}
                                            >
                                                {(snapshot.data ?? []).map((s: any) => (
                                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <UIStream
                            initialData={null}
                            stream={bloc.getStream('lessons')}
                            builder={(snapshot) => (
                                <UIStream
                                    initialData={bloc.getField('filterSubjectId') ?? ''}
                                    stream={bloc.getStream('filterSubjectId')}
                                    builder={(subjectSnap) => (
                                        <UIStream
                                            initialData={bloc.getField('filterLessonId') ?? ''}
                                            stream={bloc.getStream('filterLessonId')}
                                            builder={(filterSnap) => (
                                                <FormControl fullWidth size="small" disabled={(subjectSnap.data ?? '') === ''}>
                                                    <InputLabel>{t('quiz-select-lesson')}</InputLabel>
                                                    <Select
                                                        label={t('quiz-select-lesson')}
                                                        value={filterSnap.data ?? ''}
                                                        onChange={(e) => bloc.changeFilterLesson(Number(e.target.value))}
                                                    >
                                                        {(snapshot.data ?? []).map((l: any) => (
                                                            <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    )}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Card>

            <UIStream
                initialData={bloc.getField('filterLessonId') ?? ''}
                stream={bloc.getStream('filterLessonId')}
                builder={(lessonIdSnap) => {
                    const lessonId = lessonIdSnap.data ?? '';
                    if (lessonId === '') {
                        return (
                            <Card sx={{
                                p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', minHeight: 200, color: 'text.secondary'
                            }}>
                                <HelpOutlineOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                <Typography variant="body1">{t('quiz-select-lesson-hint')}</Typography>
                            </Card>
                        );
                    }
                    return (
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
                                                    <Button size="small" variant="outlined" startIcon={<UploadFileOutlined />} onClick={() => bloc.openImport()}>{t('quiz-import-questions')}</Button>
                                                    <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openNewQuestion()}>{t('new')}</Button>
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
                                                            {q.hasAudio && <VolumeUpOutlined fontSize="small" color="action" titleAccess={t('quiz-question-has-audio') as string} />}
                                                            {q.knowledgeTag && <Chip size="small" label={q.knowledgeTag} />}
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); bloc.openEditQuestion(q); }}>
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

                                        <UIStream
                                            initialData={{ isShow: false, id: 0 }}
                                            stream={bloc.getStream('question_form_view')}
                                            builder={(viewSnap) => {
                                                const view = viewSnap.data ?? { isShow: false, id: 0 };
                                                const isEditing = (view.id ?? 0) > 0;
                                                return (
                                                    <Dialog open={view.isShow === true} onClose={() => bloc.closeQuestionForm()} maxWidth="sm" fullWidth>
                                                        <DialogTitle>{isEditing ? t('quiz-question-edit') : t('quiz-question-new')}</DialogTitle>
                                                        <DialogContent>
                                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                                <TextField
                                                                    label={t('quiz-question-content')}
                                                                    defaultValue={bloc.getField('content', 'req') ?? ''}
                                                                    onChange={(e) => bloc.setStream('content', e.target.value, 'req')}
                                                                    autoFocus
                                                                    multiline
                                                                    minRows={2}
                                                                    fullWidth
                                                                />
                                                                <TextField
                                                                    label={t('quiz-question-knowledge-tag')}
                                                                    defaultValue={bloc.getField('knowledgeTag', 'req') ?? ''}
                                                                    onChange={(e) => bloc.setStream('knowledgeTag', e.target.value, 'req')}
                                                                    fullWidth
                                                                />
                                                                <Typography variant="subtitle2">{t('quiz-question-choices')}</Typography>
                                                                <UIStream
                                                                    initialData={bloc.getField('choicesReq') ?? []}
                                                                    stream={bloc.getStream('choicesMeta')}
                                                                    builder={(choicesSnap) => {
                                                                        const choices: { content: string; correct: boolean }[] = choicesSnap.data ?? [];
                                                                        return (
                                                                            <Stack spacing={1}>
                                                                                {choices.map((c, i) => (
                                                                                    <Stack key={i} direction="row" alignItems="center" spacing={1}>
                                                                                        <Radio
                                                                                            checked={c.correct}
                                                                                            onChange={() => bloc.setChoiceCorrect(i)}
                                                                                            title={t('quiz-correct-answer') as string}
                                                                                        />
                                                                                        <TextField
                                                                                            size="small"
                                                                                            fullWidth
                                                                                            placeholder={`${t('quiz-question-choices')} ${i + 1}`}
                                                                                            defaultValue={c.content}
                                                                                            onChange={(e) => bloc.setChoiceContent(i, e.target.value)}
                                                                                        />
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            disabled={choices.length <= 2}
                                                                                            onClick={() => bloc.removeChoice(i)}
                                                                                        >
                                                                                            <CloseOutlined fontSize="small" />
                                                                                        </IconButton>
                                                                                    </Stack>
                                                                                ))}
                                                                            </Stack>
                                                                        );
                                                                    }}
                                                                />
                                                                <Button size="small" startIcon={<AddOutlined />} onClick={() => bloc.addChoice()} sx={{ alignSelf: 'flex-start' }}>
                                                                    {t('quiz-add-choice')}
                                                                </Button>

                                                                <Box>
                                                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('quiz-question-audio')}</Typography>
                                                                    {!isEditing ? (
                                                                        <Typography variant="body2" color="text.secondary">{t('quiz-question-audio-save-first')}</Typography>
                                                                    ) : (
                                                                        <Stack spacing={1}>
                                                                            <UIStream
                                                                                initialData={false}
                                                                                stream={bloc.getStream('questionAudioLoading')}
                                                                                builder={(loadingSnap) => (
                                                                                    loadingSnap.data === true ? (
                                                                                        <CircularProgress size={32} />
                                                                                    ) : (
                                                                                        <UIStream
                                                                                            initialData={null}
                                                                                            stream={bloc.getStream('questionAudioPreviewUrl')}
                                                                                            builder={(urlSnap) => (
                                                                                                urlSnap.data ? (
                                                                                                    <Box component="audio" controls src={urlSnap.data} sx={{ height: 36, maxWidth: 320 }} />
                                                                                                ) : null
                                                                                            )}
                                                                                        />
                                                                                    )
                                                                                )}
                                                                            />
                                                                            <Stack direction="row" spacing={1}>
                                                                                <UIStream
                                                                                    initialData={false}
                                                                                    stream={bloc.getStream('questionAudioUploading')}
                                                                                    builder={(uploadingSnap) => (
                                                                                        <Button
                                                                                            component="label"
                                                                                            variant="outlined"
                                                                                            size="small"
                                                                                            startIcon={<VolumeUpOutlined />}
                                                                                            disabled={uploadingSnap.data === true}
                                                                                        >
                                                                                            {uploadingSnap.data === true ? t('quiz-question-audio-uploading') : t('quiz-question-audio-upload')}
                                                                                            <input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/ogg" hidden onChange={onAudioFileSelected} />
                                                                                        </Button>
                                                                                    )}
                                                                                />
                                                                                <UIStream
                                                                                    initialData={false}
                                                                                    stream={bloc.getStream('questionHasAudio')}
                                                                                    builder={(hasAudioSnap) => (
                                                                                        hasAudioSnap.data === true ? (
                                                                                            <Button color="error" size="small" onClick={() => bloc.removeAudioForCurrentQuestion(showError)}>
                                                                                                {t('quiz-question-audio-remove')}
                                                                                            </Button>
                                                                                        ) : null
                                                                                    )}
                                                                                />
                                                                            </Stack>
                                                                            <UIStream
                                                                                initialData={false}
                                                                                stream={bloc.getStream('questionHasAudio')}
                                                                                builder={(hasAudioSnap) => (
                                                                                    hasAudioSnap.data === true ? (
                                                                                        <UIStream
                                                                                            initialData={false}
                                                                                            stream={bloc.getStream('hideContentInTest')}
                                                                                            builder={(hideSnap) => (
                                                                                                <FormControlLabel
                                                                                                    control={<Checkbox checked={hideSnap.data === true} onChange={(e) => bloc.setStream('hideContentInTest', e.target.checked)} />}
                                                                                                    label={t('quiz-question-hide-content-in-test')}
                                                                                                />
                                                                                            )}
                                                                                        />
                                                                                    ) : null
                                                                                )}
                                                                            />
                                                                        </Stack>
                                                                    )}
                                                                </Box>
                                                            </Stack>
                                                        </DialogContent>
                                                        <DialogActions>
                                                            <Button onClick={() => bloc.closeQuestionForm()}>{t('cancel')}</Button>
                                                            <UIStream
                                                                initialData={false}
                                                                stream={bloc.getStream('submitting')}
                                                                builder={(submittingSnap) => (
                                                                    <Button variant="contained" disabled={submittingSnap.data === true} onClick={save}>{t('save')}</Button>
                                                                )}
                                                            />
                                                        </DialogActions>
                                                    </Dialog>
                                                );
                                            }}
                                        />

                                        <UIStream
                                            initialData={{ isShow: false }}
                                            stream={bloc.getStream('import_view')}
                                            builder={(viewSnap) => {
                                                const view = viewSnap.data ?? { isShow: false };
                                                return (
                                                    <Dialog open={view.isShow === true} onClose={() => bloc.closeImport()} maxWidth="xs" fullWidth>
                                                        <DialogTitle>{t('quiz-import-dialog-title')}</DialogTitle>
                                                        <DialogContent>
                                                            <input ref={fileInputRef} type="file" accept=".xlsx,.csv" hidden onChange={onImportFileChosen} />
                                                            <Stack spacing={2} sx={{ mt: 1 }} alignItems="flex-start">
                                                                <Typography variant="body2" color="text.secondary">{t('quiz-import-hint')}</Typography>
                                                                <UIStream
                                                                    initialData={false}
                                                                    stream={bloc.getStream('importing')}
                                                                    builder={(importingSnap) => (
                                                                        <Button
                                                                            variant="outlined"
                                                                            startIcon={importingSnap.data === true ? <CircularProgress size={16} /> : <UploadFileOutlined />}
                                                                            disabled={importingSnap.data === true}
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                        >
                                                                            {t('quiz-import-pick-file')}
                                                                        </Button>
                                                                    )}
                                                                />
                                                                <UIStream
                                                                    initialData={null}
                                                                    stream={bloc.getStream('importResult')}
                                                                    builder={(resultSnap) => {
                                                                        const importResult: QuizImportResult | null = resultSnap.data;
                                                                        if (!importResult) return null;
                                                                        return (
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
                                                                        );
                                                                    }}
                                                                />
                                                            </Stack>
                                                        </DialogContent>
                                                        <DialogActions>
                                                            <Button onClick={() => bloc.closeImport()}>{t('close')}</Button>
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
                }}
            />
        </Stack>
    );
}
