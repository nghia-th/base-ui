import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import FactCheckOutlined from "@mui/icons-material/FactCheckOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlined from "@mui/icons-material/CancelOutlined";
import RecordVoiceOverOutlined from "@mui/icons-material/RecordVoiceOverOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import LinearProgress from "@mui/material/LinearProgress";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocStudentTests, QuizStudentTestSummary, QuizStudentSubjectLite, QuizStudentAttemptReport } from "../../bloc/BlocStudentTests";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Đề của tôi" (khu vực Học sinh, /app/student/tests - Task 6 backend, danh sách). Đề trạng
// thái ASSIGNED có nút "Bắt đầu làm" -> /app/student/tests/:id/take; COMPLETED hiện nhãn + nút "Xem
// đáp án" (mới, 2026-09-02, theo yêu cầu "xem lại đáp án những đề đã làm") mở Dialog đọc-only cùng
// hình dạng UI với báo cáo bên Phụ huynh (Reports.tsx) - điểm số, phân tích theo chủ đề kiến thức,
// và từng câu (đã chọn gì so với đáp án đúng) - nhưng KHÔNG có nút chấm Đúng/Sai cho câu SPEAKING
// (đó là quyền của Phụ huynh, xem StudentAttemptAnswerDetail.java's javadoc: học sinh chỉ được đọc,
// không có referenceAnswer của Phụ huynh).
//
// Thêm nút "Ôn tập kiến thức" (2026-09-01) - học sinh tự chọn 1 Môn học, server random câu hỏi và
// tạo ngay 1 đề PRACTICE mới, bấm lại bao nhiêu lần cũng được (mỗi lần là 1 đề random khác, xem
// BlocStudentTests.ts's generatePractice). Đề PRACTICE hiện chung danh sách với đề thường, có thêm
// Chip "Ôn tập" để phân biệt.
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") - Dialog
// "Tạo đề ôn tập" dồn vào BlocStudentTests (practice_view/pSubjectId/practiceReq/practiceSubmitting),
// cùng pattern Dialog Ôn tập bên Phụ huynh (BlocParentTests.ts).
export default function Tests() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentTests);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });
    const openAnswerReview = (testId: number) => bloc.openAnswerReview(testId, showError);
    const playSpeakingAnswer = (attemptId: number, questionId: number) => bloc.loadSpeakingAnswer(attemptId, questionId, showError);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submitPractice = () => {
        bloc.submitPractice(() => {
            enqueueSnackbar(t('quiz-practice-test-created') as string, { variant: 'success' });
            bloc.closePractice();
        }, showError);
    };

    return (
        <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body2" color="text.secondary">{t('quiz-practice-test-hint')}</Typography>
                    <Button variant="outlined" startIcon={<AutorenewOutlined />} onClick={() => bloc.openPractice()}>{t('quiz-practice-test-new')}</Button>
                </Stack>
            </Card>

            <UIStream
                initialData={null}
                stream={bloc.getStream('tests')}
                builder={(snapshot) => {
                    const tests: QuizStudentTestSummary[] = snapshot.data ?? [];
                    return (
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{t('quiz-my-tests')}</Typography>
                            {tests.length === 0 && snapshot.data != null && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                                    <AssignmentOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body1">{t('quiz-no-tests-assigned')}</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {tests.map((test) => (
                                    <ListItem
                                        key={test.id}
                                        sx={{ borderRadius: 1, mb: 1, bgcolor: 'action.hover' }}
                                        secondaryAction={
                                            test.status === 'ASSIGNED' ? (
                                                <Button variant="contained" size="small" onClick={() => navigate(`/app/student/tests/${test.id}/take`)}>
                                                    {t('quiz-start-test')}
                                                </Button>
                                            ) : (
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Chip size="small" label={t('quiz-test-status-COMPLETED')} color="success" />
                                                    <Button size="small" variant="outlined" startIcon={<FactCheckOutlined />} onClick={() => openAnswerReview(test.id)}>
                                                        {t('quiz-view-answers')}
                                                    </Button>
                                                </Stack>
                                            )
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <span>{test.name}</span>
                                                    {test.testType === 'PRACTICE' && (
                                                        <Chip size="small" label={t('quiz-test-type-PRACTICE')} color="info" />
                                                    )}
                                                </Stack>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Card>
                    );
                }}
            />

            <UIStream
                initialData={{ isShow: false }}
                stream={bloc.getStream('practice_view')}
                builder={(viewSnap) => {
                    const view = viewSnap.data ?? { isShow: false };
                    return (
                        <AppDialog open={view.isShow === true} onClose={() => bloc.closePractice()} maxWidth="sm" title={t('quiz-practice-test-new')} icon={AutorenewOutlined}>
                            <DialogContent>
                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    <UIStream
                                        initialData={bloc.getField('subjects')}
                                        stream={bloc.getStream('subjects')}
                                        builder={(subjectsSnap) => {
                                            const subjects: QuizStudentSubjectLite[] = subjectsSnap.data ?? [];
                                            return (
                                                <UIStream
                                                    initialData={bloc.getField('pSubjectId') ?? ''}
                                                    stream={bloc.getStream('pSubjectId')}
                                                    builder={(subjectIdSnap) => (
                                                        <FormControl fullWidth size="small">
                                                            <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                                            <Select
                                                                label={t('quiz-select-subject')}
                                                                value={subjectIdSnap.data ?? ''}
                                                                onChange={(e) => bloc.setStream('pSubjectId', e.target.value === '' ? '' : Number(e.target.value))}
                                                            >
                                                                {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                />
                                            );
                                        }}
                                    />
                                    <TextField
                                        label={t('quiz-test-name-optional')}
                                        defaultValue={bloc.getField('pName', 'practiceReq') ?? ''}
                                        onChange={(e) => bloc.setStream('pName', e.target.value, 'practiceReq')}
                                        fullWidth
                                    />
                                    <TextField
                                        label={t('quiz-practice-question-count')}
                                        defaultValue={bloc.getField('pQuestionCount', 'practiceReq') ?? ''}
                                        onChange={(e) => bloc.setStream('pQuestionCount', e.target.value.replace(/[^0-9]/g, ''), 'practiceReq')}
                                        helperText={t('quiz-practice-question-count-hint')}
                                        fullWidth
                                    />
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => bloc.closePractice()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
                                <UIStream
                                    initialData={false}
                                    stream={bloc.getStream('practiceSubmitting')}
                                    builder={(submittingSnap) => (
                                        <Button variant="contained" color="primary" startIcon={<CheckOutlined />} disabled={submittingSnap.data === true} onClick={submitPractice} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('quiz-practice-generate')}</Button>
                                    )}
                                />
                            </DialogActions>
                        </AppDialog>
                    );
                }}
            />

            <UIStream
                initialData={null}
                stream={bloc.getStream('answerReview')}
                builder={(reviewSnap) => {
                    const review: QuizStudentAttemptReport | null = reviewSnap.data;
                    return (
                        <AppDialog open={review != null} onClose={() => bloc.closeAnswerReview()} maxWidth="sm" title={review?.testName} icon={FactCheckOutlined}>
                            <DialogContent>
                                {review && (
                                    <Stack spacing={2}>
                                        <Stack direction="row" alignItems="baseline" spacing={1}>
                                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                                {review.correctCount}/{review.totalQuestions}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                ({Math.round(review.scorePercent)}%) — {new Date(review.submittedAt).toLocaleString()}
                                            </Typography>
                                        </Stack>

                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('quiz-knowledge-breakdown')}</Typography>
                                            <Stack spacing={1}>
                                                {review.byKnowledgeTag.map((tag) => (
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
                                                {review.answers.map((a, i) => (
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
                                                                                                onClick={() => playSpeakingAnswer(review.attemptId, a.questionId)}
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
                                <Button onClick={() => bloc.closeAnswerReview()} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
                            </DialogActions>
                        </AppDialog>
                    );
                }}
            />
        </Stack>
    );
}
