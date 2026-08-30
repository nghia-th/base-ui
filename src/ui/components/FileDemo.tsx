import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DemoSection from "./common/DemoSection";

export default function FileDemo() {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);

    return (
        <DemoSection title={t('file')} description={t('file-desc') as string}>
            <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])}
            />
            <Button variant="contained" startIcon={<UploadFileOutlined />} onClick={() => inputRef.current?.click()}>
                {t('choose-files')}
            </Button>

            {files.length > 0 && (
                <List sx={{ mt: 2 }}>
                    {files.map((f, i) => (
                        <ListItem
                            key={i}
                            secondaryAction={
                                <IconButton edge="end" onClick={() => setFiles((arr) => arr.filter((_, idx) => idx !== i))}>
                                    <CloseOutlined fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemIcon><InsertDriveFileOutlined /></ListItemIcon>
                            <ListItemText primary={f.name} secondary={`${(f.size / 1024).toFixed(1)} KB`} />
                        </ListItem>
                    ))}
                </List>
            )}
            <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <span>{t('upload-progress')}</span><span>60%</span>
                </Box>
                <LinearProgress variant="determinate" value={60} />
            </Box>
        </DemoSection>
    );
}
