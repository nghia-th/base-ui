import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
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
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import LinkOffOutlined from "@mui/icons-material/LinkOffOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import UIStream from "./UIStream";
import AppDialog from "../dialogs/AppDialog";
import { DIALOG_PRIMARY_BUTTON_SX } from "../dialogs/dialogToneStyles";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";
import { BlocParentSubjects } from "../../bloc/BlocParentSubjects";
import { QuizLibraryDocument, QuizSubjectLibraryLink } from "../../../api/QuizLibraryApi";
import { QuizCurriculum } from "../../../api/QuizCurriculumApi";

// 2026-09-05 - Curriculum ("bo sach") used to be a similar hardcoded 3-value array here, but
// per the user's explicit request ("chổ bộ sách phải được admin tạo hiện tại đang set cứng")
// it is now loaded from bloc.getStream('curricula') (BlocParentSubjects.ts#loadCurricula),
// same Admin-managed list QuizCurriculumApi.ts/CurriculumService.java expose.
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

// grade/curriculum co the null (2026-09-06 revision - "cho phep tao muon hoc khong thuoc lop
// nao") - document dang la 1 mon hoc dung chung thi khong hien "Khoi X - <bo sach>" nua ma hien
// nhan rieng, xem quiz-library-uncategorized.
function taxonomyLabel(t: (key: string, opts?: any) => string, doc: QuizLibraryDocument): string {
    if (doc.grade == null && doc.curriculum == null) return t('quiz-library-uncategorized');
    if (doc.grade == null) return doc.curriculum as string;
    if (doc.curriculum == null) return `${t('quiz-library-grade')} ${doc.grade}`;
    return `${t('quiz-library-grade')} ${doc.grade} - ${doc.curriculum}`;
}

interface SubjectLibraryDialogProps {
    bloc: BlocParentSubjects;
    subjectId: number | null;
    subjectName: string;
    open: boolean;
    onClose: () => void;
}

// Parent-side textbook/course library dialog (2026-09-05, "thu vien sach giao khoa" feature; mo
// rong 2026-09-06 - moi document gio co the co NHIEU file, hien flat list khong collapse/expand
// duoi moi document da lien ket, tranh vi pham Rules of Hooks vi day la .map() ben trong builder()
// cua UIStream - xem claude/subject-shared-across-classrooms... cho quy uoc nay). Opened per-
// subject from Subjects.tsx (MenuBookOutlined icon on each subject row). Uses the SAME
// BlocParentSubjects instance as the page (passed down as a prop) rather than its own bloc, since
// reUseBlocContent only keeps one "content" bloc per page (see AppContext.ts) - see the
// 'library_links'/'library_catalog' methods added at the bottom of BlocParentSubjects.ts.
// Shows the subject's already-linked documents on top (unlink + per-file view/download), and the
// filterable whole catalog below to link new ones - a document already linked is marked instead
// of offering Link again (QUIZ_035 LIBRARY_ALREADY_LINKED would otherwise be a common, avoidable
// error).
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
            bloc.loadCurricula();
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

    const download = (doc: QuizLibraryDocument, fileId: number, filename: string) => {
        if (subjectId == null) return;
        bloc.downloadLibraryFile(subjectId, doc.id, fileId, filename, showError);
    };

    const view = (doc: QuizLibraryDocument, fileId: number) => {
        if (subjectId == null) return;
        bloc.viewLibraryFile(subjectId, doc.id, fileId, showError);
    };

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="sm" title={<>{t('quiz-library-browse')} - {subjectName}</>} icon={MenuBookOutlined}>
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
                                            divider
                                            alignItems="flex-start"
                                            secondaryAction={
                                                <IconButton size="small" onClick={() => unlink(l.document.id)}>
                                                    <LinkOffOutlined fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <Stack sx={{ width: '100%', pr: 4 }}>
                                                <ListItemText
                                                    primary={l.document.title}
                                                    secondary={taxonomyLabel(t, l.document)}
                                                />
                                                {/* Flat file list, khong collapse/expand - xem comment o dau file. */}
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
                                    <UIStream
                                        initialData={null}
                                        stream={bloc.getStream('curricula')}
                                        builder={(curriculaSnap) => {
                                            const curricula: QuizCurriculum[] = curriculaSnap.data ?? [];
                                            return (
                                                <TextField
                                                    select
                                                    size="small"
                                                    label={t('quiz-library-curriculum')}
                                                    value={curriculum}
                                                    onChange={(e) => setCurriculum(e.target.value)}
                                                    sx={{ width: 180 }}
                                                >
                                                    <MenuItem value="">{t('all')}</MenuItem>
                                                    {curricula.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                                                </TextField>
                                            );
                                        }}
                                    />
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
                                                                secondary={taxonomyLabel(t, doc)}
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
                <Button onClick={onClose} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
            </DialogActions>
        </AppDialog>
    );
}
