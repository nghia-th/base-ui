import React from "react";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import StatusPage from "./StatusPage";

export function AccessDenied() {
    return <StatusPage code="403" titleKey="access-denied" messageKey="access-denied-message" icon={BlockOutlined} color="warning.main" />;
}
export default AccessDenied;
