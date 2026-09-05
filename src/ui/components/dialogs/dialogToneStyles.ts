import { ElementType } from "react";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import { DialogTone } from "../../bloc/BlocApplication";

// Icon minh hoạ đầu tiêu đề dialog theo "tone" (xem DialogTone trong bloc/BlocApplication.ts).
// Confirm và Alert dùng bộ icon hơi khác nhau vì ngữ cảnh khác nhau: confirm là câu hỏi ("có chắc
// không?") nên mặc định dùng dấu hỏi, alert là thông báo nên mặc định dùng icon info.
export const CONFIRM_TONE_ICON: Record<DialogTone, ElementType> = {
    primary: HelpOutlineOutlined,
    info: InfoOutlined,
    success: CheckCircleOutlined,
    warning: WarningAmberOutlined,
    error: WarningAmberOutlined
};

export const ALERT_TONE_ICON: Record<DialogTone, ElementType> = {
    primary: InfoOutlined,
    info: InfoOutlined,
    success: CheckCircleOutlined,
    warning: WarningAmberOutlined,
    error: ErrorOutlineOutlined
};

// Style nút bấm dạng "pill" (bo tròn 999px) dùng chung cho MỌI Dialog form (Thêm mới/Sửa/Tải
// lên...) trong app, đồng bộ với 2 nút Có/Không của ConfirmDialog.tsx (2026-09-05, theo yêu cầu
// "sửa tất cả các dialog đều dùng loại này"). DIALOG_CANCEL_BUTTON_SX y hệt nút "Không" (xám đậm,
// cố định - Huỷ luôn trung tính bất kể tone của Dialog); DIALOG_PRIMARY_BUTTON_SX y hệt nút "Có"
// (tô màu qua prop color={tone} của Button, không phải qua sx).
export const DIALOG_CANCEL_BUTTON_SX = {
    borderRadius: 999, px: 2.5, bgcolor: 'grey.700', color: '#fff',
    '&:hover': { bgcolor: 'grey.800' }
} as const;

// Không cần tô màu ở đây - tô màu qua prop color={tone} có sẵn của MUI Button (giống hệt nút "Có"
// của ConfirmDialog.tsx), style pill chỉ cần đúng 1 style cố định dùng chung.
export const DIALOG_PRIMARY_BUTTON_SX = { borderRadius: 999, px: 2.5 } as const;

