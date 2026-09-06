import React from "react";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";

// Trang "Trợ giúp" (2026-09-06, "thêm phần help vào ui để xem file hướng dẫn sử dụng" - và revision
// sau đó: "tài liệu hướng dẫn anh muốn đưa vào UI luôn không dùng link như vậy bởi vì anh cài trên
// máy không có mạng") - nhúng TRỰC TIẾP file hướng dẫn (Sổ Tay Hiểu Bài) qua <iframe> từ file tĩnh
// public/help/huong-dan.html, được build/deploy KÈM app (public/ của Create React App copy thẳng
// vào build/, phục vụ cùng origin) - hoạt động hoàn toàn OFFLINE, không còn gọi ra
// claude.ai/code/artifact/... như link cũ (field MenuItem.externalUrl đã bị bỏ, xem
// AppMenuData.ts/AppMenuList.tsx). Dùng chung 1 component cho cả 2 route /app/parent/help và
// /app/student/help (xem AppShell.tsx) - nội dung sổ tay giống nhau cho cả Phụ huynh lẫn Học
// sinh, chỉ RequireQuizRole ở tầng route là khác nhau.
export default function HelpGuide() {
    const { t } = useTranslation();
    return (
        <Card sx={{ p: { xs: 1, sm: 1.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: 1 }}>
                <MenuBookOutlined color="action" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>{t('quiz-help')}</Typography>
            </Stack>
            <iframe
                title={t('quiz-help') as string}
                src="/help/huong-dan.html"
                style={{ flexGrow: 1, width: '100%', border: 'none', borderRadius: 8, minHeight: '70vh' }}
            />
        </Card>
    );
}
