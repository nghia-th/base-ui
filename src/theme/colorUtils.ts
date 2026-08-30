// Vài hàm màu nhỏ gọn (không thêm thư viện ngoài) dùng để "hoà" màu nền sidebar với màu accent
// (componentTheme) người dùng chọn - xem harmonizeSidebarTone() trong muiTheme.ts.

function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const num = parseInt(full, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
    const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}

// Trộn 2 màu hex theo tỉ lệ weight (0 = hexA nguyên bản, 1 = hexB nguyên bản).
export function mixColors(hexA: string, hexB: string, weight: number): string {
    const w = Math.max(0, Math.min(1, weight));
    const [r1, g1, b1] = hexToRgb(hexA);
    const [r2, g2, b2] = hexToRgb(hexB);
    return rgbToHex(r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w);
}

// Độ sáng tương đối (WCAG) - dùng để biết 1 màu nền là "tối" hay "sáng" và chọn màu chữ tương phản.
export function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Trả về màu chữ (trắng/đen ngả) tương phản tốt trên nền hex truyền vào.
export function textOnColor(hex: string): string {
    return relativeLuminance(hex) > 0.45 ? '#17171a' : '#ffffff';
}

// Làm sáng/tối 1 màu hex đi amt (0..1) bằng cách pha thêm trắng/đen - dùng để tự suy ra
// chữ/viền/trạng thái active từ 1 màu nền sidebar bất kỳ người dùng tự chọn.
export function lighten(hex: string, amt: number): string {
    return mixColors(hex, '#ffffff', amt);
}
export function darken(hex: string, amt: number): string {
    return mixColors(hex, '#000000', amt);
}
