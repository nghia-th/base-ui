import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";

interface DemoSectionProps {
    title: string;
    children: React.ReactNode;
    description?: string;
    icon?: React.ElementType;
    color?: string;
}

// Khung dùng chung cho các trang demo UI-kit: 1 Card có icon-badge màu + tiêu đề + mô tả ngắn +
// divider + nội dung. So với bản trước (chỉ có title/description trần) thì bản này thêm icon
// accent theo màu để mỗi "loại component" có nhận diện riêng, và hiệu ứng nổi nhẹ khi hover -
// nhìn chuyên nghiệp hơn, gần với phong cách các dashboard thương mại (vd Mira).
export default function DemoSection({ title, description, icon: Icon, color = "#2196F3", children }: DemoSectionProps) {
    const theme = useTheme();
    return (
        <Card sx={{ mb: 2.5, transition: "box-shadow .2s, transform .2s", "&:hover": { boxShadow: 6 } }}>
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    {Icon && (
                        <Box sx={{
                            width: 38, height: 38, borderRadius: theme.custom.iconRadius, flexShrink: 0,
                            bgcolor: `${color}1f`, display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <Icon sx={{ color, fontSize: 20 }} />
                        </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{title}</Typography>
                        {description && (
                            <Typography variant="body2" color="text.secondary">{description}</Typography>
                        )}
                    </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>{children}</Box>
            </CardContent>
        </Card>
    );
}
