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
import NavigateBeforeOutlined from "@mui/icons-material/NavigateBeforeOutlined";
import NavigateNextOutlined from "@mui/icons-material/NavigateNextOutlined";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocParentReports, QuizAttemptHistoryItem, QuizAttemptReport, QuizReportSubjectLite } from "../../bloc/BlocParentReports";
import { QuizTimetableLessonPreparation } from "../../../api/QuizTimetableApi";
import { QuizLessonReportHistoryItem } from "../../../api/QuizLessonReportApi";
import EventOutlined from "@mui/icons-material/EventOutlined";
import RadioButtonUncheckedOutlined from "@mui/icons-material/RadioButtonUncheckedOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import TextField from "@mui/material/TextField";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Báo cáo" (khu vực Phụ huynh, /app/parent/reports - Task 7 backend, đọc-only). Chọn 1 học
// sinh -> xem lịch sử các bài đã nộp -> bấm vào 1 dòng để xem báo cáo chi tiết: điểm, phân tích
// theo TỪNG CHỦ ĐỀ KIẾN THỨC (byKnowledgeTag - tính năng cốt lõi của Hiểu Bài, không chỉ là điểm
// số) và chi tiết từng câu (chọn gì so với đáp án đúng).
//
// 2026-09-05 (item 8, dot 11 yeu cau) - "phu huynh xem duoc lich su hoc tap cua con trong 1 tuan":
// them thanh dieu huong Tuan truoc/Tuan nay/Tuan sau (mac dinh Tuan nay) ngay tren bang lich su, +
// nut "Xem tat ca" de quay lai xem toan bo lich su nhu truoc (khong bo tinh nang cu).

