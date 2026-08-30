import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlined from "@mui/icons-material/TrendingDownOutlined";

interface StatCardProps {
    icon: React.ElementType;
    color: string;
    label: React.ReactNode;
    value: React.ReactNode;
    trend?: number;
    trendLabel?: string;
    badge?: string;
    highlighted?: boolean;
}

// Stat card dùng chung cho Dashboard (và có thể tái dùng ở trang khác): icon trong khối màu,
// badge nhỏ góc phải (vd "Monthly"), giá trị lớn, và chip xu hướng tăng/giảm màu xanh/đỏ kèm
// mô tả - tham khảo bố cục các stat card của Mira (mira.bootlab.io) để thay cho card trần cũ.
export default function StatCard({ icon: Icon, color, label, value, trend, trendLabel, badge, highlighted }: StatCardProps) {
    const theme = useTheme();
    const positive = (trend ?? 0) >= 0;
    return (
        <Card
            sx={{
                height: "100%",
                ...(highlighted ? { bgcolor: `${color}12`, borderColor: `${color}55` } : {})
            }}
        >
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: theme.custom.iconRadius, bgcolor: `${color}22`,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Icon sx={{ color }} />
                    </Box>
                    {badge && (
                        <Chip
                            label={badge}
                            size="small"
                            sx={{ bgcolor: `${color}22`, color, fontWeight: 700, height: 22 }}
                        />
                    )}
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily: theme.custom.fontMono, fontVariantNumeric: "tabular-nums" }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: trend !== undefined ? 1 : 0 }}>
                    {label}
                </Typography>
                {trend !== undefined && (
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                        <Chip
                            size="small"
                            icon={positive ? <TrendingUpOutlined sx={{ fontSize: 15 }} /> : <TrendingDownOutlined sx={{ fontSize: 15 }} />}
                            label={`${positive ? "+" : ""}${trend}%`}
                            color={positive ? "success" : "error"}
                            sx={{ height: 22, "& .MuiChip-label": { px: 0.8, fontSize: 12 } }}
                        />
                        {trendLabel && (
                            <Typography variant="caption" color="text.secondary">{trendLabel}</Typography>
                        )}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
