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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import EditOutlined from "@mui/icons-material/EditOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ArrowUpwardOutlined from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlined from "@mui/icons-material/ArrowDownwardOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocParentTimetable, QuizClassroomLite, QuizSubjectLite } from "../../bloc/BlocParentTimetable";
import { QuizTimetableEntry } from "../../../api/QuizTimetableApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// 1=Thu Hai..7=Chu Nhat (ISO-8601, khop java.time.DayOfWeek#getValue() ben backend - xem
// TimetableEntry.java's javadoc). Key dich rieng cho tung thu, khong dung Intl vi ten thu tieng
// Viet ("Thu Hai"..) khac hoan toan format chuan cua trinh duyet.
const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7];

// Item 7 (dot 11 yeu cau, 2026-09-05) - "Phu huynh xem duoc hoc sinh hoc gi hom nay": thay vi
// them API/man hinh rieng, chi highlight ngay hom nay ngay tren trang tuan co san (Phu huynh da
// tai san toan bo tuan, khong can goi backend them). Date.getDay() cua JS la 0=Chu Nhat..6=Thu
// Bay (KHAC voi quy uoc 1=Thu Hai..7=Chu Nhat ma TimetableEntry.dayOfWeek/backend dung) nen phai
// doi 0 (Chu Nhat) thanh 7, giu nguyen 1..6.
function todayIsoDayOfWeek(): number {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
}

