import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";

// Trang chủ khu vực Học sinh (/app/student) - placeholder, chờ build trang làm bài kiểm tra/xem
// điểm thật (Task 6-7 backend). Xoá placeholder này khi trang tổng quan thật đã có nội dung.
export default function StudentDashboard() {
    const { t } = useTranslation();
    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 320, color: 'text.secondary'
        }}>
            <DashboardOutlined sx={{ fontSize: 56, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">{t('quiz-dashboard-placeholder')}</Typography>
        </Box>
    );
}
