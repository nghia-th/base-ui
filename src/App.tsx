import React, { useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SnackbarProvider } from "notistack";
import { BlocApplication } from "./ui/bloc/BlocApplication";
import AppWrapper from "./AppWrapper";
import { createAppTheme } from "./theme/muiTheme";
import "./ui/i18next/i18next";

// Root component: 1 instance BlocApplication sống suốt vòng đời app (giống module-ui/src/index.tsx),
// ThemeProvider mặc định (light) bọc ngoài cho Login/Error/NotFound - AppShell sẽ tự bọc
// ThemeProvider riêng theo theme người dùng chọn (BlocApp) sau khi đăng nhập.
export default function App() {
    const app = useMemo(() => new BlocApplication(), []);
    const defaultTheme = useMemo(() => createAppTheme('light', 'blue'), []);

    return (
        <ThemeProvider theme={defaultTheme}>
            <CssBaseline />
            <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <BrowserRouter>
                    <AppWrapper app={app} />
                </BrowserRouter>
            </SnackbarProvider>
        </ThemeProvider>
    );
}
