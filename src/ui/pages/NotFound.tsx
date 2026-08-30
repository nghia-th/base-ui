import React from "react";
import SearchOffOutlined from "@mui/icons-material/SearchOffOutlined";
import StatusPage from "./StatusPage";

export function NotFound() {
    return <StatusPage code="404" titleKey="page-not-found" messageKey="page-not-found-message" icon={SearchOffOutlined} />;
}
export default NotFound;