// Trang "Thoi khoa bieu" (khu vuc Phu huynh, /app/parent/timetable - MOI, 2026-09-05, phan 1 cua
// tinh nang - CRUD cho Phu huynh, theo yeu cau "tao chuc nang thoi khoa bieu trong 1 tuan cua
// con"). Mau CHUNG DUY NHAT cho ca Lop (khong theo tung tuan cu the - AskUserQuestion 2026-09-05),
// khong co gio giac (chi thu tu mon trong ngay).
//
// Revision 2026-09-06: bo han buoc chon Bai hoc (Lesson) - sau khi anh test ban dau va yeu cau
// "thoi khoa bieu la: toan, anh van, hoa", 1 ngay chi con la danh sach Mon hoc theo thu tu.
//
// Chon Lop o dau trang (neu Phu huynh co nhieu hon 1 Lop) -> 7 the ngay Thu Hai..Chu Nhat, moi the
// liet ke cac Mon hoc da xep theo thu tu + nut Sua mo Dialog thay TOAN BO danh sach ngay do (chon
// Mon hoc -> Them vao danh sach dang soan, co the xoa/doi thu tu truoc khi Luu).
export default function ParentTimetable() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentTimetable);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    // Subject dang chon trong khoi "them mon hoc" cua Dialog - local state thuan tuy UI (khong
    // phai du lieu nghiep vu, khong can luu vao bloc), reset ve rong moi lan mo lai Dialog.
    const [pickSubjectId, setPickSubjectId] = useState<number | ''>('');

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addSubject = (subjects: QuizSubjectLite[]) => {
        if (pickSubjectId === '') return;
        const subject = subjects.find((s) => s.id === pickSubjectId);
        if (!subject) return;
        bloc.addDraftSubject({ subjectId: subject.id, subjectName: subject.name });
        setPickSubjectId('');
    };

    const openDay = (dayOfWeek: number) => {
        setPickSubjectId('');
        bloc.openDayEditor(dayOfWeek);
    };

    const saveDay = () => {
        bloc.saveDay(() => {
            enqueueSnackbar(t('quiz-timetable-saved') as string, { variant: 'success' });
            bloc.closeDayEditor();
        }, showError);
    };

    return (
        <UIStream
            initialData={bloc.getField('classrooms') ?? null}
            stream={bloc.getStream('classrooms')}
            builder={(classroomsSnap) => {
                const classrooms: QuizClassroomLite[] = classroomsSnap.data ?? [];
                if (classroomsSnap.data == null) {
                    return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    );
                }
                if (classrooms.length === 0) {
                    return (
                        <Card sx={{ p: 3 }}>
                            <Typography color="text.secondary">{t('quiz-timetable-no-classroom')}</Typography>
                        </Card>
                    );
                }

                return (
                    <UIStream
                        initialData={bloc.getField('selectedClassroomId') ?? null}
                        stream={bloc.getStream('selectedClassroomId')}
                        builder={(classroomIdSnap) => {
                            const selectedClassroomId = classroomIdSnap.data;
                            return (
                                <UIStream
                                    initialData={bloc.getField('subjects') ?? []}
                                    stream={bloc.getStream('subjects')}
                                    builder={(subjectsSnap) => {
                                        const subjects: QuizSubjectLite[] = subjectsSnap.data ?? [];
                                        return (
                                            <Stack spacing={2}>
                                                <Card sx={{ p: { xs: 2, sm: 3 } }}>
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: classrooms.length > 1 ? 2 : 0 }}>
                                                        <CalendarMonthOutlined color="primary" />
                                                        <Typography variant="h6" fontWeight={700}>{t('quiz-timetable')}</Typography>
                                                    </Stack>
                                                    {classrooms.length > 1 && (
                                                        <FormControl size="small" sx={{ minWidth: 240 }}>
                                                            <InputLabel>{t('quiz-classrooms')}</InputLabel>
                                                            <Select
                                                                label={t('quiz-classrooms')}
                                                                value={selectedClassroomId ?? ''}
                                                                onChange={(e) => bloc.selectClassroom(Number(e.target.value))}
                                                            >
                                                                {classrooms.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                </Card>

                                                <UIStream
                                                    initialData={bloc.getField('week') ?? null}
                                                    stream={bloc.getStream('week')}
                                                    builder={(weekSnap) => {
                                                        const week: QuizTimetableEntry[] | null = weekSnap.data;
                                                        return (
                                                            <Grid container spacing={2}>
                                                                {DAYS_OF_WEEK.map((day) => {
                                                                    const dayEntries = (week ?? [])
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
                                                                                        <EditOutlined fontSize="small" />
                                                                                    </IconButton>
                                                                                </Stack>
                                                                                {week == null ? (
                                                                                    <CircularProgress size={20} />
                                                                                ) : dayEntries.length === 0 ? (
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
                                                        );
                                                    }}
                                                />

                                                <UIStream
                                                    initialData={{ isShow: false, dayOfWeek: 0 }}
                                                    stream={bloc.getStream('day_dialog_view')}
                                                    builder={(viewSnap) => {
                                                        const view = viewSnap.data ?? { isShow: false, dayOfWeek: 0 };
                                                        return (
                                                            <UIStream
                                                                initialData={bloc.getField('draftSubjects') ?? []}
                                                                stream={bloc.getStream('draftSubjects')}
                                                                builder={(draftSnap) => {
                                                                    const draft = draftSnap.data ?? [];
                                                                    return (
                                                                        <AppDialog
                                                                            open={view.isShow === true}
                                                                            onClose={() => bloc.closeDayEditor()}
                                                                            maxWidth="sm"
                                                                            icon={EditOutlined}
                                                                            title={view.dayOfWeek ? t('quiz-weekday-' + view.dayOfWeek) : ''}
                                                                        >
                                                                            <DialogContent>
                                                                                <Stack spacing={2} sx={{ mt: 1 }}>
                                                                                    {draft.length === 0 ? (
                                                                                        <Typography variant="body2" color="text.secondary">{t('quiz-timetable-day-empty')}</Typography>
                                                                                    ) : (
                                                                                        <List dense>
                                                                                            {draft.map((item: any, index: number) => (
                                                                                                <ListItem
                                                                                                    key={item.subjectId}
                                                                                                    secondaryAction={
                                                                                                        <Stack direction="row">
                                                                                                            <IconButton size="small" disabled={index === 0} onClick={() => bloc.moveDraftSubject(index, -1)}>
                                                                                                                <ArrowUpwardOutlined fontSize="small" />
                                                                                                            </IconButton>
                                                                                                            <IconButton size="small" disabled={index === draft.length - 1} onClick={() => bloc.moveDraftSubject(index, 1)}>
                                                                                                                <ArrowDownwardOutlined fontSize="small" />
                                                                                                            </IconButton>
                                                                                                            <IconButton size="small" color="error" onClick={() => bloc.removeDraftSubject(index)}>
                                                                                                                <DeleteOutlined fontSize="small" />
                                                                                                            </IconButton>
                                                                                                        </Stack>
                                                                                                    }
                                                                                                >
                                                                                                    <ListItemText primary={`${index + 1}. ${item.subjectName}`} />
                                                                                                </ListItem>
                                                                                            ))}
                                                                                        </List>
                                                                                    )}

                                                                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                                                        <FormControl size="small" sx={{ minWidth: 200 }}>
                                                                                            <InputLabel>{t('quiz-subjects')}</InputLabel>
                                                                                            <Select
                                                                                                label={t('quiz-subjects')}
                                                                                                value={pickSubjectId}
                                                                                                onChange={(e) => setPickSubjectId(Number(e.target.value))}
                                                                                            >
                                                                                                {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                                                                            </Select>
                                                                                        </FormControl>
                                                                                        <Button
                                                                                            variant="outlined"
                                                                                            startIcon={<AddOutlined />}
                                                                                            disabled={pickSubjectId === ''}
                                                                                            onClick={() => addSubject(subjects)}
                                                                                        >
                                                                                            {t('add')}
                                                                                        </Button>
                                                                                    </Stack>
                                                                                    {subjects.length === 0 && (
                                                                                        <Chip size="small" color="warning" label={t('quiz-timetable-no-subject')} />
                                                                                    )}
                                                                                </Stack>
                                                                            </DialogContent>
                                                                            <DialogActions>
                                                                                <Button onClick={() => bloc.closeDayEditor()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
                                                                                <UIStream
                                                                                    initialData={false}
                                                                                    stream={bloc.getStream('savingDay')}
                                                                                    builder={(savingSnap) => (
                                                                                        <Button variant="contained" color="primary" startIcon={<CheckOutlined />} disabled={savingSnap.data === true} onClick={saveDay} sx={DIALOG_PRIMARY_BUTTON_SX}>
                                                                                            {t('save')}
                                                                                        </Button>
                                                                                    )}
                                                                                />
                                                                            </DialogActions>
                                                                        </AppDialog>
                                                                    );
                                                                }}
                                                            />
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
            }}
        />
    );
}
