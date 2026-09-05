import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import AssessmentOutlined from "@mui/icons-material/AssessmentOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CancelOutlined from "@mui/icons-material/CancelOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import RecordVoiceOverOutlined from "@mui/icons-material/RecordVoiceOverOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocParentReports, QuizAttemptHistoryItem, QuizAttemptReport } from "../../bloc/BlocParentReports";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Báo cáo" (khu vực Phụ huynh, /app/parent/reports - Task 7 backend, đọc-only). Chọn 1 học
// sinh -> xem lịch sử các bài đã nộp -> bấm vào 1 dòng để xem báo cáo chi tiết: điểm, phân tích
// theo TỪNG CHỦ ĐỀ KIẾN THỨC (byKnowledgeTag - tính năng cốt lõi của Hiểu Bài, không chỉ là điểm
// số) và chi tiết từng câu (chọn gì so với đáp án đúng).
export default function Reports() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentReports);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });
    const playSpeakingAnswer = (attemptId: number, questionId: number) => bloc.loadSpeakingAnswer(attemptId, questionId, showError);
    const gradeSpeakingAnswer = (attemptId: number, questionId: number, correct: boolean | null) => bloc.gradeSpeakingAnswer(attemptId, questionId, correct, showError);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('students')}
                    builder={(snapshot) => (
                        <UIStream
                            initialData={bloc.getField('studentId') ?? ''}
                            stream={bloc.getStream('studentId')}
                            builder={(studentIdSnap) => (
                                <FormControl size="small" sx={{ minWidth: 240 }}>
                                    <InputLabel>{t('quiz-select-student')}</InputLabel>
                                    <Select
                                        label={t('quiz-select-student')}
                                        value={studentIdSnap.data ?? ''}
                                        onChange={(e) => bloc.changeStudent(Number(e.target.value))}
                                    >
                                        {(snapshot.data ?? []).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    )}
                />
            </Card>

            <UIStream
                initialData={bloc.getField('studentId') ?? ''}
                stream={bloc.getStream('studentId')}
                builder={(studentIdSnap) => {
                    const studentId = studentIdSnap.data ?? '';
                    return studentId === '' ? (
                <Card sx={{
                    p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: 200, color: 'text.secondary'
                }}>
                    <BarChartOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body1">{t('quiz-select-student-report-hint')}</Typography>
                </Card>
            ) : (
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('history')}
                    builder={(snapshot) => {
                        const history: QuizAttemptHistoryItem[] = snapshot.data ?? [];
                        return (
                            <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{t('quiz-attempt-history')}</Typography>
                                {history.length === 0 && snapshot.data != null && (
                                    <Typography variant="body2" color="text.secondary">{t('quiz-no-attempt-history')}</Typography>
                                )}
                                {history.length > 0 && (
                                    <TableContainer sx={{ overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>{t('quiz-test-name')}</TableCell>
                                                    <TableCell>{t('quiz-submitted-at')}</TableCell>
                                                    <TableCell align="right">{t('quiz-score')}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {history.map((item) => (
                                                    <TableRow key={item.attemptId} hover sx={{ cursor: 'pointer' }} onClick={() => bloc.openReport(item.attemptId, showError)}>
                                                        <TableCell>
                                                            {item.testName}
                                                            {/* Tách riêng đề "Ôn tập" (PRACTICE) khỏi đề thường trong lịch sử - theo yêu cầu
                                                                anh 2026-09-01: hiện vẫn TRONG lịch sử (không ẩn) nhưng có nhãn riêng để phân
                                                                biệt, không lẫn với đề phụ huynh giao (REGULAR) - xem TestType.java. */}
                                                            {item.testType === 'PRACTICE' && (
                                                                <Chip size="small" label={t('quiz-test-type-PRACTICE')} color="info" sx={{ ml: 1 }} />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{new Date(item.submittedAt).toLocaleString()}</TableCell>
                                                        <TableCell align="right">{item.correctCount}/{item.totalQuestions}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Card>
                        );
                    }}
                />
            );
                }}
            />

            <UIStream
                initialData={null}
                stream={bloc.getStream('report')}
                builder={(reportSnap) => {
                    const report: QuizAttemptReport | null = reportSnap.data;
                    return (
            <AppDialog open={report != null} onClose={() => bloc.closeReport()} maxWidth="sm" title={report?.testName} icon={AssessmentOutlined}>
                <DialogContent>
                    {report && (
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="h5" fontWeight={700} color="primary.main">
                                    {report.correctCount}/{report.totalQuestions}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ({Math.round(report.scorePercent)}%) — {new Date(report.submittedAt).toLocaleString()}
                                </Typography>
                            </Stack>

                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('quiz-knowledge-breakdown')}</Typography>
                                <Stack spacing={1}>
                                    {report.byKnowledgeTag.map((tag) => (
                                        <Box key={tag.knowledgeTag}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">{tag.knowledgeTag}</Typography>
                                                <Typography variant="body2" color="text.secondary">{tag.correctCount}/{tag.totalCount}</Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={tag.totalCount === 0 ? 0 : (tag.correctCount / tag.totalCount) * 100}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('quiz-answer-detail')}</Typography>
                                <Stack spacing={1.5}>
                                    {report.answers.map((a, i) => (
                                        <Box key={a.questionId}>
                                            {a.questionType === 'SPEAKING' ? (
                                                <Stack direction="row" alignItems="flex-start" spacing={1}>
                                                    {a.parentMarkedCorrect === true && <CheckCircleOutlined color="success" fontSize="small" sx={{ mt: 0.3 }} />}
                                                    {a.parentMarkedCorrect === false && <CancelOutlined color="error" fontSize="small" sx={{ mt: 0.3 }} />}
                                                    {a.parentMarkedCorrect == null && <RecordVoiceOverOutlined color="disabled" fontSize="small" sx={{ mt: 0.3 }} />}
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" fontWeight={600}>{i + 1}. {a.questionContent}</Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            {t('quiz-speaking-not-auto-graded')}
                                                        </Typography>
                                                        {a.hasSpeakingAnswer && (
                                                            <UIStream
                                                                initialData={null}
                                                                stream={bloc.getStream('speakingAudioUrls')}
                                                                builder={(urlsSnap) => {
                                                                    const url = (urlsSnap.data ?? {})[a.questionId];
                                                                    if (url) {
                                                                        return <Box component="audio" controls src={url} sx={{ height: 36, mb: 1, maxWidth: 300, display: 'block' }} />;
                                                                    }
                                                                    return (
                                                                        <UIStream
                                                                            initialData={null}
                                                                            stream={bloc.getStream('speakingLoadingIds')}
                                                                            builder={(loadingSnap) => (
                                                                                <Button
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    disabled={(loadingSnap.data ?? {})[a.questionId] === true}
                                                                                    onClick={() => playSpeakingAnswer(report.attemptId, a.questionId)}
                                                                                    sx={{ mb: 1 }}
                                                                                >
                                                                                    {(loadingSnap.data ?? {})[a.questionId] === true ? t('quiz-question-audio-loading') : t('quiz-speaking-listen')}
                                                                                </Button>
                                                                            )}
                                                                        />
                                                                    );
                                                                }}
                                                            />
                                                        )}
                                                        {a.answerText && (
                                                            <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                                                                {t('quiz-speaking-typed-answer-label')}: {a.answerText}
                                                            </Typography>
                                                        )}
                                                        {!a.hasSpeakingAnswer && !a.answerText && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('quiz-speaking-no-answer')}</Typography>
                                                        )}
                                                        {a.referenceAnswer && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, whiteSpace: 'pre-wrap' }}>
                                                                {t('quiz-reference-answer')}: {a.referenceAnswer}
                                                            </Typography>
                                                        )}
                                                        <ToggleButtonGroup
                                                            size="small"
                                                            exclusive
                                                            value={a.parentMarkedCorrect}
                                                            onChange={(_e, value) => gradeSpeakingAnswer(report.attemptId, a.questionId, value)}
                                                        >
                                                            <ToggleButton value={true} color="success">{t('quiz-speaking-mark-correct')}</ToggleButton>
                                                            <ToggleButton value={false} color="error">{t('quiz-speaking-mark-incorrect')}</ToggleButton>
                                                        </ToggleButtonGroup>
                                                        {a.knowledgeTag && <Chip size="small" label={a.knowledgeTag} sx={{ mt: 0.5, display: 'block', width: 'fit-content' }} />}
                                                    </Box>
                                                </Stack>
                                            ) : (
                                                <Stack direction="row" alignItems="flex-start" spacing={1}>
                                                    {a.correct ? <CheckCircleOutlined color="success" fontSize="small" sx={{ mt: 0.3 }} /> : <CancelOutlined color="error" fontSize="small" sx={{ mt: 0.3 }} />}
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" fontWeight={600}>{i + 1}. {a.questionContent}</Typography>
                                                        <Typography variant="body2" color={a.correct ? 'success.main' : 'error.main'}>
                                                            {t('quiz-chosen-answer', { answer: a.chosenChoiceContent ?? t('quiz-no-answer') })}
                                                        </Typography>
                                                        {!a.correct && (
                                                            <Typography variant="body2" color="success.main">
                                                                {t('quiz-correct-answer-was', { answer: a.correctChoiceContent })}
                                                            </Typography>
                                                        )}
                                                        {a.knowledgeTag && <Chip size="small" label={a.knowledgeTag} sx={{ mt: 0.5 }} />}
                                                    </Box>
                                                </Stack>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => bloc.closeReport()} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
                </DialogActions>
            </AppDialog>
                    );
                }}
            />
        </Stack>
    );
}
