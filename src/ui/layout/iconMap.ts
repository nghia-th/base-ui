import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import WidgetsOutlined from "@mui/icons-material/WidgetsOutlined";
import ViewAgendaOutlined from "@mui/icons-material/ViewAgendaOutlined";
import InputOutlined from "@mui/icons-material/InputOutlined";
import LabelOutlined from "@mui/icons-material/LabelOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import SmartButtonOutlined from "@mui/icons-material/SmartButtonOutlined";
import TableChartOutlined from "@mui/icons-material/TableChartOutlined";
import ViewListOutlined from "@mui/icons-material/ViewListOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import ViewCompactOutlined from "@mui/icons-material/ViewCompactOutlined";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import PermMediaOutlined from "@mui/icons-material/PermMediaOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import MarkChatUnreadOutlined from "@mui/icons-material/MarkChatUnreadOutlined";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import MoreHorizOutlined from "@mui/icons-material/MoreHorizOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import EmojiSymbolsOutlined from "@mui/icons-material/EmojiSymbolsOutlined";
import AutoAwesomeMosaicOutlined from "@mui/icons-material/AutoAwesomeMosaicOutlined";
import TableRowsOutlined from "@mui/icons-material/TableRowsOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import TimelineOutlined from "@mui/icons-material/TimelineOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import FiberManualRecordOutlined from "@mui/icons-material/FiberManualRecordOutlined";
import LinearScaleOutlined from "@mui/icons-material/LinearScaleOutlined";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

// Map tên icon (string, lưu trong AppMenuData.ts) -> component icon MUI thật.
// Thêm icon mới vào đây khi thêm menu item dùng icon chưa có trong danh sách.
export const ICON_MAP: Record<string, SvgIconComponent> = {
    DashboardOutlined,
    WidgetsOutlined,
    ViewAgendaOutlined,
    InputOutlined,
    LabelOutlined,
    ErrorOutlineOutlined,
    SmartButtonOutlined,
    TableChartOutlined,
    ViewListOutlined,
    AccountTreeOutlined,
    ViewCompactOutlined,
    LayersOutlined,
    PermMediaOutlined,
    MenuOutlined,
    MarkChatUnreadOutlined,
    AttachFileOutlined,
    BarChartOutlined,
    MoreHorizOutlined,
    BuildOutlined,
    EmojiSymbolsOutlined,
    AutoAwesomeMosaicOutlined,
    TableRowsOutlined,
    CalendarMonthOutlined,
    TimelineOutlined,
    ReceiptLongOutlined,
    HelpOutlineOutlined,
    InsertDriveFileOutlined,
    MenuBookOutlined,
    LinearScaleOutlined,
    AccountCircleOutlined
};

export function getIcon(name?: string | null): SvgIconComponent {
    if (!name) return FiberManualRecordOutlined;
    return ICON_MAP[name] ?? FiberManualRecordOutlined;
}
