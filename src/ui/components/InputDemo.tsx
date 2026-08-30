import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import Autocomplete from "@mui/material/Autocomplete";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import Typography from "@mui/material/Typography";
import InputOutlined from "@mui/icons-material/InputOutlined";
import DemoSection from "./common/DemoSection";

const TOP_OPTIONS = ['react', 'vue', 'angular', 'svelte'];

export default function InputDemo() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('input')} icon={InputOutlined} color="#4CAF50">
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}><TextField label={t('outlined')} variant="outlined" fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label={t('filled')} variant="filled" fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label={t('standard')} variant="standard" fullWidth /></Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label={t('search')}
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label={t('price')}
                        type="number"
                        fullWidth
                        InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyOutlined fontSize="small" /></InputAdornment> }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Autocomplete options={TOP_OPTIONS} renderInput={(params) => <TextField {...params} label={t('framework')} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Switch defaultChecked />} label={t('enable-notifications') as string} />
                </Grid>
                <Grid item xs={12}>
                    <Typography gutterBottom variant="body2">{t('volume')}</Typography>
                    <Slider defaultValue={40} valueLabelDisplay="auto" />
                </Grid>
            </Grid>
        </DemoSection>
    );
}
