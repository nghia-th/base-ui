import React, { useContext, useEffect, useState } from "react";
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
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentAttempt, QuizStudentQuestion, QuizSubmitResult } from "../../bloc/BlocStudentAttempt";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Làm bài" (khu vực Học sinh, /app/student/tests/:testId/take - Task 6 backend). Vào trang
// tự start/resume attempt (idempotent bên backend). Chọn đáp án lưu ngay (progressive save qua
// BlocStudentAttempt.saveAnswer, không chờ nộp bài mới lưu) - học sinh thoát giữa chừng rồi quay
// lại làm tiếp cũng không mất đáp án đã chọn. Nộp bài xong hiện luôn điểm số (đây là LẦN DUY NHẤT
// học sinh thấy điểm - backend task 6 không có endpoint xem lại kết quả sau đó, xem Tests.tsx).
export default function TakeTest() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { testId } = useParams<{ testId: string }>();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentAttempt);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: 'error' });

    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [questions, setQuestions] = useState<QuizStudentQuestion[] | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizSubmitResult | null>(null);

    useEffect(() => {
        const id = Number(testId);
        if (!id) return;
        bloc.start(id, (newAttemptId, qs) => {
            setAttemptId(newAttemptId);
            setQuestions(qs);
        }, (error) => {
            showError(error);
            navigate('/app/student/tests', { replace: true });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testId]);

    const chooseAnswer = (questionId: number, choiceId: number) => {
        setAnswers((a) => ({ ...a, [questionId]: choiceId }));
        if (attemptId != null) bloc.saveAnswer(attemptId, questionId, choiceId, showError);
    };

    const answeredCount = Object.keys(answers).length;
    const totalCount = questions?.length ?? 0;

    const askSubmit = () => {
        if (attemptId == null) return;
        bloc.confirm({
            title: 'quiz-submit-test',
            message: answeredCount < totalCount ? 'quiz-submit-test-confirm-incomplete' : 'quiz-submit-test-confirm',
            onYes: () => {
                setSubmitting(true);
                bloc.submit(attemptId, (res) => {
                    setSubmitting(false);
                    setResult(res);
                }, (error) => { setSubmitting(false); showError(error); });
            }
        });
    };

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

    if (!questions) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {t('quiz-answered-count', { answered: answeredCount, total: totalCount })}
                    </Typography>
                    <Button variant="contained" disabled={submitting} onClick={askSubmit}>{t('quiz-submit-test')}</Button>
                </Stack>
            </Card>

            {questions.map((q, i) => (
                <Card key={q.questionId} sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>{i + 1}. {q.content}</Typography>
                    <RadioGroup
                        value={answers[q.questionId] ?? ''}
                        onChange={(e) => chooseAnswer(q.questionId, Number(e.target.value))}
                    >
                        {q.choices.map((c) => (
                            <FormControlLabel key={c.choiceId} value={c.choiceId} control={<Radio />} label={c.content} />
                        ))}
                    </RadioGroup>
                </Card>
            ))}
        </Stack>
    );
}
