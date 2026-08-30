import React from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { ConfirmProps } from "../../bloc/BlocApplication";

interface ConfirmDialogProps {
    info: ConfirmProps | null;
}

export default function ConfirmDialog({ info }: ConfirmDialogProps) {
    const { t } = useTranslation();
    if (!info) return null;

    const answer = (action: 'yes' | 'no') => {
        setTimeout(() => info.onCallBack?.({ action }));
        info.onHide?.(info);
    };

    return (
        <Dialog open={!!info.isShow} onClose={() => answer('no')} maxWidth="xs" fullWidth>
            <DialogTitle>{t(info.title ?? 'title')}</DialogTitle>
            <DialogContent>
                <div dangerouslySetInnerHTML={{ __html: t(info.message ?? '') as string }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => answer('no')} color="inherit">{t(info.labelNo ?? 'no')}</Button>
                <Button onClick={() => answer('yes')} color="error" variant="contained" autoFocus>{t(info.labelYes ?? 'yes')}</Button>
            </DialogActions>
        </Dialog>
    );
}
