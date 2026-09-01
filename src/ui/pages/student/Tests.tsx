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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentTests, QuizStudentTestSummary, QuizStudentSubjectLite } from "../../bloc/BlocStudentTests";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Đề của tôi" (khu vực Học sinh, /app/student/tests - Task 6 backend, danh sách). Đề trạng
// thái ASSIGNED có nút "Bắt đầu làm" -> /app/student/tests/:id/take; COMPLETED chỉ hiện nhãn, v1
// backend chưa có endpoint cho học sinh xem lại kết quả bài đã nộp (chỉ Phụ huynh xem được qua
// Task 7 - ReportApi.java), nên không có gì để bấm vào ở đây.
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
                                                <Chip size="small" label={t('quiz-test-status-COMPLETED')} color="success" />
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
                        <Dialog open={view.isShow === true} onClose={() => bloc.closePractice()} maxWidth="sm" fullWidth>
                            <DialogTitle>{t('quiz-practice-test-new')}</DialogTitle>
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
                                <Button onClick={() => bloc.closePractice()}>{t('cancel')}</Button>
                                <UIStream
                                    initialData={false}
                                    stream={bloc.getStream('practiceSubmitting')}
                                    builder={(submittingSnap) => (
                                        <Button variant="contained" disabled={submittingSnap.data === true} onClick={submitPractice}>{t('quiz-practice-generate')}</Button>
                                    )}
                                />
                            </DialogActions>
                        </Dialog>
                    );
                }}
            />
        </Stack>
    );
}
