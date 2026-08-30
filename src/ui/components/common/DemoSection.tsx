import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface DemoSectionProps {
    title: string;
    children: React.ReactNode;
    description?: string;
}

// Khung dùng chung cho các trang demo UI-kit: 1 Card có tiêu đề + mô tả ngắn + nội dung.
export default function DemoSection({ title, description, children }: DemoSectionProps) {
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>
                )}
                <Box sx={{ mt: description ? 0 : 2 }}>{children}</Box>
            </CardContent>
        </Card>
    );
}
