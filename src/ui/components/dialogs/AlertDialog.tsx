import React from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { AlertProps } from "../../bloc/BlocApplication";
import { ALERT_TONE_ICON } from "./dialogToneStyles";

interface AlertDialogProps {
    info: AlertProps | null;
}

// Cùng phong cách với ConfirmDialog.tsx (header màu theo tone + icon minh hoạ, nút pill), nhưng
// alert chỉ có 1 nút đóng duy nhất vì đây là thông báo, không phải câu hỏi cần trả lời có/không.
export default function AlertDialog({ info }: AlertDialogProps) {
    const { t } = useTranslation();
    if (!info) return null;

    // Tương thích ngược: trước đây chỉ có info.type===2 nghĩa là "lỗi" (đổi màu tiêu đề) - giờ
    // dùng "tone" rõ ràng hơn, nhưng vẫn suy ra tone='error' từ type=2 cũ nếu tone không được set.
    const tone = info.tone ?? (info.type === 2 ? 'error' : 'primary');
    const ToneIcon = ALERT_TONE_ICON[tone];

    const handleClose = () => {
        setTimeout(() => info.onCallBack?.({ action: 'close' }));
        info.onHide?.(info);
    };

    return (
        <Dialog
            open={!!info.isShow}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 1.5, overflow: 'hidden' } }}
        >
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.75,
                    bgcolor: `${tone}.main`, color: `${tone}.contrastText`
                }}
            >
                <ToneIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
                    {t(info.title ?? 'notification')}
                </Typography>
                <IconButton
                    size="small"
                    onClick={handleClose}
                    sx={{
                        color: 'inherit', width: 26, height: 26,
                        border: '1.5px solid', borderColor: 'rgba(255,255,255,0.5)'
                    }}
                >
                    <CloseOutlined sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
            <DialogContent sx={{ pt: 3 }}>
                <div dangerouslySetInnerHTML={{ __html: t(info.message ?? '') as string }} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={handleClose}
                    variant="contained"
                    color={tone}
                    startIcon={<CloseOutlined />}
                    autoFocus
                    sx={{ borderRadius: 999, px: 2.5 }}
                >
                    {t(info.label ?? 'close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
