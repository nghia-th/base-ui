import { createTheme, Theme } from "@mui/material/styles";

// Bảng màu chủ đạo tương ứng "componentTheme" trong AppConfig (giống template-ui, nơi người
// dùng chọn 1 trong nhiều accent color cho theme PrimeReact). Thêm màu mới ở đây khi cần.
export const COMPONENT_THEMES: Record<string, string> = {
    blue: "#2196F3",
    green: "#4CAF50",
    indigo: "#3F51B5",
    orange: "#FF9800",
    purple: "#9C27B0",
    teal: "#009688"
};

export function createAppTheme(colorScheme: "light" | "dark", componentTheme: string): Theme {
    const primary = COMPONENT_THEMES[componentTheme] ?? COMPONENT_THEMES.blue;
    const isDark = colorScheme === "dark";

    return createTheme({
        palette: {
            mode: colorScheme,
            primary: { main: primary },
            background: {
                default: isDark ? "#121212" : "#f4f6f8",
                paper: isDark ? "#1e1e1e" : "#ffffff"
            }
        },
        shape: { borderRadius: 8 },
        typography: {
            fontFamily: [
                "Roboto",
                "-apple-system",
                "BlinkMacSystemFont",
                "Segoe UI",
                "Helvetica Neue",
                "Arial",
                "sans-serif"
            ].join(",")
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: { boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }
                }
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: { borderRight: "none" }
                }
            },
            MuiButton: {
                defaultProps: { disableElevation: true }
            }
        }
    });
}
