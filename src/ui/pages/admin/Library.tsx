import React, { useContext, useMemo, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocAdminLibrary } from "../../bloc/BlocAdminLibrary";
import { QuizLibraryDocument } from "../../../api/QuizLibraryApi";
import UIStream from "../../components/common/UIStream";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Fixed 1-12 grade dropdown and fixed 3-value curriculum list, per the user's explicit design
// decision (AskUserQuestion, 2026-09-05) - both are re-validated on the backend too
// (LibraryService#upload, QUIZ_032 LIBRARY_INVALID_TAXONOMY).
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRICULA = ["Kết nối tri thức", "Chân trời sáng tạo", "Cánh diều"];

// Admin "Textbook library" page (/app/admin/library, 2026-09-05, "thu vien sach giao khoa"
// feature) - upload/list/delete PDF textbooks organized by grade -> subject name -> curriculum
// (e.g. "Lop 4 -> Toan tap 1 -> Ket noi tri thuc", the user's own example). No root restriction -
// every Admin can manage the whole library (see LibraryService.java's javadoc). Same
// UIStream/DataGrid/Dialog shape as Admins.tsx, with a file input added to the form for the PDF.
export default function AdminLibrary() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocAdminLibrary);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bloc.reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const openNew = () => {
        setFile(null);
        bloc.openNew();
    };

    const closeForm = () => {
        setFile(null);
        bloc.closeForm();
    };

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (picked) setFile(picked);
    };

    const save = () => {
        if (!file) {
            showError({ messageKey: 'required-field' });
            return;
        }
        bloc.upload(file, () => {
            enqueueSnackbar(t('quiz-library-uploaded') as string, { variant: 'success' });
            closeForm();
        }, showError);
    };

    const askRemove = (row: QuizLibraryDocument) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-library-delete-confirm',
            onYes: () => {
                bloc.remove(row.id, () => {
                    enqueueSnackbar(t('quiz-library-deleted') as string, { variant: 'success' });
                }, (error: any) => showError(error));
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'grade', headerName: t('quiz-library-grade') as string, width: 100 },
        { field: 'subjectName', headerName: t('quiz-library-subject-name') as string, flex: 1, minWidth: 160 },
        { field: 'curriculum', headerName: t('quiz-library-curriculum') as string, width: 180 },
        { field: 'volume', headerName: t('quiz-library-volume') as string, width: 120 },
        { field: 'title', headerName: t('quiz-library-title') as string, flex: 1, minWidth: 200 },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 140,
            getActions: (params) => [
                <GridActionsCellItem icon={<VisibilityOutlined fontSize="small" />} label="quiz-library-view" onClick={() => bloc.view(params.row.id, showError)} />,
                <GridActionsCellItem icon={<DownloadOutlined fontSize="small" />} label="quiz-library-download" onClick={() => bloc.downloadFile(params.row.id, `${params.row.title}.pdf`, showError)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('documents')}
            builder={(snapshot) => {
                const rows: QuizLibraryDocument[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-admin-library')}</Typography>
                                <Button variant="contained" startIcon={<AddOutlined />} onClick={openNew}>{t('new')}</Button>
                            </Stack>
                            <Box sx={{ height: 480 }}>
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    loading={snapshot.data == null}
                                    disableRowSelectionOnClick
                                />
                            </Box>
                        </Card>

                        <UIStream
                            initialData={{ isShow: false }}
                            stream={bloc.getStream('form_view')}
                            builder={(viewSnap) => {
                                const view = viewSnap.data ?? { isShow: false };
                                return (
                                    <AppDialog open={view.isShow === true} onClose={closeForm} title={t('quiz-library-upload')} icon={UploadFileOutlined}>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    select
                                                    label={t('quiz-library-grade')}
                                                    defaultValue={bloc.getField('grade', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('grade', e.target.value, 'req')}
                                                    fullWidth
                                                >
                                                    {GRADES.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                                                </TextField>
                                                <TextField
                                                    label={t('quiz-library-subject-name')}
                                                    defaultValue={bloc.getField('subjectName', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('subjectName', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <TextField
                                                    select
                                                    label={t('quiz-library-curriculum')}
                                                    defaultValue={bloc.getField('curriculum', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('curriculum', e.target.value, 'req')}
                                                    fullWidth
                                                >
                                                    {CURRICULA.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                                </TextField>
                                                <TextField
                                                    label={t('quiz-library-volume-optional')}
                                                    defaultValue={bloc.getField('volume', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('volume', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label={t('quiz-library-title-optional')}
                                                    defaultValue={bloc.getField('title', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('title', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <Button variant="outlined" startIcon={<UploadFileOutlined />} onClick={() => fileInputRef.current?.click()}>
                                                    {file ? file.name : t('quiz-library-choose-pdf')}
                                                </Button>
                                                <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={onFileSelected} />
                                            </Stack>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={closeForm} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
                                            <UIStream
                                                initialData={false}
                                                stream={bloc.getStream('submitting')}
                                                builder={(submittingSnap) => (
                                                    <Button variant="contained" color="primary" startIcon={<CheckOutlined />} disabled={submittingSnap.data === true} onClick={save} sx={DIALOG_PRIMARY_BUTTON_SX}>
                                                        {t('save')}
                                                    </Button>
                                                )}
                                            />
                                        </DialogActions>
                                    </AppDialog>
                                );
                            }}
                        />
                    </>
                );
            }}
        />
    );
}
