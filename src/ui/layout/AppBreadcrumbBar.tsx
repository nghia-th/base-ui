import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import { BreadcrumbItem } from "../AppMenuData";

interface AppBreadcrumbBarProps {
    breadcrumb: BreadcrumbItem[];
}

// Thay cho AppBreadcrumb.js: tìm entry khớp path hiện tại trong breadcrumb data (do BlocApp cung cấp)
// rồi render dạng MUI Breadcrumbs "Trang chủ / Nhóm cha / Trang hiện tại".
export default function AppBreadcrumbBar({ breadcrumb }: AppBreadcrumbBarProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const current = breadcrumb.find((b) => b.path === location.pathname);

    if (!current || location.pathname === "/") return null;

    return (
        <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/" color="inherit" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <HomeOutlined fontSize="small" />
                {t('dashboard')}
            </Link>
            {current.parent && current.parent !== 'dashboard' && (
                <Typography color="text.secondary">{t(current.parent)}</Typography>
            )}
            <Typography color="text.primary">{t(current.label)}</Typography>
        </Breadcrumbs>
    );
}
