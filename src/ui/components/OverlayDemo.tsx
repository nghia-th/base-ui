import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DemoSection from "./common/DemoSection";

export default function OverlayDemo() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    return (
        <DemoSection title={t('overlay')}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => setDialogOpen(true)}>{t('open-dialog')}</Button>
                <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>{t('open-popover')}</Button>
                <Tooltip title={t('this-is-a-tooltip') as string}>
                    <Button variant="outlined">{t('hover-me')}</Button>
                </Tooltip>
                <Button variant="outlined" onClick={() => setDrawerOpen(true)}>{t('open-drawer')}</Button>
            </Stack>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>{t('dialog-title')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('panel-content-placeholder')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>{t('close')}</Button>
                </DialogActions>
            </Dialog>

            <Popover open={!!anchorEl} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <Box sx={{ p: 2, maxWidth: 240 }}>
                    <Typography variant="body2">{t('panel-content-placeholder')}</Typography>
                </Box>
            </Popover>

            <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{t('open-drawer')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('panel-content-placeholder')}</Typography>
                </Box>
            </Drawer>
        </DemoSection>
    );
}
