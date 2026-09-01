import React, { useContext, useEffect, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import MeetingRoomOutlined from "@mui/icons-material/MeetingRoomOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import AssignmentTurnedInOutlined from "@mui/icons-material/AssignmentTurnedInOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocParentDashboard } from "../../bloc/BlocParentDashboard";
import UIStream from "../../components/common/UIStream";
import LocalStorage from "../../../base/LocalStorage";

// Danh sách shortcut sang các trang quản lý khác của Phụ huynh - khớp PARENT_MENU_DATA
// (AppMenuData.ts) trừ chính mục "Tổng quan", khai báo lại độc lập ở đây vì cần icon component
// thật (JSX) để vẽ Card, không phải chuỗi tên icon dùng cho sidebar (iconMap.ts).
const QUICK_LINKS = [
    { to: '/app/parent/classrooms', label: 'quiz-classrooms', icon: MeetingRoomOutlined },
    { to: '/app/parent/students', label: 'quiz-students', icon: PeopleOutlined },
    { to: '/app/parent/subjects', label: 'quiz-subjects', icon: MenuBookOutlined },
    { to: '/app/parent/questions', label: 'quiz-questions', icon: HelpOutlineOutlined },
    { to: '/app/parent/tests', label: 'quiz-tests', icon: AssignmentOutlined },
    { to: '/app/parent/reports', label: 'quiz-reports', icon: BarChartOutlined }
];

// 1 ô số liệu tổng quan (số học sinh / môn học / đề đã giao / đề đã hoàn thành).
function StatCard({ icon: Icon, value, label, color }: { icon: typeof PeopleOutlined; value: number | null; label: string; color: string }) {
    return (
        <Card sx={{ p: 2, height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
                    <Icon />
                </Avatar>
                <Box>
                    <Typography variant="h5" fontWeight={700}>{value ?? '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Box>
            </Stack>
        </Card>
    );
}

// Trang "Tổng quan" (khu vực Phụ huynh, /app/parent) - thay placeholder cũ bằng nội dung thật:
// lời chào (đọc tên Phụ huynh từ quizProfile lưu ở LocalStorage lúc login/đăng ký - xem
// BlocQuizLogin.ts's handleAuthSuccess), 4 số liệu tổng quan và shortcut sang các trang quản lý
// khác. quiz-service không có API tổng hợp riêng nên BlocParentDashboard tự đếm từ 3 API sẵn có.
export default function ParentDashboard() {
    const { t } = useTranslation();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocParentDashboard);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const parentName = useMemo(() => {
        try {
            const profile = JSON.parse(LocalStorage.getItem('quizProfile') ?? '{}');
            return profile?.fullName as string | undefined;
        } catch {
            return undefined;
        }
    }, []);

    return (
        <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
                {parentName ? t('quiz-dashboard-welcome', { name: parentName }) : t('quiz-dashboard')}
            </Typography>

            <UIStream
                initialData={null}
                stream={bloc.getStream('classrooms')}
                builder={(classroomsSnap) => (
                    <UIStream
                        initialData={null}
                        stream={bloc.getStream('students')}
                        builder={(studentsSnap) => (
                            <UIStream
                                initialData={null}
                                stream={bloc.getStream('subjects')}
                                builder={(subjectsSnap) => (
                                    <UIStream
                                        initialData={null}
                                        stream={bloc.getStream('tests')}
                                        builder={(testsSnap) => {
                                            const classrooms: any[] = classroomsSnap.data ?? [];
                                            const students: any[] = studentsSnap.data ?? [];
                                            const subjects: any[] = subjectsSnap.data ?? [];
                                            const tests: any[] = testsSnap.data ?? [];
                                            // Loại PRACTICE (đề "Ôn tập" tự sinh, xem TestType.java) khỏi 2 số liệu này - không
                                            // được làm loãng "Đề đã giao"/"Đề đã hoàn thành" vốn chỉ tính đề THẬT phụ huynh
                                            // giao (REGULAR), theo đúng yêu cầu anh 2026-09-01: "tách riêng loại Ôn tập".
                                            const regularTests = tests.filter((x) => x.testType !== 'PRACTICE');
                                            const assignedCount = testsSnap.data == null ? null : regularTests.filter((x) => x.status === 'ASSIGNED').length;
                                            const completedCount = testsSnap.data == null ? null : regularTests.filter((x) => x.status === 'COMPLETED').length;
                                            const noClassrooms = classroomsSnap.data != null && classrooms.length === 0;

                                            return (
                                                <Stack spacing={2}>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                                                            <StatCard icon={MeetingRoomOutlined} value={classroomsSnap.data == null ? null : classrooms.length}
                                                                      label={t('quiz-dashboard-classrooms-count')} color="info.main" />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                                                            <StatCard icon={PeopleOutlined} value={studentsSnap.data == null ? null : students.length}
                                                                      label={t('quiz-dashboard-students-count')} color="primary.main" />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                                                            <StatCard icon={MenuBookOutlined} value={subjectsSnap.data == null ? null : subjects.length}
                                                                      label={t('quiz-dashboard-subjects-count')} color="secondary.main" />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                                                            <StatCard icon={AssignmentOutlined} value={assignedCount}
                                                                      label={t('quiz-dashboard-tests-assigned-count')} color="warning.main" />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                                                            <StatCard icon={AssignmentTurnedInOutlined} value={completedCount}
                                                                      label={t('quiz-dashboard-tests-completed-count')} color="success.main" />
                                                        </Grid>
                                                    </Grid>

                                                    {/* Lớp học giờ là điều kiện tiên quyết để tạo Học sinh (xem BlocParentStudents.ts) -
                                                        chưa có lớp nào thì ưu tiên gợi ý tạo Lớp trước, chỉ gợi ý tạo Học sinh khi đã có
                                                        sẵn ít nhất 1 lớp. */}
                                                    {noClassrooms ? (
                                                        <Card sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('quiz-dashboard-no-classrooms')}
                                                            </Typography>
                                                        </Card>
                                                    ) : studentsSnap.data != null && students.length === 0 && (
                                                        <Card sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('quiz-dashboard-no-students')}
                                                            </Typography>
                                                        </Card>
                                                    )}
                                                </Stack>
                                            );
                                        }}
                                    />
                                )}
                            />
                        )}
                    />
                )}
            />

            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
                {t('quiz-dashboard-quick-links')}
            </Typography>
            <Grid container spacing={2}>
                {QUICK_LINKS.map((link) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={link.to}>
                        <Card sx={{ height: '100%' }}>
                            <CardActionArea component={RouterLink} to={link.to} sx={{ p: 2, height: '100%' }}>
                                <Stack spacing={1} alignItems="center" textAlign="center">
                                    <link.icon color="primary" sx={{ fontSize: 32 }} />
                                    <Typography variant="body2" fontWeight={600}>{t(link.label)}</Typography>
                                </Stack>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
}