// Nhan hien thi 1 khoang Thu Hai-Chu Nhat cho weekOffset (0 = tuan nay, am/duong = tuan
// truoc/sau) - CHI de hien thi (BlocParentReports.weekRange tinh lai y het de goi API, khong
// import cheo giua UI va Bloc cho 1 phep tinh don gian).
function formatWeekLabel(weekOffset: number): string {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const jsDay = now.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (isoDay - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${fmt(monday)} - ${fmt(sunday)}`;
}
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
                <Stack spacing={2}>
                {/* Item 10 (dot 11 yeu cau, 2026-09-05) - "phu huynh xem duoc con da chuan bi bai
                    cho ngay mai hay chua va mon nao chua hoc". Doc-only - Hoc sinh moi la nguoi
                    danh dau/bo danh dau duoc (xem Today.tsx ben khu vuc Hoc sinh). */}
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('preparation')}
                    builder={(prepSnap) => {
                        const preparation: QuizTimetableLessonPreparation[] = prepSnap.data ?? [];
                        const notPrepared = preparation.filter((p) => !p.prepared);
                        return prepSnap.data == null ? null : (
                            <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: preparation.length > 0 ? 2 : 0 }}>
                                    <EventOutlined color="primary" />
                                    <Typography variant="h6" fontWeight={700}>{t('quiz-preparation-tomorrow')}</Typography>
                                    {preparation.length > 0 && (
                                        <Chip
                                            size="small"
                                            color={notPrepared.length === 0 ? 'success' : 'warning'}
                                            label={t('quiz-preparation-progress', { done: preparation.length - notPrepared.length, total: preparation.length })}
                                        />
                                    )}
                                </Stack>
                                {preparation.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">{t('quiz-tomorrow-empty')}</Typography>
                                ) : (
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {preparation.map((p) => (
                                            <Chip
                                                key={p.subjectId}
                                                size="small"
                                                icon={p.prepared ? <CheckCircleOutlined /> : <RadioButtonUncheckedOutlined />}
                                                color={p.prepared ? 'success' : 'default'}
                                                variant={p.prepared ? 'filled' : 'outlined'}
                                                label={p.subjectName}
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </Card>
                        );
                    }}
                />
                {/* "Bao bai" (2026-09-06) - "ben phu huynh co the xem duoc hom nay con hoc gi va cung co
                    the xem lai nhung ngay truoc con da chon", loc duoc theo Mon hoc. Mac dinh ngay hom nay
                    (dat trong changeStudent). */}
                <UIStream
                    initialData={bloc.getField('lessonReportDate') ?? ''}
                    stream={bloc.getStream('lessonReportDate')}
                    builder={(dateSnap) => (
                        <UIStream
                            initialData={bloc.getField('lessonReportSubjectId') ?? ''}
                            stream={bloc.getStream('lessonReportSubjectId')}
                            builder={(subjectIdSnap) => (
                                <UIStream
                                    initialData={bloc.getField('lessonReportSubjects') ?? []}
                                    stream={bloc.getStream('lessonReportSubjects')}
                                    builder={(subjectsSnap) => (
                                        <UIStream
                                            initialData={null}
                                            stream={bloc.getStream('lessonReportHistory')}
                                            builder={(historySnap) => {
                                                const items: QuizLessonReportHistoryItem[] = historySnap.data ?? [];
                                                const reportSubjects: QuizReportSubjectLite[] = subjectsSnap.data ?? [];
                                                return (
                                                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                                            <MenuBookOutlined color="primary" />
                                                            <Typography variant="h6" fontWeight={700} sx={{ mr: 'auto' }}>{t('quiz-lesson-report-history')}</Typography>
                                                            <TextField
                                                                type="date"
                                                                size="small"
                                                                label={t('quiz-lesson-report-date')}
                                                                value={dateSnap.data ?? ''}
                                                                onChange={(e) => bloc.changeLessonReportDate(studentId, e.target.value)}
                                                                InputLabelProps={{ shrink: true }}
                                                            />
                                                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                                                <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                                                <Select
                                                                    label={t('quiz-select-subject')}
                                                                    value={subjectIdSnap.data ?? ''}
                                                                    onChange={(e) => bloc.changeLessonReportSubject(studentId, e.target.value === '' ? '' : Number(e.target.value))}
                                                                >
                                                                    <MenuItem value="">{t('all')}</MenuItem>
                                                                    {reportSubjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                                </Select>
                                                            </FormControl>
                                                        </Stack>
                                                        {items.length === 0 ? (
                                                            <Typography variant="body2" color="text.secondary">{t('quiz-lesson-report-history-empty')}</Typography>
                                                        ) : (
                                                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                                                {items.map((item) => (
                                                                    <Chip key={item.lessonId} size="small" label={`${item.subjectName} - ${item.lessonName}`} />
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Card>
                                                );
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />
                    )}
                />
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('history')}
                    builder={(snapshot) => {
                        const history: QuizAttemptHistoryItem[] = snapshot.data ?? [];
                        return (
                            <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                    <Typography variant="h6" fontWeight={700}>{t('quiz-attempt-history')}</Typography>
                                    <UIStream
                                        initialData={bloc.getField('weekOffset') ?? 0}
                                        stream={bloc.getStream('weekOffset')}
                                        builder={(weekSnap) => {
                                            const weekOffset: number | null = weekSnap.data === undefined ? 0 : weekSnap.data;
                                            return (
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    {weekOffset != null && (
                                                        <>
                                                            <IconButton size="small" onClick={() => bloc.changeWeek(studentId, weekOffset - 1)}>
                                                                <NavigateBeforeOutlined fontSize="small" />
                                                            </IconButton>
                                                            <Chip
                                                                size="small"
                                                                label={weekOffset === 0 ? `${t('quiz-this-week')} (${formatWeekLabel(0)})` : formatWeekLabel(weekOffset)}
                                                            />
                                                            <IconButton size="small" onClick={() => bloc.changeWeek(studentId, weekOffset + 1)}>
                                                                <NavigateNextOutlined fontSize="small" />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        variant={weekOffset == null ? 'contained' : 'outlined'}
                                                        onClick={() => bloc.changeWeek(studentId, weekOffset == null ? 0 : null)}
                                                    >
                                                        {weekOffset == null ? t('quiz-back-to-week-view') : t('quiz-view-all-history')}
                                                    </Button>
                                                </Stack>
                                            );
                                        }}
                                    />
                                </Stack>
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
                </Stack>
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
