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
import Stack from "@mui/material/Stack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocStudentLibrary, QuizStudentSubjectLite } from "../../bloc/BlocStudentLibrary";
import { QuizLibraryDocument, QuizSubjectLibraryLink } from "../../../api/QuizLibraryApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// grade/curriculum co the null (2026-09-06 revision) - cung helper nhu SubjectLibraryDialog.tsx
// (khong import cheo giua trang Phu huynh/Hoc sinh, moi noi tu khai bao rieng theo dung convention
// cua file nay).
function taxonomyLabel(t: (key: string, opts?: any) => string, doc: QuizLibraryDocument): string {
    if (doc.grade == null && doc.curriculum == null) return t('quiz-library-uncategorized');
    if (doc.grade == null) return doc.curriculum as string;
    if (doc.curriculum == null) return `${t('quiz-library-grade')} ${doc.grade}`;
    return `${t('quiz-library-grade')} ${doc.grade} - ${doc.curriculum}`;
}

// Student "Textbook/course library" page (/app/student/library, 2026-09-05, "thu vien sach giao
// khoa" feature; mo rong 2026-09-06 - moi document co the co nhieu file) - read-only: lists the
// student's own classroom's subjects (same GET /api/student/subjects endpoint Tests.tsx's
// practice-test picker already uses), and for whichever subject is clicked, shows the documents
// linked to it (StudentLibraryApi.java - the backend already checked the subject is in this
// student's own classroom, so nothing extra is filtered here) with a flat per-file view/download
// list (no collapse/expand, same reasoning as SubjectLibraryDialog.tsx).
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

    const download = (doc: QuizLibraryDocument, fileId: number, filename: string) => {
        if (openSubject == null) return;
        bloc.downloadFile(openSubject.id, doc.id, fileId, filename, showError);
    };

    const view = (doc: QuizLibraryDocument, fileId: number) => {
        if (openSubject == null) return;
        bloc.viewFile(openSubject.id, doc.id, fileId, showError);
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

                        <AppDialog open={openSubject != null} onClose={() => setOpenSubject(null)} maxWidth="xs" title={openSubject?.name} icon={MenuBookOutlined}>
                            <DialogContent>
                                <UIStream
                                    initialData={null}
                                    stream={bloc.getStream('links')}
                                    builder={(linksSnap) => {
                                        const links: QuizSubjectLibraryLink[] = linksSnap.data ?? [];
                                        return (
                                            <List dense disablePadding>
                                                {links.map((l) => (
                                                    <ListItem key={l.id} divider alignItems="flex-start">
                                                        <Stack sx={{ width: '100%' }}>
                                                            <ListItemText
                                                                primary={l.document.title}
                                                                secondary={taxonomyLabel(t, l.document)}
                                                            />
                                                            {l.document.files.length === 0 && (
                                                                <Typography variant="caption" color="text.secondary">{t('quiz-library-no-files-yet')}</Typography>
                                                            )}
                                                            {l.document.files.map((f) => (
                                                                <Stack key={f.id} direction="row" alignItems="center" spacing={0.5} sx={{ pl: 1 }}>
                                                                    <InsertDriveFileOutlined fontSize="inherit" sx={{ opacity: 0.6 }} />
                                                                    <Typography variant="body2" sx={{ flex: 1 }} noWrap>{f.originalName}</Typography>
                                                                    <IconButton size="small" onClick={() => view(l.document, f.id)}>
                                                                        <VisibilityOutlined fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={() => download(l.document, f.id, f.originalName)}>
                                                                        <DownloadOutlined fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            ))}
                                                        </Stack>
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
                                <Button onClick={() => setOpenSubject(null)} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
                            </DialogActions>
                        </AppDialog>
                    </>
                );
            }}
        />
    );
}
