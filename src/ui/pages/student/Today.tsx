import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TodayOutlined from "@mui/icons-material/TodayOutlined";
import EventOutlined from "@mui/icons-material/EventOutlined";
import EventBusyOutlined from "@mui/icons-material/EventBusyOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import FactCheckOutlined from "@mui/icons-material/FactCheckOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentToday } from "../../bloc/BlocStudentToday";
import { QuizStudentTimetableEntry } from "../../../api/QuizStudentTimetableApi";
import { QuizLessonPreparationStatus } from "../../../api/QuizStudentPreparationApi";
import { QuizSubjectLessonReportStatus } from "../../../api/QuizStudentLessonReportApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Hom nay hoc gi" (khu vuc Hoc sinh, /app/student/today - MOI, 2026-09-05, item 5 trong
// dot 11 yeu cau, phan 2 cua tinh nang "thoi khoa bieu": "tinh nang danh cho hoc sinh hom nay hoc
// mon gi, bai gi"). The "Hom nay" doc-only - lay tu StudentTimetableApi.java (rieng, KHONG dung
// QuizTimetableApi cua Phu huynh vi Hoc sinh khong co classroomId truyen len, backend tu resolve
// tu chinh minh).
//
// The "Ngay mai" (them 2026-09-05, item 9 "hoc sinh chuan bi bai cho ngay mai bang cach danh dau
// da chuan bi bai va gui cho phu huynh") CO checkbox tren tung mon - bam vao la goi ngay
// mark/unmarkPrepared (khong co nut "Luu" rieng, moi lan bam la 1 lan goi API luon, giong cach
// Phu huynh bam Khoa/Mo tai khoan tuc thi ben AdminParents.tsx) - "gui cho phu huynh" khong can
// buoc gui rieng, Phu huynh doc thang cung du lieu nay qua item 10 (xem Reports.tsx).
//
// Revision 2026-09-06: thoi khoa bieu + checklist chuan bi bai deu chi con Mon hoc, khong con Bai
// hoc cu the (bo secondary={entry.lessonName} - xem TimetableEntry.java's javadoc ben backend).
//
// Them "Bao bai" (2026-09-06, tinh nang moi "hom nay con hoc gi": "hom nay con hoc toan -> con
// hoc bai 1" - vi 1 Mon co the co rat nhieu Bai, VD "Bai 1".."Bai 100") - moi Mon co trong thoi
// khoa bieu hom nay duoc 1 khoi rieng: cac Bai DA bao hom nay hien Chip (bam X de bo bao trong
// ngay), + 1 Select CHI hien Bai CHUA TUNG bao (tu ngan dan) + nut "Them" de bao ngay lap tuc.
function DayCard({ icon, title, entries, emptyKey }: {
    icon: React.ReactNode;
    title: string;
    entries: QuizStudentTimetableEntry[] | null;
    emptyKey: string;
}) {
    const { t } = useTranslation();
    return (
        <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                {icon}
                <Typography variant="h6" fontWeight={700}>{title}</Typography>
            </Stack>
            {entries == null ? null : entries.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                    <EventBusyOutlined sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">{t(emptyKey)}</Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {entries.map((entry, index) => (
                        <ListItem key={entry.id} sx={{ borderRadius: 1, mb: 1, bgcolor: 'action.hover' }}>
                            <ListItemText
                                primary={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Chip size="small" label={index + 1} />
                                        <span>{entry.subjectName}</span>
                                    </Stack>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Card>
    );
}

function TomorrowCard({ entries, onToggle }: {
    entries: QuizLessonPreparationStatus[] | null;
    onToggle: (subjectId: number, currentlyPrepared: boolean) => void;
}) {
    const { t } = useTranslation();
    const preparedCount = (entries ?? []).filter((e) => e.prepared).length;
    return (
        <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <EventOutlined color="primary" />
                    <Typography variant="h6" fontWeight={700}>{t('quiz-tomorrow')}</Typography>
                </Stack>
                {entries != null && entries.length > 0 && (
                    <Chip
                        size="small"
                        color={preparedCount === entries.length ? 'success' : 'default'}
                        label={t('quiz-preparation-progress', { done: preparedCount, total: entries.length })}
                    />
                )}
            </Stack>
            {entries == null ? null : entries.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                    <EventBusyOutlined sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">{t('quiz-tomorrow-empty')}</Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {entries.map((entry) => (
                        <ListItem key={entry.subjectId} disablePadding sx={{ borderRadius: 1, mb: 1, bgcolor: 'action.hover' }}>
                            <ListItemButton onClick={() => onToggle(entry.subjectId, entry.prepared)} sx={{ borderRadius: 1 }}>
                                <Checkbox edge="start" checked={entry.prepared} tabIndex={-1} disableRipple />
                                <ListItemText primary={entry.subjectName} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            )}
        </Card>
    );
}

// 1 khoi "Bao bai" cho 1 Mon hoc (2026-09-06) - pickedLessonId la state UI thuan tuy (Select dang
// chon Bai nao, chua bam Them), do component cha (LessonReportCard) giu chung 1 map theo
// subjectId de moi the Mon co state Select doc lap voi nhau.
function SubjectLessonReportBlock({ subject, pickedLessonId, onPick, onAdd, onRemove }: {
    subject: QuizSubjectLessonReportStatus;
    pickedLessonId: number | '';
    onPick: (lessonId: number | '') => void;
    onAdd: () => void;
    onRemove: (lessonId: number) => void;
}) {
    const { t } = useTranslation();
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{subject.subjectName}</Typography>
            {subject.reportedToday.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                    {subject.reportedToday.map((l) => (
                        <Chip key={l.lessonId} size="small" color="success" label={l.lessonName} onDelete={() => onRemove(l.lessonId)} />
                    ))}
                </Stack>
            )}
            {subject.available.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('quiz-lesson-report-all-done')}</Typography>
            ) : (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>{t('quiz-lesson-report-pick')}</InputLabel>
                        <Select
                            label={t('quiz-lesson-report-pick')}
                            value={pickedLessonId}
                            onChange={(e) => onPick(e.target.value === '' ? '' : Number(e.target.value))}
                        >
                            {subject.available.map((l) => <MenuItem key={l.lessonId} value={l.lessonId}>{l.lessonName}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button variant="outlined" size="small" startIcon={<AddOutlined />} disabled={pickedLessonId === ''} onClick={onAdd}>
                        {t('add')}
                    </Button>
                </Stack>
            )}
        </Box>
    );
}

