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
