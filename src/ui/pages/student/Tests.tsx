import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentTests, QuizStudentTestSummary } from "../../bloc/BlocStudentTests";
import UIStream from "../../components/common/UIStream";

// Trang "Đề của tôi" (khu vực Học sinh, /app/student/tests - Task 6 backend, danh sách). Đề trạng
// thái ASSIGNED có nút "Bắt đầu làm" -> /app/student/tests/:id/take; COMPLETED chỉ hiện nhãn, v1
// backend chưa có endpoint cho học sinh xem lại kết quả bài đã nộp (chỉ Phụ huynh xem được qua
// Task 7 - ReportApi.java), nên không có gì để bấm vào ở đây.
export default function Tests() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentTests);

    useEffect(() => {
        bloc.initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
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
                                    <ListItemText primary={test.name} />
                                </ListItem>
                            ))}
                        </List>
                    </Card>
                );
            }}
        />
    );
}
