import React from "react";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import StatusPage from "./StatusPage";

export function ErrorPage() {
    return <StatusPage code="500" titleKey="something-went-wrong" messageKey="error-page-message" icon={ErrorOutlineOutlined} color="error.main" />;
}
export default ErrorPage;
