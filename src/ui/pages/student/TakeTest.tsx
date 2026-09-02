import React, { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import VolumeUpOutlined from "@mui/icons-material/VolumeUpOutlined";
import MicOutlined from "@mui/icons-material/MicOutlined";
import StopCircleOutlined from "@mui/icons-material/StopCircleOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentAttempt, QuizStudentQuestion } from "../../bloc/BlocStudentAttempt";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Làm bài" (khu vực Học sinh, /app/student/tests/:testId/take - Task 6 backend). Vào trang
// tự start/resume attempt (idempotent bên backend). Chọn đáp án lưu ngay (progressive save qua
// BlocStudentAttempt.saveAnswer, không chờ nộp bài mới lưu) - học sinh thoát giữa chừng rồi quay
// lại làm tiếp cũng không mất đáp án đã chọn. Nộp bài xong hiện luôn điểm số (đây là LẦN DUY NHẤT
// học sinh thấy điểm - backend task 6 không có endpoint xem lại kết quả sau đó, xem Tests.tsx).
//
// "Xem lại bài học" (task 2026-09-01): CÙNG 1 trang này phục vụ cả lúc đang làm bài lẫn sau khi đã
// nộp (không có trang kết quả riêng, xem đoạn trên) - danh sách câu hỏi vẫn hiện dưới điểm số sau
// khi nộp (radio chuyển disabled, chỉ xem lại lựa chọn cũ, không có trang "review" khác). Mỗi câu
// hỏi có nút mở Dialog xem nội dung Bài học nó thuộc về (StudentLessonApi.java qua
// BlocStudentAttempt.loadLesson/loadLessonImage) - dùng chung 1 Dialog cho cả 2 giai đoạn.
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") - toàn bộ
// useState cục bộ trước đây (attemptId/questions/answers/submitting/result + state Dialog xem lại
// bài học) dời vào BlocStudentAttempt, xem comment ở đó. Trang này không có ô nhập liệu tự do nào
// (chỉ chọn Radio) nên không có nguy cơ giật khi gõ như các trang khác - đổi ở đây thuần để thống
// nhất 1 cách quản lý state duy nhất trong toàn app.
export default function TakeTest() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { testId } = useParams<{ testId: string }>();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentAttempt);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    useEffect(() => {
        const id = Number(testId);
        if (!id) return;
        bloc.startAttempt(id, (error) => {
            showError(error);
            navigate('/app/student/tests', { replace: true });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testId]);

    const chooseAnswer = (questionId: number, choiceId: number) => bloc.chooseAnswer(questionId, choiceId, showError);
    const askSubmit = () => bloc.doSubmit(showError);
    const openLessonDialog = (lessonId: number) => bloc.openLessonDialog(lessonId, showError);
    const playQuestionAudio = (questionId: number) => bloc.loadQuestionAudio(questionId, showError);
    const startRecording = (questionId: number) => bloc.startRecording(questionId, showError);
    // Read attemptId at call time. TakeTest doesn't subscribe to the attemptId stream, so it never
    // re-renders after startAttempt sets it - a top-level const would stay stale (null) and silently
    // block stop/delete/save. Reading inside each handler always sees the current value.
    const stopRecording = (questionId: number) => {
        const attemptId: number | null = bloc.getField('attemptId') ?? null;
        if (attemptId != null) bloc.stopRecording(attemptId, questionId, showError);
    };
    const deleteSpeakingAnswer = (questionId: number) => {
        const attemptId: number | null = bloc.getField('attemptId') ?? null;
        if (attemptId != null) bloc.deleteSpeakingAnswer(attemptId, questionId, showError);
    };
    const saveSpeakingText = (questionId: number, text: string) => {
        const attemptId: number | null = bloc.getField('attemptId') ?? null;
        if (attemptId != null) bloc.saveSpeakingTextAnswer(attemptId, questionId, text, showError);
    };

    return (
        <UIStream
            initialData={bloc.getField('questions') ?? null}
            stream={bloc.getStream('questions')}
            builder={(qSnap) => {
                const questions: QuizStudentQuestion[] | null = qSnap.data;
                if (!questions) {
                    return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    );
                }

                return (
                    <Stack spacing={2}>
                        <UIStream
                            initialData={null}
                            stream={bloc.getStream('result')}
                            builder={(resultSnap) => {
                                const result = resultSnap.data;
                                if (result) {
                                    return (
                                        <Card sx={{ p: 4, textAlign: 'center' }}>
                                            <CheckCircleOutlined color="success" sx={{ fontSize: 64, mb: 1 }} />
                                            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{t('quiz-test-submitted')}</Typography>
                                            <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                                                {result.correctCount}/{result.totalQuestions}
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                                {t('quiz-score-percent', { percent: Math.round(result.scorePercent) })}
                                            </Typography>
                                            <Button variant="contained" onClick={() => navigate('/app/student/tests')}>{t('quiz-back-to-tests')}</Button>
                                        </Card>
                                    );
                                }
                                return (
                                    <UIStream
                                        initialData={bloc.getField('answers') ?? {}}
                                        stream={bloc.getStream('answers')}
                                        builder={(answersSnap) => {
                                            const answers: Record<number, number> = answersSnap.data ?? {};
                                            return (
                                                <UIStream
                                                    initialData={bloc.getField('speakingAudioUrls') ?? {}}
                                                    stream={bloc.getStream('speakingAudioUrls')}
                                                    builder={(speakingSnap) => {
                                                        const speakingUrls: Record<number, string> = speakingSnap.data ?? {};
                                                        return (
                                                            <UIStream
                                                                initialData={bloc.getField('speakingTextAnswers') ?? {}}
                                                                stream={bloc.getStream('speakingTextAnswers')}
                                                                builder={(speakingTextSnap) => {
                                                                    const speakingTexts: Record<number, string> = speakingTextSnap.data ?? {};
                                                                    // Đếm "đã trả lời" gộp cả 2 loại - câu MULTIPLE_CHOICE tính đã
                                                                    // chọn đáp án, câu SPEAKING tính đã có bản ghi âm HOẶC đã gõ
                                                                    // chữ (không dùng Object.keys(answers).length như cũ vì
                                                                    // 'answers' chỉ chứa câu trắc nghiệm).
                                                                    const answeredCount = questions.filter((q) => q.questionType === 'SPEAKING'
                                                                        ? (speakingUrls[q.questionId] != null || !!speakingTexts[q.questionId]?.trim())
                                                                        : answers[q.questionId] != null).length;
                                                                    return (
                                                                        <Card sx={{ p: 2 }}>
                                                                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                                                                <Typography variant="subtitle1" fontWeight={700}>
                                                                                    {t('quiz-answered-count', { answered: answeredCount, total: questions.length })}
                                                                                </Typography>
                                                                                <UIStream
                                                                                    initialData={false}
                                                                                    stream={bloc.getStream('submitting')}
                                                                                    builder={(submittingSnap) => (
                                                                                        <Button variant="contained" disabled={submittingSnap.data === true} onClick={askSubmit}>{t('quiz-submit-test')}</Button>
                                                                                    )}
                                                                                />
                                                                            </Stack>
                                                                        </Card>
                                                                    );
                                                                }}
                                                            />
                                                        );
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                );
                            }}
                        />

                        <UIStream
                            initialData={bloc.getField('answers') ?? {}}
                            stream={bloc.getStream('answers')}
                            builder={(answersSnap) => {
                                const answers: Record<number, number> = answersSnap.data ?? {};
                                return (
                                    <UIStream
                                        initialData={null}
                                        stream={bloc.getStream('result')}
                                        builder={(resultSnap) => {
                                            const result = resultSnap.data;
                                            return (
                                                <Stack spacing={2}>
                                                    {questions.map((q, i) => (
                                                        <Card key={q.questionId} sx={{ p: { xs: 2, sm: 3 } }}>
                                                            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                                                                <Typography variant="body1" fontWeight={700}>
                                                                    {i + 1}. {q.content ?? t('quiz-question-audio-only-hint')}
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    startIcon={<MenuBookOutlined />}
                                                                    onClick={() => openLessonDialog(q.lessonId)}
                                                                    sx={{ flexShrink: 0 }}
                                                                >
                                                                    {t('quiz-view-lesson')}
                                                                </Button>
                                                            </Stack>
                                                            {q.hasAudio && (
                                                                <UIStream
                                                                    initialData={null}
                                                                    stream={bloc.getStream('audioUrls')}
                                                                    builder={(urlsSnap) => {
                                                                        const url = (urlsSnap.data ?? {})[q.questionId];
                                                                        if (url) {
                                                                            return <Box component="audio" controls src={url} sx={{ height: 36, mb: 1.5, maxWidth: 320, display: 'block' }} />;
                                                                        }
                                                                        return (
                                                                            <UIStream
                                                                                initialData={null}
                                                                                stream={bloc.getStream('audioLoadingIds')}
                                                                                builder={(loadingSnap) => (
                                                                                    <Button
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        startIcon={<VolumeUpOutlined />}
                                                                                        disabled={(loadingSnap.data ?? {})[q.questionId] === true}
                                                                                        onClick={() => playQuestionAudio(q.questionId)}
                                                                                        sx={{ mb: 1.5 }}
                                                                                    >
                                                                                        {(loadingSnap.data ?? {})[q.questionId] === true ? t('quiz-question-audio-loading') : t('quiz-question-audio-play')}
                                                                                    </Button>
                                                                                )}
                                                                            />
                                                                        );
                                                                    }}
                                                                />
                                                            )}
                                                            {q.questionType === 'SPEAKING' ? (
                                                                <Stack spacing={1}>
                                                                    {q.answerMode !== 'TEXT' && (
                                                                        <>
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {t('quiz-speaking-hint')}
                                                                            </Typography>
                                                                            <UIStream
                                                                                initialData={null}
                                                                                stream={bloc.getStream('recordingQuestionId')}
                                                                                builder={(recSnap) => {
                                                                                    const recordingId = recSnap.data;
                                                                                    const isRecording = recordingId === q.questionId;
                                                                                    const otherRecording = recordingId != null && recordingId !== q.questionId;
                                                                                    return (
                                                                                        <UIStream
                                                                                            initialData={null}
                                                                                            stream={bloc.getStream('speakingAudioUrls')}
                                                                                            builder={(urlsSnap) => {
                                                                                                const url = (urlsSnap.data ?? {})[q.questionId];
                                                                                                return (
                                                                                                    <UIStream
                                                                                                        initialData={null}
                                                                                                        stream={bloc.getStream('speakingLoadingIds')}
                                                                                                        builder={(loadingSnap) => {
                                                                                                            const loading = (loadingSnap.data ?? {})[q.questionId] === true;
                                                                                                            return (
                                                                                                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                                                                                    {isRecording ? (
                                                                                                                        <Button
                                                                                                                            size="small"
                                                                                                                            color="error"
                                                                                                                            variant="contained"
                                                                                                                            startIcon={<StopCircleOutlined />}
                                                                                                                            onClick={() => stopRecording(q.questionId)}
                                                                                                                        >
                                                                                                                            {t('quiz-speaking-stop')}
                                                                                                                        </Button>
                                                                                                                    ) : (
                                                                                                                        <Button
                                                                                                                            size="small"
                                                                                                                            variant="outlined"
                                                                                                                            startIcon={<MicOutlined />}
                                                                                                                            disabled={result != null || loading || otherRecording}
                                                                                                                            onClick={() => startRecording(q.questionId)}
                                                                                                                        >
                                                                                                                            {loading ? t('quiz-speaking-uploading') : url ? t('quiz-speaking-record-again') : t('quiz-speaking-record')}
                                                                                                                        </Button>
                                                                                                                    )}
                                                                                                                    {url && !isRecording && (
                                                                                                                        <>
                                                                                                                            <Box component="audio" controls src={url} sx={{ height: 36, maxWidth: 260 }} />
                                                                                                                            {result == null && (
                                                                                                                                <Button
                                                                                                                                    size="small"
                                                                                                                                    color="error"
                                                                                                                                    startIcon={<DeleteOutlined />}
                                                                                                                                    disabled={loading}
                                                                                                                                    onClick={() => deleteSpeakingAnswer(q.questionId)}
                                                                                                                                >
                                                                                                                                    {t('quiz-speaking-delete')}
                                                                                                                                </Button>
                                                                                                                            )}
                                                                                                                        </>
                                                                                                                    )}
                                                                                                                </Stack>
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </>
                                                                    )}
                                                                    {q.answerMode !== 'AUDIO' && (
                                                                        <UIStream
                                                                            initialData={bloc.getField('speakingTextAnswers') ?? {}}
                                                                            stream={bloc.getStream('speakingTextAnswers')}
                                                                            builder={(textSnap) => {
                                                                                const speakingTexts: Record<number, string> = textSnap.data ?? {};
                                                                                const currentText = speakingTexts[q.questionId] ?? q.answerText ?? '';
                                                                                return (
                                                                                    <TextField
                                                                                        label={t('quiz-speaking-text-label')}
                                                                                        placeholder={t('quiz-speaking-text-hint')}
                                                                                        multiline
                                                                                        minRows={2}
                                                                                        fullWidth
                                                                                        disabled={result != null}
                                                                                        defaultValue={currentText}
                                                                                        onBlur={(e) => saveSpeakingText(q.questionId, e.target.value)}
                                                                                    />
                                                                                );
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Stack>
                                                            ) : (
                                                                <RadioGroup
                                                                    value={answers[q.questionId] ?? ''}
                                                                    onChange={(e) => chooseAnswer(q.questionId, Number(e.target.value))}
                                                                >
                                                                    {q.choices.map((c) => (
                                                                        <FormControlLabel
                                                                            key={c.choiceId}
                                                                            value={c.choiceId}
                                                                            control={<Radio disabled={result != null} />}
                                                                            label={c.content}
                                                                        />
                                                                    ))}
                                                                </RadioGroup>
                                                            )}
                                                        </Card>
                                                    ))}
                                                </Stack>
                                            );
                                        }}
                                    />
                                );
                            }}
                        />

                        <UIStream
                            initialData={{ isShow: false }}
                            stream={bloc.getStream('lesson_dialog_view')}
                            builder={(viewSnap) => {
                                const view = viewSnap.data ?? { isShow: false };
                                return (
                                    <Dialog open={view.isShow === true} onClose={() => bloc.closeLessonDialog()} maxWidth="sm" fullWidth>
                                        <UIStream
                                            initialData={null}
                                            stream={bloc.getStream('lessonData')}
                                            builder={(lessonSnap) => (
                                                <DialogTitle>{lessonSnap.data?.name ?? t('quiz-view-lesson')}</DialogTitle>
                                            )}
                                        />
                                        <DialogContent>
                                            <UIStream
                                                initialData={false}
                                                stream={bloc.getStream('lessonLoading')}
                                                builder={(loadingSnap) => {
                                                    if (loadingSnap.data === true) {
                                                        return (
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                                                <CircularProgress />
                                                            </Box>
                                                        );
                                                    }
                                                    return (
                                                        <UIStream
                                                            initialData={null}
                                                            stream={bloc.getStream('lessonData')}
                                                            builder={(lessonSnap) => {
                                                                const lessonData = lessonSnap.data;
                                                                if (!lessonData) return null;
                                                                return (
                                                                    <UIStream
                                                                        initialData={null}
                                                                        stream={bloc.getStream('lessonImageUrl')}
                                                                        builder={(imageSnap) => {
                                                                            const lessonImageUrl = imageSnap.data;
                                                                            return (
                                                                                <Stack spacing={2} sx={{ mt: 1 }}>
                                                                                    {lessonImageUrl && (
                                                                                        <Box
                                                                                            component="img"
                                                                                            src={lessonImageUrl}
                                                                                            alt={lessonData.name}
                                                                                            sx={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 1 }}
                                                                                        />
                                                                                    )}
                                                                                    {lessonData.textbookPage != null && (
                                                                                        <Typography variant="body2" color="text.secondary">
                                                                                            {t('quiz-lesson-textbook-page')}: {lessonData.textbookPage}
                                                                                        </Typography>
                                                                                    )}
                                                                                    {lessonData.summary && (
                                                                                        <Box>
                                                                                            <Typography variant="subtitle2">{t('quiz-lesson-summary')}</Typography>
                                                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{lessonData.summary}</Typography>
                                                                                        </Box>
                                                                                    )}
                                                                                    {lessonData.content && (
                                                                                        <Box>
                                                                                            <Typography variant="subtitle2">{t('quiz-lesson-content')}</Typography>
                                                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{lessonData.content}</Typography>
                                                                                        </Box>
                                                                                    )}
                                                                                    {!lessonData.summary && !lessonData.content && !lessonImageUrl && (
                                                                                        <Typography variant="body2" color="text.secondary">{t('quiz-lesson-no-content')}</Typography>
                                                                                    )}
                                                                                </Stack>
                                                                            );
                                                                        }}
                                                                    />
                                                                );
                                                            }}
                                                        />
                                                    );
                                                }}
                                            />
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => bloc.closeLessonDialog()}>{t('close')}</Button>
                                        </DialogActions>
                                    </Dialog>
                                );
                            }}
                        />
                    </Stack>
                );
            }}
        />
    );
}