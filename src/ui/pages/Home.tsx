import React, { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConstructionOutlined from "@mui/icons-material/ConstructionOutlined";
import WidgetsOutlined from "@mui/icons-material/WidgetsOutlined";

// Trang gốc "/" - sống bên trong AppShell (dùng chung topbar + sidebar với /demo, xem
// AppShell.tsx), yêu cầu đăng nhập như mọi trang khác trong shell. Đây là chỗ trống để build
// giao diện THẬT của project mới; toàn bộ template/UI Kit demo cũ giờ ở /demo để dùng làm tài
// liệu tham khảo trong lúc làm project mới (xem component nào dùng sao, style thế nào) mà không
// lẫn với code thật. Xoá nội dung placeholder này khi đã có nội dung thật ở "/".
export default function Home() {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = 'base-ui';
    }, []);

    return (
        <Box sx={{
            flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', py: 8
        }}>
            <ConstructionOutlined sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" fontWeight={700}>{t('home-title')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 460 }}>
                {t('home-desc')}
            </Typography>
            <Button component={RouterLink} to="/demo" variant="contained" size="large" startIcon={<WidgetsOutlined />}>
                {t('view-demo')}
            </Button>
        </Box>
    );
}
