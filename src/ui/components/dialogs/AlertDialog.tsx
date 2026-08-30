import React from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { AlertProps } from "../../bloc/BlocApplication";

interface AlertDialogProps {
    info: AlertProps | null;
}

// Thay cho Alert.js (PrimeReact Dialog) - nhận info từ stream "dialogAlert" của BlocApplication
// qua UIStream, không có state nội bộ nào khác.
export default function AlertDialog({ info }: AlertDialogProps) {
    const { t } = useTranslation();
    if (!info) return null;

    const handleClose = () => {
        setTimeout(() => info.onCallBack?.({ action: 'close' }));
        info.onHide?.(info);
    };

    return (
        <Dialog open={!!info.isShow} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle color={info.type === 2 ? 'error' : undefined}>
                {t(info.title ?? 'notification')}
            </DialogTitle>
            <DialogContent>
                <div dangerouslySetInnerHTML={{ __html: t(info.message ?? '') as string }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} autoFocus>{t(info.label ?? 'close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
