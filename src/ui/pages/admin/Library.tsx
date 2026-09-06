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
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import { BlocAdminLibrary } from "../../bloc/BlocAdminLibrary";
import { QuizLibraryDocument, QuizLibraryImportResult } from "../../../api/QuizLibraryApi";
import { QuizCurriculum } from "../../../api/QuizCurriculumApi";
import UIStream from "../../components/common/UIStream";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Fixed 1-12 grade dropdown, per the user's explicit design decision (AskUserQuestion,
// 2026-09-05) - re-validated on the backend too (LibraryService#validateTaxonomy, QUIZ_032
// LIBRARY_INVALID_TAXONOMY). Curriculum ('bo sach') is Admin-managed (CurriculumService.java),
// loaded via bloc.loadCurricula() below instead of a constant, see the 'curriculum' TextField's
// UIStream.
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

// PDF or PowerPoint - matches LessonService.ALLOWED_ATTACHMENT_TYPES / LibraryService's own file
// allow-list on the backend (2026-09-06 revision widened this library's files from PDF-only to
// also accept PowerPoint, same as the new Lesson attachment feature).
const DOCUMENT_FILE_ACCEPT = ".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Admin "Thu vien mon hoc" page (/app/admin/library, 2026-09-05, "thu vien sach giao khoa"
// feature; mo rong 2026-09-06 - "cho phep tao muon hoc khong thuoc lop nao, tai lieu la 1 file
// hoac nhieu slide bai giang") - tao/xoa cac "document" (sach giao khoa theo Khoi/Curriculum, HOAC
// 1 mon hoc chung khong phan biet Khoi/Lop), moi document co the co NHIEU file (PDF/PowerPoint)
// quan ly qua dialog "Quan ly file" rieng. Khong con file picker luc tao - tao xong roi them file
// sau (giong nhu Lesson: tao truoc, dinh kem file sau). Grade/Curriculum co the de trong ("Khong
// chon") de bieu thi 1 mon hoc dung chung, khong thuoc Khoi/Lop nao.
export default function AdminLibrary() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocAdminLibrary);
    const importFileInputRef = useRef<HTMLInputElement>(null);
    const addFileInputRef = useRef<HTMLInputElement>(null);
    const [manageFilesId, setManageFilesId] = useState<number | null>(null);

    useEffect(() => {
        bloc.reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const openNew = () => {
        bloc.openNew();
        // Tai lai danh sach Bo sach MOI LAN mo dialog - xem comment goc cua ham nay (2026-09-05):
        // Subject cua rxjs khong replay gia tri da phat cho subscriber den sau, goi lai o day dam
        // bao stream luon co subscriber truoc khi response ve.
        bloc.loadCurricula();
    };

    const closeForm = () => bloc.closeForm();

    const save = () => {
        bloc.create(() => {
            enqueueSnackbar(t('quiz-library-created') as string, { variant: 'success' });
            closeForm();
        }, showError);
    };

    const downloadTemplate = (format: 'xlsx' | 'csv') => bloc.downloadImportTemplate(format, showError);

    const onImportFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (!picked) return;
        bloc.runImport(picked, showError);
    };

    const onAddFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (!picked || manageFilesId == null) return;
        bloc.addFile(manageFilesId, picked, () => {
            enqueueSnackbar(t('quiz-library-file-added') as string, { variant: 'success' });
        }, showError);
    };

    const askRemoveFile = (documentId: number, fileId: number) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-library-file-delete-confirm',
            onYes: () => {
                bloc.removeFile(documentId, fileId, () => {
                    enqueueSnackbar(t('quiz-library-file-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
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
        {
            field: 'grade', headerName: t('quiz-library-grade') as string, width: 100,
            valueGetter: (_value, row) => (row as QuizLibraryDocument).grade ?? '-'
        },
        { field: 'subjectName', headerName: t('quiz-library-subject-name') as string, flex: 1, minWidth: 160 },
        {
            field: 'curriculum', headerName: t('quiz-library-curriculum') as string, width: 180,
            valueGetter: (_value, row) => (row as QuizLibraryDocument).curriculum ?? '-'
        },
        { field: 'volume', headerName: t('quiz-library-volume') as string, width: 120 },
        { field: 'title', headerName: t('quiz-library-title') as string, flex: 1, minWidth: 200 },
        {
            // Chip so luong file thay vi Chip "co/chua co file" (2026-09-06 revision - 1 document
            // gio co the co nhieu file, "co/chua co" khong con du dien ta).
            field: 'files', headerName: t('quiz-library-file-status') as string, width: 140, sortable: false,
            renderCell: (params) => {
                const count = ((params.row as QuizLibraryDocument).files ?? []).length;
                return (
                    <Chip
                        size="small"
                        label={count === 0 ? t('quiz-library-no-file-yet') : t('quiz-library-file-count', { count })}
                        color={count === 0 ? 'warning' : 'success'}
                        variant={count === 0 ? 'outlined' : 'filled'}
                    />
                );
            }
        },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 130,
            getActions: (params) => [
                <GridActionsCellItem icon={<FolderOpenOutlined fontSize="small" />} label="quiz-library-manage-files" onClick={() => setManageFilesId(params.row.id)} />,
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
                // Tai lai document dang mo dialog "Quan ly file" tu chinh stream nay (khong dung
                // stream rieng) - bloc.reload() da duoc goi lai sau moi addFile/removeFile, nen
                // rows luon la du lieu moi nhat, tranh phai dong bo 2 nguon du lieu.
                const manageFilesDoc = manageFilesId == null ? null : rows.find((r) => r.id === manageFilesId) ?? null;

                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-admin-library')}</Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button variant="outlined" startIcon={<UploadFileOutlined />} onClick={() => bloc.openImport()}>{t('quiz-library-import')}</Button>
                                    <Button variant="contained" startIcon={<AddOutlined />} onClick={openNew}>{t('new')}</Button>
                                </Stack>
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
                                    <AppDialog open={view.isShow === true} onClose={closeForm} title={t('quiz-library-create')} icon={AddOutlined}>
                                        <DialogContent>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField
                                                    select
                                                    label={t('quiz-library-grade')}
                                                    defaultValue={bloc.getField('grade', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('grade', e.target.value, 'req')}
                                                    helperText={t('quiz-library-grade-optional-hint')}
                                                    fullWidth
                                                >
                                                    <MenuItem value="">{t('quiz-library-not-selected')}</MenuItem>
                                                    {GRADES.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                                                </TextField>
                                                <TextField
                                                    label={t('quiz-library-subject-name')}
                                                    defaultValue={bloc.getField('subjectName', 'req') ?? ''}
                                                    onChange={(e) => bloc.setStream('subjectName', e.target.value, 'req')}
                                                    fullWidth
                                                />
                                                <UIStream
                                                    initialData={null}
                                                    stream={bloc.getStream('curricula')}
                                                    builder={(curriculaSnap) => {
                                                        const curricula: QuizCurriculum[] = curriculaSnap.data ?? [];
                                                        return (
                                                            <TextField
                                                                select
                                                                label={t('quiz-library-curriculum')}
                                                                defaultValue={bloc.getField('curriculum', 'req') ?? ''}
                                                                onChange={(e) => bloc.setStream('curriculum', e.target.value, 'req')}
                                                                fullWidth
                                                            >
                                                                <MenuItem value="">{t('quiz-library-not-selected')}</MenuItem>
                                                                {curricula.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                                                            </TextField>
                                                        );
                                                    }}
                                                />
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
                                                <Alert severity="info">{t('quiz-library-add-files-after-create-hint')}</Alert>
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

                        <UIStream
                            initialData={{ isShow: false }}
                            stream={bloc.getStream('import_view')}
                            builder={(viewSnap) => {
                                const view = viewSnap.data ?? { isShow: false };
                                return (
                                    <AppDialog open={view.isShow === true} onClose={() => bloc.closeImport()} maxWidth="xs" title={t('quiz-library-import-dialog-title')} icon={UploadFileOutlined}>
                                        <DialogContent>
                                            <input ref={importFileInputRef} type="file" accept=".xlsx,.csv" hidden onChange={onImportFileChosen} />
                                            <Stack spacing={2} sx={{ mt: 1 }} alignItems="flex-start">
                                                <Typography variant="body2" color="text.secondary">{t('quiz-library-import-hint')}</Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" startIcon={<DownloadOutlined />} onClick={() => downloadTemplate('xlsx')}>{t('quiz-download-template-xlsx')}</Button>
                                                    <Button size="small" startIcon={<DownloadOutlined />} onClick={() => downloadTemplate('csv')}>{t('quiz-download-template-csv')}</Button>
                                                </Stack>
                                                <UIStream
                                                    initialData={false}
                                                    stream={bloc.getStream('importing')}
                                                    builder={(importingSnap) => (
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={importingSnap.data === true ? <CircularProgress size={16} /> : <UploadFileOutlined />}
                                                            disabled={importingSnap.data === true}
                                                            onClick={() => importFileInputRef.current?.click()}
                                                        >
                                                            {t('quiz-import-pick-file')}
                                                        </Button>
                                                    )}
                                                />
                                                <UIStream
                                                    initialData={null}
                                                    stream={bloc.getStream('importResult')}
                                                    builder={(resultSnap) => {
                                                        const importResult: QuizLibraryImportResult | null = resultSnap.data;
                                                        if (!importResult) return null;
                                                        return (
                                                            <Alert severity={importResult.errors.length === 0 ? 'success' : 'warning'} sx={{ width: '100%' }}>
                                                                {t('quiz-import-result-summary', { success: importResult.successCount, total: importResult.totalRows })}
                                                                {importResult.errors.length > 0 && (
                                                                    <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                                                                        {importResult.errors.map((err, i) => (
                                                                            <li key={i}>
                                                                                <Typography variant="body2">
                                                                                    {t('quiz-import-row-error', { row: err.rowNumber, reason: err.reason })}
                                                                                </Typography>
                                                                            </li>
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Alert>
                                                        );
                                                    }}
                                                />
                                            </Stack>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => bloc.closeImport()} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
                                        </DialogActions>
                                    </AppDialog>
                                );
                            }}
                        />

                        {/* Dialog "Quan ly file" (2026-09-06 revision) - danh sach file cua 1 document, them/xem/
                            tai/xoa tung file - tach rieng khoi form tao vi 1 document co the co nhieu file. */}
                        <AppDialog open={manageFilesDoc != null} onClose={() => setManageFilesId(null)} maxWidth="xs" title={manageFilesDoc?.title ?? ''} icon={FolderOpenOutlined}>
                            <DialogContent>
                                <input ref={addFileInputRef} type="file" accept={DOCUMENT_FILE_ACCEPT} hidden onChange={onAddFileChosen} />
                                <List dense disablePadding>
                                    {(manageFilesDoc?.files ?? []).map((f) => (
                                        <ListItem
                                            key={f.id}
                                            secondaryAction={
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton size="small" onClick={() => manageFilesDoc && bloc.view(manageFilesDoc.id, f.id, showError)}>
                                                        <VisibilityOutlined fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => manageFilesDoc && bloc.downloadFile(manageFilesDoc.id, f.id, f.originalName, showError)}>
                                                        <DownloadOutlined fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => manageFilesDoc && askRemoveFile(manageFilesDoc.id, f.id)}>
                                                        <DeleteOutlined fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            }
                                        >
                                            <ListItemText primary={f.originalName} secondary={formatFileSize(f.fileSize)} />
                                        </ListItem>
                                    ))}
                                    {(manageFilesDoc?.files ?? []).length === 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{t('quiz-library-no-files-yet')}</Typography>
                                    )}
                                </List>
                                <UIStream
                                    initialData={false}
                                    stream={bloc.getStream('addingFile')}
                                    builder={(addingSnap) => (
                                        <Button
                                            variant="outlined"
                                            startIcon={addingSnap.data === true ? <CircularProgress size={16} /> : <UploadFileOutlined />}
                                            disabled={addingSnap.data === true}
                                            onClick={() => addFileInputRef.current?.click()}
                                            sx={{ mt: 1 }}
                                        >
                                            {t('quiz-library-add-file')}
                                        </Button>
                                    )}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setManageFilesId(null)} variant="contained" color="primary" startIcon={<CloseOutlined />} sx={DIALOG_PRIMARY_BUTTON_SX}>{t('close')}</Button>
                            </DialogActions>
                        </AppDialog>
                    </>
                );
            }}
        />
    );
}
