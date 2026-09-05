import React, { useContext, useEffect } from "react";
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
import TodayOutlined from "@mui/icons-material/TodayOutlined";
import EventOutlined from "@mui/icons-material/EventOutlined";
import EventBusyOutlined from "@mui/icons-material/EventBusyOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentToday } from "../../bloc/BlocStudentToday";
import { QuizStudentTimetableEntry } from "../../../api/QuizStudentTimetableApi";
import { QuizLessonPreparationStatus } from "../../../api/QuizStudentPreparationApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Hom nay hoc gi" (khu vuc Hoc sinh, /app/student/today - MOI, 2026-09-05, item 5 trong
// dot 11 yeu cau, phan 2 cua tinh nang "thoi khoa bieu": "tinh nang danh cho hoc sinh hom nay hoc
// mon gi, bai gi"). The "Hom nay" doc-only - lay tu StudentTimetableApi.java (rieng, KHONG dung
// QuizTimetableApi cua Phu huynh vi Hoc sinh khong co classroomId truyen len, backend tu resolve
// tu chinh minh).
//
// The "Ngay mai" (them 2026-09-05, item 9 "hoc sinh chuan bi bai cho ngay mai bang cach danh dau
// da chuan bi bai va gui cho phu huynh") CO checkbox tren tung bai - bam vao la goi ngay
// mark/unmarkPrepared (khong co nut "Luu" rieng, moi lan bam la 1 lan goi API luon, giong cach
// Phu huynh bam Khoa/Mo tai khoan tuc thi ben AdminParents.tsx) - "gui cho phu huynh" khong can
// buoc gui rieng, Phu huynh doc thang cung du lieu nay qua item 10 (xem Reports.tsx).
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
                                secondary={entry.lessonName}
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
    onToggle: (lessonId: number, currentlyPrepared: boolean) => void;
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
                        <ListItem key={entry.lessonId} disablePadding sx={{ borderRadius: 1, mb: 1, bgcolor: 'action.hover' }}>
                            <ListItemButton onClick={() => onToggle(entry.lessonId, entry.prepared)} sx={{ borderRadius: 1 }}>
                                <Checkbox edge="start" checked={entry.prepared} tabIndex={-1} disableRipple />
                                <ListItemText primary={entry.subjectName} secondary={entry.lessonName} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
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
                            onToggle={(lessonId, currentlyPrepared) => bloc.togglePrepared(lessonId, currentlyPrepared, showError)}
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
}
