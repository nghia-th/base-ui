import React from "react";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Avatar from "@mui/material/Avatar";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import DemoSection from "./common/DemoSection";

const CONTACTS = ['Nguyen Van A', 'Tran Thi B', 'Le Van C', 'Pham Thi D'];
const TASKS = ['task-design', 'task-develop', 'task-test', 'task-deploy'];

export default function ListDemo() {
    const { t } = useTranslation();
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('contact-list')}>
                    <List>
                        {CONTACTS.map((name, i) => (
                            <React.Fragment key={name}>
                                <ListItem>
                                    <ListItemAvatar><Avatar>{name.charAt(0)}</Avatar></ListItemAvatar>
                                    <ListItemText primary={name} secondary={`${name.toLowerCase().replace(/\s/g, '.')}@example.com`} />
                                </ListItem>
                                {i < CONTACTS.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </DemoSection>
            </Grid>
            <Grid item xs={12} md={6}>
                <DemoSection title={t('checklist')}>
                    <List>
                        {TASKS.map((task) => (
                            <ListItem key={task} disablePadding>
                                <ListItemButton>
                                    <ListItemIcon><Checkbox edge="start" /></ListItemIcon>
                                    <ListItemText primary={t(task)} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DemoSection>
            </Grid>
        </Grid>
    );
}
