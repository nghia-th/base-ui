import React, { ElementType, ReactNode } from "react";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { DialogTone } from "../../bloc/BlocApplication";

interface AppDialogProps {
    open: boolean;
    onClose: () => void;
    // ReactNode (không phải translation key thuần) - để gọi được với tiêu đề GHÉP (ví dụ
    // `{t('quiz-library-browse')} - {subjectName}` ở SubjectLibraryDialog.tsx), không chỉ 1 key
    // dịch tĩnh. Caller tự gọi t(...) trước khi truyền vào, giống hệt cách DialogTitle cũ vẫn làm.
    title: ReactNode;
    icon: ElementType;
    tone?: DialogTone;
    maxWidth?: DialogProps['maxWidth'];
    fullWidth?: boolean;
    children: ReactNode;
}

// Header đồng bộ với ConfirmDialog.tsx/AlertDialog.tsx (thanh màu theo tone + icon minh hoạ +
// nút đóng tròn viền, Paper bo góc 12px) - trích ra thành 1 component dùng chung theo yêu cầu của
// anh (2026-09-05, "sửa tất cả các dialog đều dùng loại này") để MỌI Dialog form (Thêm mới/Sửa/
// Tải lên...) trong app có cùng phong cách với dialog xác nhận Có/Không, thay vì lặp lại nguyên
// khối header này ở từng trang. Chỉ thay thế phần <Dialog>+<DialogTitle> - phần thân
// (DialogContent/DialogActions) vẫn do trang gọi tự truyền vào qua children, không đổi cấu trúc
// nội dung/logic của từng Dialog.
export default function AppDialog({ open, onClose, title, icon: Icon, tone = 'primary', maxWidth = 'xs', fullWidth = true, children }: AppDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{ sx: { borderRadius: 1.5, overflow: 'hidden' } }}
        >
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.75,
                    bgcolor: `${tone}.main`, color: `${tone}.contrastText`
                }}
            >
                <Icon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
                    {title}
                </Typography>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        color: 'inherit', width: 26, height: 26,
                        border: '1.5px solid', borderColor: 'rgba(255,255,255,0.5)'
                    }}
                >
                    <CloseOutlined sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
            {children}
        </Dialog>
    );
}
