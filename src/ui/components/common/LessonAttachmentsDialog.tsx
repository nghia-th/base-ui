import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import UIStream from "./UIStream";
import AppDialog from "../dialogs/AppDialog";
import { DIALOG_PRIMARY_BUTTON_SX } from "../dialogs/dialogToneStyles";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";
import { BlocParentSubjects } from "../../bloc/BlocParentSubjects";
import { QuizLessonAttachment } from "../../../api/QuizLessonApi";

// PDF or PowerPoint - matches LessonService.ALLOWED_ATTACHMENT_TYPES on the backend.
const ATTACHMENT_ACCEPT = ".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LessonAttachmentsDialogProps {
    bloc: BlocParentSubjects;
    lessonId: number | null;
    lessonName: string;
    open: boolean;
    onClose: () => void;
}

// Dialog "File bai giang" cua 1 Lesson (2026-09-06, "phan bai cua muon hoc cho phep upload len 1
// hoac nhieu file bai giang co the la powerpoint hoac PDF ... phu huynh co the them, xoa cac file
// do") - mo tu Subjects.tsx (icon tren moi dong Lesson cua DataGrid ben phai), dung chung
// BlocParentSubjects voi trang (giong SubjectLibraryDialog.tsx) vi reUseBlocContent chi giu 1
// content bloc / trang. Don gian hon SubjectLibraryDialog - khong co khai niem link/catalog, chi
// list + them + xoa + xem + tai cua rieng 1 Lesson.
export default function LessonAttachmentsDialog({ bloc, lessonId, lessonName, open, onClose }: LessonAttachmentsDialogProps) {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    useEffect(() => {
        if (open && lessonId != null) {
            bloc.loadLessonAttachments(lessonId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, lessonId]);

    const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (!picked || lessonId == null) return;
        bloc.addLessonAttachment(lessonId, picked, () => {
            enqueueSnackbar(t('quiz-lesson-attachment-added') as string, { variant: 'success' });
        }, showError);
    };

    const askRemove = (attachmentId: number) => {
        if (lessonId == null) return;
        bloc.confirm({
            title: 'delete',
            message: 'quiz-lesson-attachment-delete-confirm',
            onYes: () => {
                bloc.removeLessonAttachment(lessonId, attachmentId, () => {
                    enqueueSnackbar(t('quiz-lesson-attachment-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const view = (attachmentId: number) => {
        if (lessonId == null) return;
        bloc.viewLessonAttachmentFile(lessonId, attachmentId, showError);
    };

    const download = (attachmentId: number, filename: string) => {
        if (lessonId == null) return;
        bloc.downloadLessonAttachmentFile(lessonId, attachmentId, filename, showError);
    };

    return (
        <AppDialog open={open} onClose={onClose} maxWidth="xs" title={<>{t('quiz-lesson-attachments')} - {lessonName}</>} icon={DescriptionOutlined}>
            <DialogContent>
                <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} hidden onChange={onFileChosen} />
                <UIStream
                    initialData={null}
                    stream={bloc.getStream('lesson_attachments')}
                    builder={(snapshot) => {
                        const attachments: QuizLessonAttachment[] = snapshot.data ?? [];
                        return (
                            <List dense disablePadding>
                                {attachments.map((a) => (
                                    <ListItem
                                        key={a.id}
                                        secondaryAction={
                                            <Stack direction="row" spacing={0.5}>
                                                <IconButton size="small" onClick={() => view(a.id)}>
                                                    <VisibilityOutlined fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => download(a.id, a.originalName)}>
                                                    <DownloadOutlined fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => askRemove(a.id)}>
                                                    <DeleteOutlined fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        }
                                    >
                                        <ListItemText primary={a.originalName} secondary={formatFileSize(a.fileSize)} />
                                    </ListItem>
                                ))}
                                {attachments.length === 0 && snapshot.data != null && (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{t('quiz-lesson-no-attachments')}</Typography>
                                )}
                            </List>
                        );
                    }}
                />
                <UIStream
                    initialData={false}
                    stream={bloc.getStream('lessonAttachmentUploading')}
                    builder={(uploadingSnap) => (
                        <Button
                            variant="outlined"
                            startIcon={uploadingSnap.data === true ? <CircularProgress size={16} /> : <UploadFileOutlined />}
                            disabled={uploadingSnap.data === true}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ mt: 1 }}
                        >
                            {t('quiz-lesson-add-attachment')}
                        </Button>
                    )}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
            </DialogActions>
        </AppDialog>
    );
}
