import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocStudentLibrary, QuizStudentSubjectLite } from "../../bloc/BlocStudentLibrary";
import { QuizSubjectLibraryLink } from "../../../api/QuizLibraryApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Student "Textbook library" page (/app/student/library, 2026-09-05, "thu vien sach giao khoa"
// feature) - read-only: lists the student's own classroom's subjects (same GET /api/student/
// subjects endpoint Tests.tsx's practice-test picker already uses), and for whichever subject is
// clicked, shows the documents linked to it (StudentLibraryApi.java - the backend already checked
// the subject is in this student's own classroom, so nothing extra is filtered here) with a
// download button per document.
export default function StudentLibrary() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocStudentLibrary);
    const [openSubject, setOpenSubject] = useState<QuizStudentSubjectLite | null>(null);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    useEffect(() => {
        bloc.loadSubjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openDocuments = (subject: QuizStudentSubjectLite) => {
        setOpenSubject(subject);
        bloc.loadLinks(subject.id);
    };

    const download = (doc: QuizSubjectLibraryLink['document']) => {
        if (openSubject == null) return;
        bloc.downloadFile(openSubject.id, doc.id, `${doc.title}.pdf`, showError);
    };

    const view = (doc: QuizSubjectLibraryLink['document']) => {
        if (openSubject == null) return;
        bloc.viewFile(openSubject.id, doc.id, showError);
    };

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('subjects')}
            builder={(snapshot) => {
                const subjects: QuizStudentSubjectLite[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{t('quiz-admin-library')}</Typography>
                            {subjects.length === 0 && snapshot.data != null && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                                    <MenuBookOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                    <Typography variant="body1">{t('quiz-no-subjects')}</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {subjects.map((s) => (
                                    <ListItemButton key={s.id} onClick={() => openDocuments(s)} sx={{ borderRadius: 1, mb: 0.5 }}>
                                        <MenuBookOutlined sx={{ mr: 1.5, opacity: 0.7 }} fontSize="small" />
                                        <ListItemText primary={s.name} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Card>

                        <Dialog open={openSubject != null} onClose={() => setOpenSubject(null)} maxWidth="xs" fullWidth>
                            <DialogTitle>{openSubject?.name}</DialogTitle>
                            <DialogContent>
                                <UIStream
                                    initialData={null}
                                    stream={bloc.getStream('links')}
                                    builder={(linksSnap) => {
                                        const links: QuizSubjectLibraryLink[] = linksSnap.data ?? [];
                                        return (
                                            <List dense disablePadding>
                                                {links.map((l) => (
                                                    <ListItem
                                                        key={l.id}
                                                        secondaryAction={
                                                            <>
                                                                <IconButton size="small" onClick={() => view(l.document)}>
                                                                    <VisibilityOutlined fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" onClick={() => download(l.document)}>
                                                                    <DownloadOutlined fontSize="small" />
                                                                </IconButton>
                                                            </>
                                                        }
                                                    >
                                                        <ListItemText
                                                            primary={l.document.title}
                                                            secondary={`${t('quiz-library-grade')} ${l.document.grade} - ${l.document.curriculum}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                                {links.length === 0 && linksSnap.data != null && (
                                                    <Typography variant="body2" color="text.secondary">{t('quiz-library-no-documents')}</Typography>
                                                )}
                                            </List>
                                        );
                                    }}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenSubject(null)}>{t('close')}</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                );
            }}
        />
    );
}
