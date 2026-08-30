import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import FavoriteOutlined from "@mui/icons-material/FavoriteOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import DemoSection from "./common/DemoSection";

export default function MenuDemo() {
    const { t } = useTranslation();
    const [tab, setTab] = useState(0);
    const [bottomNav, setBottomNav] = useState(0);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <DemoSection title={t('tabs')}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label={t('overview') as string} />
                        <Tab label={t('settings') as string} />
                        <Tab label={t('help') as string} />
                    </Tabs>
                    <Box sx={{ py: 2, color: 'text.secondary' }}>{t('panel-content-placeholder')}</Box>
                </DemoSection>
            </Grid>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('context-menu')}>
                    <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>{t('open-menu')}</Button>
                    <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => setAnchorEl(null)}>{t('edit')}</MenuItem>
                        <MenuItem onClick={() => setAnchorEl(null)}>{t('duplicate')}</MenuItem>
                        <MenuItem onClick={() => setAnchorEl(null)}>{t('delete')}</MenuItem>
                    </Menu>
                </DemoSection>
            </Grid>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('bottom-navigation')}>
                    <BottomNavigation value={bottomNav} onChange={(_, v) => setBottomNav(v)} showLabels sx={{ borderRadius: 2 }}>
                        <BottomNavigationAction label={t('dashboard') as string} icon={<HomeOutlined />} />
                        <BottomNavigationAction label={t('favorites') as string} icon={<FavoriteOutlined />} />
                        <BottomNavigationAction label={t('account') as string} icon={<PersonOutline />} />
                    </BottomNavigation>
                </DemoSection>
            </Grid>
        </Grid>
    );
}
