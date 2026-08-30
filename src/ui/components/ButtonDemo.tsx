import React from "react";
import { useTranslation } from "react-i18next";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Fab from "@mui/material/Fab";
import ButtonGroup from "@mui/material/ButtonGroup";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import FavoriteOutlined from "@mui/icons-material/FavoriteOutlined";
import DemoSection from "./common/DemoSection";

const COLORS = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

export default function ButtonDemo() {
    const { t } = useTranslation();
    return (
        <>
            <DemoSection title={t('button')}>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {COLORS.map((c) => <Button key={c} variant="contained" color={c}>{t(c)}</Button>)}
                </Stack>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {COLORS.map((c) => <Button key={c} variant="outlined" color={c}>{t(c)}</Button>)}
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button variant="contained" startIcon={<AddOutlined />}>{t('add')}</Button>
                    <Button variant="contained" color="error" startIcon={<DeleteOutlined />}>{t('delete')}</Button>
                    <Button variant="contained" disabled>{t('disabled')}</Button>
                    <ButtonGroup variant="outlined">
                        <Button>{t('one')}</Button>
                        <Button>{t('two')}</Button>
                        <Button>{t('three')}</Button>
                    </ButtonGroup>
                </Stack>
            </DemoSection>
            <DemoSection title={t('icon-fab-buttons')}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton color="primary"><FavoriteOutlined /></IconButton>
                    <IconButton color="error"><DeleteOutlined /></IconButton>
                    <Fab color="primary" size="small"><AddOutlined /></Fab>
                    <Fab color="secondary" variant="extended">
                        <AddOutlined sx={{ mr: 1 }} /> {t('create')}
                    </Fab>
                </Stack>
            </DemoSection>
        </>
    );
}
