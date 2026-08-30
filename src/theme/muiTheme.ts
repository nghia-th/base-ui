import { createTheme, Theme } from "@mui/material/styles";
import { darken, lighten, relativeLuminance, textOnColor, mixColors } from "./colorUtils";

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

export type VisualStyleKey = 'a' | 'b' | 'c';

interface SidebarTone {
    bg: string; ink: string; muted: string; activeBg: string; activeInk: string; border: string;
}

interface VisualStyleDef {
    name: string;
    fontUI: string;
    fontHead: string;
    fontMono: string;
    cardRadius: number;
    cardShadow: boolean;
    activeRadius: string;
    iconRadius: string;
    pageBg: { light: string; dark: string };
    cardBg: { light: string; dark: string };
    sidebar: { light: SidebarTone; dark: SidebarTone };
    defaultAccent: string;
}

// 3 "gói phong cách" (visual style) - tham khảo từ trang so sánh thiết kế đã cho anh xem.
// Mỗi gói định nghĩa: font chữ, bo góc, có/không đổ bóng card, hình dạng icon-chip, và bảng màu
// riêng cho sidebar (sidebar KHÔNG dùng background.default/paper thường mà có palette.sidebar
// riêng - xem AppSidebar.tsx/AppSlimMenu.tsx/AppMenuList.tsx).
export const VISUAL_STYLES: Record<VisualStyleKey, VisualStyleDef> = {
    a: {
        name: 'Structured Navy',
        fontUI: "'IBM Plex Sans', -apple-system, sans-serif",
        fontHead: "'IBM Plex Sans', -apple-system, sans-serif",
        fontMono: "'IBM Plex Mono', monospace",
        cardRadius: 12,
        cardShadow: true,
        activeRadius: '8px',
        iconRadius: '10px',
        pageBg: { light: '#f4f5f2', dark: '#0e141f' },
        cardBg: { light: '#ffffff', dark: '#161d2c' },
        sidebar: {
            light: { bg: '#122038', ink: '#dbe2ee', muted: '#7c8aa3', activeBg: '#1c2f4f', activeInk: '#ffffff', border: '#1d2c48' },
            dark: { bg: '#0b1526', ink: '#c9d3e4', muted: '#69758c', activeBg: '#16233c', activeInk: '#ffffff', border: '#182238' }
        },
        defaultAccent: 'teal'
    },
    b: {
        name: 'Quiet Mono',
        fontUI: "'Manrope', -apple-system, sans-serif",
        fontHead: "'Manrope', -apple-system, sans-serif",
        fontMono: "'JetBrains Mono', monospace",
        cardRadius: 10,
        cardShadow: false,
        activeRadius: '8px',
        iconRadius: '9px',
        pageBg: { light: '#ffffff', dark: '#121212' },
        cardBg: { light: '#ffffff', dark: '#1a1a1a' },
        sidebar: {
            light: { bg: '#ffffff', ink: '#33363d', muted: '#9a9da5', activeBg: '#f1f0fb', activeInk: '#3654ff', border: '#edece7' },
            dark: { bg: '#141414', ink: '#d8d8db', muted: '#84868c', activeBg: '#20233d', activeInk: '#8fa0ff', border: '#242424' }
        },
        defaultAccent: 'indigo'
    },
    c: {
        name: 'Warm Signal',
        fontUI: "'Work Sans', -apple-system, sans-serif",
        fontHead: "'Sora', -apple-system, sans-serif",
        fontMono: "'Work Sans', -apple-system, sans-serif",
        cardRadius: 16,
        cardShadow: true,
        activeRadius: '999px',
        iconRadius: '50%',
        pageBg: { light: '#f7f3ec', dark: '#211c15' },
        cardBg: { light: '#fffdf9', dark: '#2a241b' },
        sidebar: {
            light: { bg: '#f0e6d3', ink: '#3a3126', muted: '#8f8367', activeBg: '#e8622c', activeInk: '#fff8f0', border: '#e4d8bf' },
            dark: { bg: '#241f16', ink: '#e7ddc9', muted: '#95886b', activeBg: '#e8622c', activeInk: '#fff8f0', border: '#332b1e' }
        },
        defaultAccent: 'orange'
    }
};

// Vài màu nền gợi ý cho sidebar (độc lập với accent-color/visual-style) - hiện dạng ô màu trong
// AppConfigDrawer để chọn nhanh; người dùng vẫn có thể chọn màu tuỳ ý qua <input type="color">.
export const SIDEBAR_BG_PRESETS: string[] = [
    '#122038', // navy
    '#1f2430', // charcoal
    '#132a1f', // forest
    '#331327', // wine
    '#2d3140', // slate
    '#ffffff', // white
    '#f3ead9', // cream
    '#eef1f5'  // cloud
];

