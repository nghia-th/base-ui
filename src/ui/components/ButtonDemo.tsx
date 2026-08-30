import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Fab from "@mui/material/Fab";
import ButtonGroup from "@mui/material/ButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import FavoriteOutlined from "@mui/icons-material/FavoriteOutlined";
import SmartButtonOutlined from "@mui/icons-material/SmartButtonOutlined";
import TouchAppOutlined from "@mui/icons-material/TouchAppOutlined";
import FormatAlignLeftOutlined from "@mui/icons-material/FormatAlignLeftOutlined";
import FormatAlignCenterOutlined from "@mui/icons-material/FormatAlignCenterOutlined";
import FormatAlignRightOutlined from "@mui/icons-material/FormatAlignRightOutlined";
import FileCopyOutlined from "@mui/icons-material/FileCopyOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import PrintOutlined from "@mui/icons-material/PrintOutlined";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import DemoSection from "./common/DemoSection";

const COLORS = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

const SPEED_DIAL_ACTIONS = [
    { icon: <FileCopyOutlined />, nameKey: 'duplicate' },
    { icon: <SaveOutlined />, nameKey: 'save' },
    { icon: <PrintOutlined />, nameKey: 'print' },
    { icon: <ShareOutlined />, nameKey: 'share' }
];

export default function ButtonDemo() {
    const { t } = useTranslation();
    const [alignment, setAlignment] = useState('left');
    return (
        <>
            <DemoSection title={t('button')} icon={SmartButtonOutlined} color="#2196F3">
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
            <DemoSection title={t('icon-fab-buttons')} icon={TouchAppOutlined} color="#9C27B0">
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton color="primary"><FavoriteOutlined /></IconButton>
                    <IconButton color="error"><DeleteOutlined /></IconButton>
                    <Fab color="primary" size="small"><AddOutlined /></Fab>
                    <Fab color="secondary" variant="extended">
                        <AddOutlined sx={{ mr: 1 }} /> {t('create')}
                    </Fab>
                </Stack>
            </DemoSection>
            <DemoSection title={t('toggle-buttons')} icon={FormatAlignCenterOutlined} color="#4CAF50">
                <ToggleButtonGroup
                    value={alignment}
                    exclusive
                    onChange={(_, v) => v && setAlignment(v)}
                >
                    <ToggleButton value="left"><FormatAlignLeftOutlined fontSize="small" /></ToggleButton>
                    <ToggleButton value="center"><FormatAlignCenterOutlined fontSize="small" /></ToggleButton>
                    <ToggleButton value="right"><FormatAlignRightOutlined fontSize="small" /></ToggleButton>
                </ToggleButtonGroup>
            </DemoSection>
            <DemoSection title={t('speed-dial')} icon={AddOutlined} color="#FF5722" description={t('speed-dial-desc')}>
                <Box sx={{ position: 'relative', height: 220 }}>
                    <SpeedDial
                        ariaLabel="SpeedDial"
                        sx={{ position: 'absolute', bottom: 8, right: 8 }}
                        icon={<SpeedDialIcon />}
                    >
                        {SPEED_DIAL_ACTIONS.map((action) => (
                            <SpeedDialAction
                                key={action.nameKey}
                                icon={action.icon}
                                tooltipTitle={t(action.nameKey) as string}
                            />
                        ))}
                    </SpeedDial>
                </Box>
            </DemoSection>
        </>
    );
}
