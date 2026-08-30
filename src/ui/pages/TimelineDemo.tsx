import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import DemoSection from "../components/common/DemoSection";

const EVENTS = [
    { time: '09:00', title: 'order-placed', color: '#2196F3' },
    { time: '10:30', title: 'order-confirmed', color: '#4CAF50' },
    { time: '14:00', title: 'order-shipped', color: '#FF9800' },
    { time: '16:45', title: 'order-delivered', color: '#9C27B0' }
];

// Timeline tự vẽ bằng Box (thay vì phụ thuộc @mui/lab) - giữ base-ui gọn dependency.
export default function TimelineDemo() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('timeline')}>
            <Box sx={{ position: 'relative', pl: 4 }}>
                <Box sx={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, bgcolor: 'divider' }} />
                {EVENTS.map((e, i) => (
                    <Box key={i} sx={{ position: 'relative', mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <CheckCircleOutlined sx={{ position: 'absolute', left: -32, color: e.color, bgcolor: 'background.paper' }} fontSize="small" />
                        <Box>
                            <Typography variant="caption" color="text.secondary">{e.time}</Typography>
                            <Typography variant="body1" fontWeight={600}>{t(e.title)}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
        </DemoSection>
    );
}
