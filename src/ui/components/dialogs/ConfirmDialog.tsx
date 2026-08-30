import React from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { ConfirmProps } from "../../bloc/BlocApplication";
import { CONFIRM_TONE_ICON } from "./dialogToneStyles";

interface ConfirmDialogProps {
    info: ConfirmProps | null;
}

// Thay cho dialog phẳng mặc định của MUI (chỉ có DialogTitle/Content/Actions trơn): header có
// màu + icon minh hoạ theo "tone" (mặc định "primary" - tức ăn theo ĐÚNG màu component/accent
// người dùng đang chọn ở AppConfigDrawer, vì "primary" ở đây trỏ thẳng vào theme.palette.primary -
// xem DialogTone trong bloc/BlocApplication.ts), 2 nút dạng pill có icon: "Có" tô theo tone, "Đóng"
// trung tính (xám đậm) - phong cách giống dialog xác nhận quen thuộc bên module-ui nhưng màu lấy
// động theo theme thay vì cố định cứng.
export default function ConfirmDialog({ info }: ConfirmDialogProps) {
    const { t } = useTranslation();
    if (!info) return null;

    const tone = info.tone ?? 'primary';
    const ToneIcon = CONFIRM_TONE_ICON[tone];

    const answer = (action: 'yes' | 'no') => {
        setTimeout(() => info.onCallBack?.({ action }));
        info.onHide?.(info);
    };

    return (
        <Dialog
            open={!!info.isShow}
            onClose={() => answer('no')}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.75,
                    bgcolor: `${tone}.main`, color: `${tone}.contrastText`
                }}
            >
                <ToneIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
                    {t(info.title ?? 'title')}
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => answer('no')}
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
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button
                    onClick={() => answer('no')}
                    variant="contained"
                    startIcon={<CloseOutlined />}
                    sx={{
                        borderRadius: 999, px: 2.5, bgcolor: 'grey.700', color: '#fff',
                        '&:hover': { bgcolor: 'grey.800' }
                    }}
                >
                    {t(info.labelNo ?? 'no')}
                </Button>
                <Button
                    onClick={() => answer('yes')}
                    variant="contained"
                    color={tone}
                    startIcon={<CheckOutlined />}
                    autoFocus
                    sx={{ borderRadius: 999, px: 2.5 }}
                >
                    {t(info.labelYes ?? 'yes')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
