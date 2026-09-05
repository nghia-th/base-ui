import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import LinkOffOutlined from "@mui/icons-material/LinkOffOutlined";
import UIStream from "./UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";
import { BlocParentSubjects } from "../../bloc/BlocParentSubjects";
import { QuizLibraryDocument, QuizSubjectLibraryLink } from "../../../api/QuizLibraryApi";

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRICULA = ["Kết nối tri thức", "Chân trời sáng tạo", "Cánh diều"];

interface SubjectLibraryDialogProps {
    bloc: BlocParentSubjects;
    subjectId: number | null;
    subjectName: string;
    open: boolean;
    onClose: () => void;
}

// Parent-side textbook library dialog (2026-09-05, "thu vien sach giao khoa" feature) - opened
// per-subject from Subjects.tsx (MenuBookOutlined icon on each subject row). Uses the SAME
// BlocParentSubjects instance as the page (passed down as a prop) rather than its own bloc, since
// reUseBlocContent only keeps one "content" bloc per page (see AppContext.ts) - see the
// 'library_links'/'library_catalog' methods added at the bottom of BlocParentSubjects.ts.
// Shows the subject's already-linked documents on top (unlink/download), and the filterable whole
// catalog below to link new ones - a document already linked is marked instead of offering Link
// again (QUIZ_035 LIBRARY_ALREADY_LINKED would otherwise be a common, avoidable error).
export default function SubjectLibraryDialog({ bloc, subjectId, subjectName, open, onClose }: SubjectLibraryDialogProps) {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const [grade, setGrade] = useState<number | ''>('');
    const [curriculum, setCurriculum] = useState('');
    const [subjectNameFilter, setSubjectNameFilter] = useState('');

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    useEffect(() => {
        if (open && subjectId != null) {
            bloc.loadLibraryLinks(subjectId);
            bloc.browseLibrary();
            setGrade('');
            setCurriculum('');
            setSubjectNameFilter('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, subjectId]);

    const runFilter = () => {
        bloc.browseLibrary(grade === '' ? undefined : grade, subjectNameFilter || undefined, curriculum || undefined);
    };

    const link = (documentId: number) => {
        if (subjectId == null) return;
        bloc.linkLibrary(subjectId, documentId, () => {
            enqueueSnackbar(t('quiz-library-linked-success') as string, { variant: 'success' });
        }, showError);
    };

    const unlink = (documentId: number) => {
        if (subjectId == null) return;
        bloc.confirm({
            title: 'delete',
            message: 'quiz-library-unlink-confirm',
            onYes: () => {
                bloc.unlinkLibrary(subjectId, documentId, () => {
                    enqueueSnackbar(t('quiz-library-unlinked-success') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const download = (doc: QuizLibraryDocument) => {
        if (subjectId == null) return;
        bloc.downloadLibraryFile(subjectId, doc.id, `${doc.title}.pdf`, showError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('quiz-library-browse')} - {subjectName}</DialogTitle>
            <DialogContent>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>{t('quiz-library-linked-documents')}</Typography>
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('library_links')}
                    builder={(snapshot) => {
                        const links: QuizSubjectLibraryLink[] = snapshot.data ?? [];
                        // Plain computation, not useMemo - builder() runs inside UIStream's class
                        // component render(), not this component's own render, so hooks cannot be
                        // called here (would break the Rules of Hooks / throw at runtime).
                        const linkedIds = new Set(links.map((l) => l.document.id));
                        return (
                            <>
                                <List dense disablePadding sx={{ mb: 2 }}>
                                    {links.map((l) => (
                                        <ListItem
                                            key={l.id}
                                            secondaryAction={
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton size="small" onClick={() => download(l.document)}>
                                                        <DownloadOutlined fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => unlink(l.document.id)}>
                                                        <LinkOffOutlined fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            }
                                        >
                                            <ListItemText
                                                primary={l.document.title}
                                                secondary={`${t('quiz-library-grade')} ${l.document.grade} - ${l.document.curriculum}`}
                                            />
                                        </ListItem>
                                    ))}
                                    {links.length === 0 && snapshot.data != null && (
                                        <Typography variant="body2" color="text.secondary">{t('quiz-library-no-documents')}</Typography>
                                    )}
                                </List>

                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('quiz-library-browse')}</Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                    <TextField
                                        select
                                        size="small"
                                        label={t('quiz-library-grade')}
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                                        sx={{ width: 100 }}
                                    >
                                        <MenuItem value="">{t('all')}</MenuItem>
                                        {GRADES.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select
                                        size="small"
                                        label={t('quiz-library-curriculum')}
                                        value={curriculum}
                                        onChange={(e) => setCurriculum(e.target.value)}
                                        sx={{ width: 180 }}
                                    >
                                        <MenuItem value="">{t('all')}</MenuItem>
                                        {CURRICULA.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        size="small"
                                        label={t('quiz-library-subject-name')}
                                        value={subjectNameFilter}
                                        onChange={(e) => setSubjectNameFilter(e.target.value)}
                                        fullWidth
                                    />
                                    <Button variant="outlined" onClick={runFilter}>{t('search')}</Button>
                                </Stack>

                                <UIStream
                                    initialData={null}
                                    stream={bloc.getStream('library_catalog')}
                                    builder={(catalogSnap) => {
                                        const documents: QuizLibraryDocument[] = catalogSnap.data ?? [];
                                        return (
                                            <List dense disablePadding>
                                                {documents.map((doc) => {
                                                    const isLinked = linkedIds.has(doc.id);
                                                    return (
                                                        <ListItem
                                                            key={doc.id}
                                                            secondaryAction={
                                                                isLinked ? (
                                                                    <Chip size="small" color="primary" label={t('quiz-library-linked')} />
                                                                ) : (
                                                                    <IconButton size="small" onClick={() => link(doc.id)}>
                                                                        <LinkOutlined fontSize="small" />
                                                                    </IconButton>
                                                                )
                                                            }
                                                        >
                                                            <ListItemText
                                                                primary={doc.title}
                                                                secondary={`${t('quiz-library-grade')} ${doc.grade} - ${doc.curriculum}`}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}
                                                {documents.length === 0 && catalogSnap.data != null && (
                                                    <Typography variant="body2" color="text.secondary">{t('quiz-library-no-documents')}</Typography>
                                                )}
                                            </List>
                                        );
                                    }}
                                />
                            </>
                        );
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
