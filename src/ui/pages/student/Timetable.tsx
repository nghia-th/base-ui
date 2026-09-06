import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocStudentTimetable, QuizStudentSubjectLite } from "../../bloc/BlocStudentTimetable";
import { QuizStudentTimetableEntry } from "../../../api/QuizStudentTimetableApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// 1=Thu Hai..7=Chu Nhat (ISO-8601, khop java.time.DayOfWeek#getValue() ben backend - xem
// TimetableEntry.java's javadoc), cung quy uoc voi trang Thoi khoa bieu ben Phu huynh.
const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7];

function todayIsoDayOfWeek(): number {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
}

// Trang "Thoi khoa bieu" (khu vuc Hoc sinh, /app/student/timetable - MOI, 2026-09-06, theo yeu
// cau "hoc sinh cho phep hoc sinh tao thoi khoa bieu khong cho xoa, update - viec xoa hoac update
// thi phu huynh lam, sau khi hoc sinh them thoi khoa bieu thi phu huynh se thay").
//
// Ca tuan Thu Hai..Chu Nhat (AskUserQuestion 2026-09-06: "Ca tuan (Recommended)"), moi the ngay
// liet ke cac Mon da xep + nut "+" mo Dialog chon 1 Mon de THEM vao cuoi ngay do. CO CHU Y KHONG
// CO nut Sua/Xoa/doi thu tu nao o day - trang nay CHI THEM, xoa/sua/doi thu tu van la viec cua Phu
// huynh o trang Thoi khoa bieu cua ho (ParentTimetable.tsx, qua setDay full-replace). Sau khi them
// thanh cong, Phu huynh thay ngay lan sau ho tai lai trang cua ho - khong can buoc rieng nao them.
export default function StudentTimetable() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentTimetable);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    // Subject dang chon trong Dialog "Them mon" - local state thuan tuy UI, reset moi lan mo lai.
    const [pickSubjectId, setPickSubjectId] = useState<number | ''>('');

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openDay = (dayOfWeek: number) => {
        setPickSubjectId('');
        bloc.openDayAdd(dayOfWeek);
    };

    const addSubject = (dayOfWeek: number) => {
        if (pickSubjectId === '') return;
        bloc.addSubject(dayOfWeek, pickSubjectId as number, () => {
            enqueueSnackbar(t('quiz-timetable-saved') as string, { variant: 'success' });
            setPickSubjectId('');
        }, showError);
    };

    return (
        <UIStream
            initialData={bloc.getField('week') ?? null}
            stream={bloc.getStream('week')}
            builder={(weekSnap) => {
                const week: QuizStudentTimetableEntry[] | null = weekSnap.data;
                return (
                    <UIStream
                        initialData={bloc.getField('subjects') ?? []}
                        stream={bloc.getStream('subjects')}
                        builder={(subjectsSnap) => {
                            const subjects: QuizStudentSubjectLite[] = subjectsSnap.data ?? [];
                            return (
                                <Stack spacing={2}>
                                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CalendarMonthOutlined color="primary" />
                                            <Typography variant="h6" fontWeight={700}>{t('quiz-timetable')}</Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {t('quiz-student-timetable-hint')}
                                        </Typography>
                                    </Card>

                                    {week == null ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {DAYS_OF_WEEK.map((day) => {
                                                const dayEntries = week
                                                    .filter((e) => e.dayOfWeek === day)
                                                    .sort((a, b) => a.orderIndex - b.orderIndex);
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} lg={3} key={day}>
                                                        <Card
                                                            variant={day === todayIsoDayOfWeek() ? 'outlined' : undefined}
                                                            sx={{
                                                                p: 2,
                                                                height: '100%',
                                                                ...(day === todayIsoDayOfWeek() ? { borderColor: 'primary.main', borderWidth: 2 } : {})
                                                            }}
                                                        >
                                                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Typography variant="subtitle1" fontWeight={700}>{t('quiz-weekday-' + day)}</Typography>
                                                                    {day === todayIsoDayOfWeek() && <Chip size="small" color="primary" label={t('quiz-today-label')} />}
                                                                </Stack>
                                                                <IconButton size="small" onClick={() => openDay(day)}>
                                                                    <AddOutlined fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                            {dayEntries.length === 0 ? (
                                                                <Typography variant="body2" color="text.secondary">{t('quiz-timetable-day-empty')}</Typography>
                                                            ) : (
                                                                <Stack spacing={0.5}>
                                                                    {dayEntries.map((entry, i) => (
                                                                        <Typography variant="body2" key={entry.id}>
                                                                            {i + 1}. {entry.subjectName}
                                                                        </Typography>
                                                                    ))}
                                                                </Stack>
                                                            )}
                                                        </Card>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    )}

                                    <UIStream
                                        initialData={{ isShow: false, dayOfWeek: 0 }}
                                        stream={bloc.getStream('add_dialog_view')}
                                        builder={(viewSnap) => {
                                            const view = viewSnap.data ?? { isShow: false, dayOfWeek: 0 };
                                            const dayEntries = (week ?? []).filter((e) => e.dayOfWeek === view.dayOfWeek);
                                            const pickableSubjects = subjects.filter((s) => !dayEntries.some((e) => e.subjectId === s.id));
                                            return (
                                                <AppDialog
                                                    open={view.isShow === true}
                                                    onClose={() => bloc.closeDayAdd()}
                                                    maxWidth="xs"
                                                    icon={AddOutlined}
                                                    title={view.dayOfWeek ? t('quiz-weekday-' + view.dayOfWeek) : ''}
                                                >
                                                    <DialogContent>
                                                        <Stack spacing={2} sx={{ mt: 1 }}>
                                                            {dayEntries.length > 0 && (
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary">{t('quiz-timetable-day-current')}</Typography>
                                                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                                        {dayEntries
                                                                            .sort((a, b) => a.orderIndex - b.orderIndex)
                                                                            .map((entry, i) => (
                                                                                <Typography variant="body2" key={entry.id}>{i + 1}. {entry.subjectName}</Typography>
                                                                            ))}
                                                                    </Stack>
                                                                </Box>
                                                            )}

                                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                                                    <InputLabel>{t('quiz-subjects')}</InputLabel>
                                                                    <Select
                                                                        label={t('quiz-subjects')}
                                                                        value={pickSubjectId}
                                                                        onChange={(e) => setPickSubjectId(Number(e.target.value))}
                                                                    >
                                                                        {pickableSubjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                                    </Select>
                                                                </FormControl>
                                                                <UIStream
                                                                    initialData={false}
                                                                    stream={bloc.getStream('adding')}
                                                                    builder={(addingSnap) => (
                                                                        <Button
                                                                            variant="outlined"
                                                                            startIcon={<AddOutlined />}
                                                                            disabled={pickSubjectId === '' || addingSnap.data === true}
                                                                            onClick={() => addSubject(view.dayOfWeek)}
                                                                        >
                                                                            {t('add')}
                                                                        </Button>
                                                                    )}
                                                                />
                                                            </Stack>
                                                            {pickableSubjects.length === 0 && subjects.length > 0 && (
                                                                <Chip size="small" color="success" label={t('quiz-timetable-all-subjects-added')} />
                                                            )}
                                                            {subjects.length === 0 && (
                                                                <Chip size="small" color="warning" label={t('quiz-timetable-no-subject')} />
                                                            )}
                                                        </Stack>
                                                    </DialogContent>
                                                    <DialogActions>
                                                        <Button onClick={() => bloc.closeDayAdd()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('close')}</Button>
                                                    </DialogActions>
                                                </AppDialog>
                                            );
                                        }}
                                    />
                                </Stack>
                            );
                        }}
                    />
                );
            }}
        />
    );
}