function LessonReportCard({ subjects, onReport, onUnreport }: {
    subjects: QuizSubjectLessonReportStatus[] | null;
    onReport: (lessonId: number) => void;
    onUnreport: (lessonId: number) => void;
}) {
    const { t } = useTranslation();
    const [picked, setPicked] = useState<Record<number, number | ''>>({});

    return (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <FactCheckOutlined color="primary" />
                <Typography variant="h6" fontWeight={700}>{t('quiz-lesson-report-title')}</Typography>
            </Stack>
            {subjects == null ? null : subjects.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                    <EventBusyOutlined sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">{t('quiz-today-empty')}</Typography>
                </Box>
            ) : (
                <Stack spacing={2} divider={<Divider flexItem />}>
                    {subjects.map((subject) => (
                        <SubjectLessonReportBlock
                            key={subject.subjectId}
                            subject={subject}
                            pickedLessonId={picked[subject.subjectId] ?? ''}
                            onPick={(lessonId) => setPicked({ ...picked, [subject.subjectId]: lessonId })}
                            onAdd={() => {
                                const lessonId = picked[subject.subjectId];
                                if (lessonId === '' || lessonId == null) return;
                                onReport(lessonId);
                                setPicked({ ...picked, [subject.subjectId]: '' });
                            }}
                            onRemove={onUnreport}
                        />
                    ))}
                </Stack>
            )}
        </Card>
    );
}

export default function Today() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentToday);
    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Stack spacing={2}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <UIStream
                        initialData={null}
                        stream={bloc.getStream('today')}
                        builder={(snap) => (
                            <DayCard
                                icon={<TodayOutlined color="primary" />}
                                title={t('quiz-today')}
                                entries={snap.data}
                                emptyKey="quiz-today-empty"
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <UIStream
                        initialData={null}
                        stream={bloc.getStream('tomorrow')}
                        builder={(snap) => (
                            <TomorrowCard
                                entries={snap.data}
                                onToggle={(subjectId, currentlyPrepared) => bloc.togglePrepared(subjectId, currentlyPrepared, showError)}
                            />
                        )}
                    />
                </Grid>
            </Grid>
            <UIStream
                initialData={null}
                stream={bloc.getStream('lessonReport')}
                builder={(snap) => (
                    <LessonReportCard
                        subjects={snap.data}
                        onReport={(lessonId) => bloc.reportLesson(lessonId, showError)}
                        onUnreport={(lessonId) => bloc.unreportLesson(lessonId, showError)}
                    />
                )}
            />
        </Stack>
    );
}