// Từ 1 màu nền sidebar tự chọn (bất kỳ, sáng hoặc tối), tự suy ra chữ/viền/trạng thái active sao
// cho luôn tương phản đọc được, không cần khai báo tay từng màu như VISUAL_STYLES.sidebar.
function sidebarToneFromBg(bg: string): SidebarTone {
    const isDark = relativeLuminance(bg) < 0.5;
    const ink = isDark ? lighten(bg, 0.88) : darken(bg, 0.88);
    const muted = isDark ? lighten(bg, 0.48) : darken(bg, 0.48);
    const border = isDark ? lighten(bg, 0.16) : darken(bg, 0.16);
    const activeBg = isDark ? lighten(bg, 0.14) : darken(bg, 0.08);
    const activeInk = textOnColor(activeBg);
    return { bg, ink, muted, activeBg, activeInk, border };
}

// "Hoà" màu nền sidebar theo màu accent (componentTheme) đang chọn: thay vì để nguyên bảng màu
// tĩnh của từng visual style (không liên quan gì đến accent), pha nhẹ nền/viền/chữ mờ theo hướng
// accent, và đổi hẳn màu active-item sang chính màu accent (tự chọn chữ trắng/đen theo độ sáng
// nền để luôn đọc được) - để khi người dùng đổi accent-color, leftmenu "đồng điệu" theo luôn.
export function harmonizeSidebarTone(base: SidebarTone, accent: string): SidebarTone {
    const isBaseDark = relativeLuminance(base.bg) < 0.5;
    const bg = mixColors(base.bg, accent, isBaseDark ? 0.14 : 0.08);
    const border = mixColors(base.border, accent, 0.35);
    const muted = mixColors(base.muted, accent, 0.22);
    const ink = mixColors(base.ink, accent, 0.08);
    const activeBg = isBaseDark ? mixColors(accent, '#000000', 0.1) : mixColors(accent, '#ffffff', 0.82);
    const activeInk = textOnColor(activeBg);
    return { bg, ink, muted, activeBg, activeInk, border };
}

export function createAppTheme(
    colorScheme: "light" | "dark",
    componentTheme: string,
    visualStyle: VisualStyleKey = 'a',
    sidebarSyncAccent: boolean = true,
    sidebarColor?: string | null
): Theme {
    const primary = COMPONENT_THEMES[componentTheme] ?? COMPONENT_THEMES.blue;
    const isDark = colorScheme === "dark";
    const style = VISUAL_STYLES[visualStyle] ?? VISUAL_STYLES.a;
    const styleSb = isDark ? style.sidebar.dark : style.sidebar.light;
    // Người dùng tự chọn màu nền sidebar (sidebarColor) thì ưu tiên màu đó thay cho màu mặc định
    // của visual style; nếu vẫn bật "sync accent" thì màu nền tự chọn này được hoà thêm với accent
    // (harmonizeSidebarTone) chứ không mất đi - 2 tính năng cộng dồn được với nhau.
    const baseSb = sidebarColor ? sidebarToneFromBg(sidebarColor) : styleSb;
    const sb = sidebarSyncAccent ? harmonizeSidebarTone(baseSb, primary) : baseSb;

    return createTheme({
        palette: {
            mode: colorScheme,
            primary: { main: primary },
            background: {
                default: isDark ? style.pageBg.dark : style.pageBg.light,
                paper: isDark ? style.cardBg.dark : style.cardBg.light
            },
            sidebar: sb
        },
        shape: { borderRadius: style.cardRadius },
        typography: {
            fontFamily: style.fontUI,
            h4: { fontWeight: 700, fontFamily: style.fontHead },
            h5: { fontWeight: 700, fontFamily: style.fontHead },
            h6: { fontWeight: 700, fontFamily: style.fontHead },
            subtitle1: { fontWeight: 700, fontFamily: style.fontHead }
        },
        custom: {
            visualStyle,
            fontMono: style.fontMono,
            cardShadow: style.cardShadow,
            activeRadius: style.activeRadius,
            iconRadius: style.iconRadius
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
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: { borderRadius: 8 }
                }
            },
            MuiCard: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: {
                        border: "1px solid",
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        boxShadow: style.cardShadow ? (isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)") : "none",
                        backgroundImage: "none"
                    }
                }
            },
            MuiChip: {
                styleOverrides: {
                    root: { fontWeight: 600 }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: { backgroundImage: "none" }
                }
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: { borderRadius: 4 }
                }
            }
        }
    });
}

// Mở rộng theme MUI để có palette.sidebar (bảng màu riêng cho sidebar/slim rail - KHÁC với
// background.default/paper của nội dung chính) và theme.custom (token riêng của base-ui: bo góc
// item active, hình dạng icon-chip, font mono cho số liệu, có/không đổ bóng card) - dùng được ở
// bất kỳ đâu qua useTheme() mà không cần truyền prop xuống từng trang.
declare module "@mui/material/styles" {
    interface Palette {
        sidebar: SidebarTone;
    }
    interface PaletteOptions {
        sidebar?: SidebarTone;
    }
    interface Theme {
        custom: {
            visualStyle: VisualStyleKey;
            fontMono: string;
            cardShadow: boolean;
            activeRadius: string;
            iconRadius: string;
        };
    }
    interface ThemeOptions {
        custom?: {
            visualStyle: VisualStyleKey;
            fontMono: string;
            cardShadow: boolean;
            activeRadius: string;
            iconRadius: string;
        };
    }
}
