import React, { useContext, useEffect, useMemo, useRef } from "react";
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
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentTests, QuizTest, QuizStudentLite, QuizPracticeImportResult } from "../../bloc/BlocParentTests";
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
// (đã có sẵn classroomId trong QuizStudentLite) để tải Môn học đúng lớp, xem BlocParentTests#changeFormStudent.
//
// STATE MANAGEMENT (đổi 2026-09-01, xem claude/ui-base-status.md "Quy ước state mới" +
// BlocParentTests.ts's comment "State giao diện dời từ useState vào đây" cho từng stream) - trang
// nặng nhất về số Dialog/field trong toàn app nên đây là ví dụ đầy đủ nhất của quy ước: Select cần
// hiển thị live (studentId/subjectId/lessonId, checkbox câu hỏi) bọc UIStream hẹp đúng field đó;
// TextField thường (tên đề, số câu ôn tập) uncontrolled; Dialog mở/đóng qua *_view stream.
export default function Tests() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentTests);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });
    // Import đề ôn tập hàng loạt bằng file (2026-09-04) - cùng shape hệt lessonFileInputRef của
    // Subjects.tsx (input file ẩn, mở bằng ref.current?.click() từ nút "Nhập đề ôn từ file").
    const practiceFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submitCreate = () => {
        bloc.submitCreate(() => {
            enqueueSnackbar(t('quiz-test-created') as string, { variant: 'success' });
            bloc.closeCreate();
        }, showError);
    };

    const submitPractice = () => {
        bloc.submitPractice(() => {
            enqueueSnackbar(t('quiz-practice-test-created') as string, { variant: 'success' });
            bloc.closePractice();
        }, showError);
    };

    const downloadPracticeTemplate = (format: 'xlsx' | 'csv') => bloc.downloadPracticeImportTemplate(format, showError);

    const onPracticeImportFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        bloc.runPracticeImport(file, showError);
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
                <GridActionsCellItem icon={<VisibilityOutlined fontSize="small" />} label="view" onClick={() => bloc.viewDetail(params.row.id, showError)} />,
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
                                    <UIStream
                                        initialData={bloc.getField('filterStudentId') ?? ''}
                                        stream={bloc.getStream('filterStudentId')}
                                        builder={(filterSnap) => (
                                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                                <InputLabel>{t('quiz-filter-by-student')}</InputLabel>
                                                <Select
                                                    label={t('quiz-filter-by-student')}
                                                    value={filterSnap.data ?? ''}
                                                    onChange={(e) => bloc.changeFilterStudent(e.target.value === '' ? '' : Number(e.target.value))}
                                                >
                                                    <MenuItem value="">{t('quiz-all-students')}</MenuItem>
                                                    {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button size="small" startIcon={<DownloadOutlined />} onClick={() => downloadPracticeTemplate('xlsx')}>{t('quiz-download-template-xlsx')}</Button>
                                        <Button size="small" startIcon={<DownloadOutlined />} onClick={() => downloadPracticeTemplate('csv')}>{t('quiz-download-template-csv')}</Button>
                                        <Button size="small" variant="outlined" startIcon={<UploadFileOutlined />} onClick={() => bloc.openPracticeImport()}>{t('quiz-import-practice-tests')}</Button>
                                        <Button variant="outlined" startIcon={<AutorenewOutlined />} onClick={() => bloc.openPractice()}>{t('quiz-practice-test-new')}</Button>
                                        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openCreate()}>{t('quiz-test-new')}</Button>
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

                            <UIStream
                                initialData={{ isShow: false }}
                                stream={bloc.getStream('create_view')}
                                builder={(viewSnap) => {
                                    const view = viewSnap.data ?? { isShow: false };
                                    return (
                                        <Dialog open={view.isShow === true} onClose={() => bloc.closeCreate()} maxWidth="sm" fullWidth>
                                            <DialogTitle>{t('quiz-test-new')}</DialogTitle>
                                            <DialogContent>
                                                <Stack spacing={2} sx={{ mt: 1 }}>
                                                    <UIStream
                                                        initialData={bloc.getField('formStudentId') ?? ''}
                                                        stream={bloc.getStream('formStudentId')}
                                                        builder={(studentIdSnap) => (
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>{t('quiz-select-student')}</InputLabel>
                                                                <Select
                                                                    label={t('quiz-select-student')}
                                                                    value={studentIdSnap.data ?? ''}
                                                                    onChange={(e) => bloc.changeFormStudent(e.target.value === '' ? '' : Number(e.target.value))}
                                                                >
                                                                    {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                                                </Select>
                                                            </FormControl>
                                                        )}
                                                    />
                                                    <TextField
                                                        label={t('quiz-test-name')}
                                                        defaultValue={bloc.getField('name', 'createReq') ?? ''}
                                                        onChange={(e) => bloc.setStream('name', e.target.value, 'createReq')}
                                                        fullWidth
                                                    />
                                                    <UIStream
                                                        initialData={bloc.getField('subjects')}
                                                        stream={bloc.getStream('subjects')}
                                                        builder={(subjectsSnap) => (
                                                            <UIStream
                                                                initialData={bloc.getField('formStudentId') ?? ''}
                                                                stream={bloc.getStream('formStudentId')}
                                                                builder={(studentIdSnap) => (
                                                                    <UIStream
                                                                        initialData={bloc.getField('formSubjectId') ?? ''}
                                                                        stream={bloc.getStream('formSubjectId')}
                                                                        builder={(subjectIdSnap) => (
                                                                            <FormControl fullWidth size="small" disabled={(studentIdSnap.data ?? '') === ''}>
                                                                                <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                                                                <Select
                                                                                    label={t('quiz-select-subject')}
                                                                                    value={subjectIdSnap.data ?? ''}
                                                                                    onChange={(e) => bloc.changeFormSubject(Number(e.target.value))}
                                                                                >
                                                                                    {(subjectsSnap.data ?? []).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                                                </Select>
                                                                            </FormControl>
                                                                        )}
                                                                    />
                                                                )}
                                                            />
                                                        )}
                                                    />
                                                    <UIStream
                                                        initialData={bloc.getField('lessons')}
                                                        stream={bloc.getStream('lessons')}
                                                        builder={(lessonsSnap) => (
                                                            <UIStream
                                                                initialData={bloc.getField('formSubjectId') ?? ''}
                                                                stream={bloc.getStream('formSubjectId')}
                                                                builder={(subjectIdSnap) => (
                                                                    <UIStream
                                                                        initialData={bloc.getField('formLessonId') ?? ''}
                                                                        stream={bloc.getStream('formLessonId')}
                                                                        builder={(lessonIdSnap) => (
                                                                            <FormControl fullWidth size="small" disabled={(subjectIdSnap.data ?? '') === ''}>
                                                                                <InputLabel>{t('quiz-select-lesson')}</InputLabel>
                                                                                <Select
                                                                                    label={t('quiz-select-lesson')}
                                                                                    value={lessonIdSnap.data ?? ''}
                                                                                    onChange={(e) => bloc.changeFormLesson(Number(e.target.value))}
                                                                                >
                                                                                    {(lessonsSnap.data ?? []).map((l: any) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                                                                                </Select>
                                                                            </FormControl>
                                                                        )}
                                                                    />
                                                                )}
                                                            />
                                                        )}
                                                    />
                                                    <UIStream
                                                        initialData={bloc.getField('formLessonId') ?? ''}
                                                        stream={bloc.getStream('formLessonId')}
                                                        builder={(lessonIdSnap) => {
                                                            if ((lessonIdSnap.data ?? '') === '') return null;
                                                            return (
                                                                <UIStream
                                                                    initialData={bloc.getField('questions')}
                                                                    stream={bloc.getStream('questions')}
                                                                    builder={(questionsSnap) => {
                                                                        const questions: any[] = questionsSnap.data ?? [];
                                                                        return (
                                                                            <UIStream
                                                                                initialData={bloc.getField('formQuestionIds') ?? []}
                                                                                stream={bloc.getStream('formQuestionIds')}
                                                                                builder={(idsSnap) => {
                                                                                    const selectedIds: number[] = idsSnap.data ?? [];
                                                                                    return (
                                                                                        <Box>
                                                                                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                                                                                {t('quiz-select-questions-count', { count: selectedIds.length })}
                                                                                            </Typography>
                                                                                            <Stack sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                                                                                {questions.map((q) => (
                                                                                                    <FormControlLabel
                                                                                                        key={q.id}
                                                                                                        control={<Checkbox checked={selectedIds.includes(q.id)} onChange={() => bloc.toggleFormQuestion(q.id)} />}
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
                                                                        );
                                                                    }}
                                                                />
                                                            );
                                                        }}
                                                    />
                                                </Stack>
                                            </DialogContent>
                                            <DialogActions>
                                                <Button onClick={() => bloc.closeCreate()}>{t('cancel')}</Button>
                                                <UIStream
                                                    initialData={false}
                                                    stream={bloc.getStream('submitting')}
                                                    builder={(submittingSnap) => (
                                                        <Button variant="contained" disabled={submittingSnap.data === true} onClick={submitCreate}>{t('quiz-assign-test')}</Button>
                                                    )}
                                                />
                                            </DialogActions>
                                        </Dialog>
                                    );
                                }}
                            />

                            {/* Dialog "Tạo đề ôn tập" (2026-09-01) - chọn Học sinh + Môn học là đủ, không có
                                bước Bài học/tick câu hỏi (server tự random toàn bộ câu hỏi của Môn, xem
                                TestService#generatePractice). Số câu để trống = server tự lấy mặc định 10. */}
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
                                                    <Typography variant="body2" color="text.secondary">{t('quiz-practice-test-hint')}</Typography>
                                                    <UIStream
                                                        initialData={bloc.getField('pStudentId') ?? ''}
                                                        stream={bloc.getStream('pStudentId')}
                                                        builder={(studentIdSnap) => (
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>{t('quiz-select-student')}</InputLabel>
                                                                <Select
                                                                    label={t('quiz-select-student')}
                                                                    value={studentIdSnap.data ?? ''}
                                                                    onChange={(e) => bloc.changePracticeStudent(e.target.value === '' ? '' : Number(e.target.value))}
                                                                >
                                                                    {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                                                </Select>
                                                            </FormControl>
                                                        )}
                                                    />
                                                    <UIStream
                                                        initialData={bloc.getField('subjects')}
                                                        stream={bloc.getStream('subjects')}
                                                        builder={(subjectsSnap) => (
                                                            <UIStream
                                                                initialData={bloc.getField('pStudentId') ?? ''}
                                                                stream={bloc.getStream('pStudentId')}
                                                                builder={(studentIdSnap) => (
                                                                    <UIStream
                                                                        initialData={bloc.getField('pSubjectId') ?? ''}
                                                                        stream={bloc.getStream('pSubjectId')}
                                                                        builder={(subjectIdSnap) => (
                                                                            <FormControl fullWidth size="small" disabled={(studentIdSnap.data ?? '') === ''}>
                                                                                <InputLabel>{t('quiz-select-subject')}</InputLabel>
                                                                                <Select
                                                                                    label={t('quiz-select-subject')}
                                                                                    value={subjectIdSnap.data ?? ''}
                                                                                    onChange={(e) => bloc.setStream('pSubjectId', Number(e.target.value))}
                                                                                >
                                                                                    {(subjectsSnap.data ?? []).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                                                </Select>
                                                                            </FormControl>
                                                                        )}
                                                                    />
                                                                )}
                                                            />
                                                        )}
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

                            {/* Dialog "Nhập đề ôn tập từ file" (2026-09-04) - cùng shape hệt Dialog import bài
                                học của Subjects.tsx, xem BlocParentTests.ts's openPracticeImport comment. */}
                            <UIStream
                                initialData={{ isShow: false }}
                                stream={bloc.getStream('practice_import_view')}
                                builder={(viewSnap) => {
                                    const view = viewSnap.data ?? { isShow: false };
                                    return (
                                        <Dialog open={view.isShow === true} onClose={() => bloc.closePracticeImport()} maxWidth="xs" fullWidth>
                                            <DialogTitle>{t('quiz-import-practice-tests-dialog-title')}</DialogTitle>
                                            <DialogContent>
                                                <input ref={practiceFileInputRef} type="file" accept=".xlsx,.csv" hidden onChange={onPracticeImportFileChosen} />
                                                <Stack spacing={2} sx={{ mt: 1 }} alignItems="flex-start">
                                                    <Typography variant="body2" color="text.secondary">{t('quiz-import-practice-tests-hint')}</Typography>
                                                    <UIStream
                                                        initialData={false}
                                                        stream={bloc.getStream('practiceImporting')}
                                                        builder={(importingSnap) => (
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={importingSnap.data === true ? <CircularProgress size={16} /> : <UploadFileOutlined />}
                                                                disabled={importingSnap.data === true}
                                                                onClick={() => practiceFileInputRef.current?.click()}
                                                            >
                                                                {t('quiz-import-pick-file')}
                                                            </Button>
                                                        )}
                                                    />
                                                    <UIStream
                                                        initialData={null}
                                                        stream={bloc.getStream('practiceImportResult')}
                                                        builder={(resultSnap) => {
                                                            const importResult: QuizPracticeImportResult | null = resultSnap.data;
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
                                                <Button onClick={() => bloc.closePracticeImport()}>{t('close')}</Button>
                                            </DialogActions>
                                        </Dialog>
                                    );
                                }}
                            />

                            <UIStream
                                initialData={null}
                                stream={bloc.getStream('detail_view')}
                                builder={(detailSnap) => {
                                    const detail: any = detailSnap.data;
                                    return (
                                        <Dialog open={detail != null} onClose={() => bloc.closeDetail()} maxWidth="sm" fullWidth>
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
                                                <Button onClick={() => bloc.closeDetail()}>{t('close')}</Button>
                                            </DialogActions>
                                        </Dialog>
                                    );
                                }}
                            />
                        </>
                    );
                }}
            />
        </Stack>
    );
}
