import React, { useContext, useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { AppContext, reUseBlocContent } from "../../../base/AppContext";
import AppDialog from "../../components/dialogs/AppDialog";
import { DIALOG_CANCEL_BUTTON_SX, DIALOG_PRIMARY_BUTTON_SX } from "../../components/dialogs/dialogToneStyles";
import { BlocAdminTranslations, ADMIN_TRANSLATION_LANGS } from "../../bloc/BlocAdminTranslations";
import { QuizAdminTranslationRow } from "../../../api/QuizLanguageApi";
import UIStream from "../../components/common/UIStream";
import { quizErrorMessage } from "../../../quiz-net/quizErrors";

// Trang "Quản lý bản dịch" (khu vực Admin, /app/admin/translations, 2026-09-04 - phần 4/4) - list/
// thêm/sửa/xoá key dịch UI (vi/en) qua BlocAdminTranslations (base module's LanguageApi.java có
// sẵn bên backend, chỉ mới thêm gác quyền ghi - xem PublicLanguageAdminGuardFilter.java). Theo
// đúng recipe 5 bước ở Documentation.tsx, cùng shape UIStream/DataGrid/Dialog như Parents.tsx (xem
// đó cho comment đầy đủ về state management) - khác ở 2 điểm: (1) có ô tìm kiếm theo keyword (gọi
// thẳng GET .../list?keyword=, lọc phía SERVER chứ không phải client, vì danh sách key dịch có thể
// khá dài - 494 dòng tại thời điểm viết tính năng này); (2) Dialog thêm/sửa dùng CHUNG 1 nút "Lưu"
// cho cả 2 luồng (LanguageApi.java's addOrUpdate không tách endpoint create/update), langKey CHỈ
// nhập được khi TẠO MỚI - sửa 1 dòng có sẵn không đổi được khoá của nó (đổi langKey lúc sửa sẽ tạo
// ra 1 dòng MỚI mồ côi thay vì đổi tên dòng cũ, vì backend upsert theo đúng khoá gửi lên).
export default function AdminTranslations() {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const appContext = useContext(AppContext);
    const bloc = reUseBlocContent(appContext, BlocAdminTranslations);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        bloc.reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showError = (error: any) => enqueueSnackbar(quizErrorMessage(t, error), { variant: error?.variant ?? 'error' });

    const save = () => {
        bloc.save(() => {
            enqueueSnackbar(t('quiz-admin-translation-saved') as string, { variant: 'success' });
            bloc.closeForm();
        }, showError);
    };

    const askRemove = (row: QuizAdminTranslationRow) => {
        bloc.confirm({
            title: 'delete',
            message: 'quiz-admin-delete-translation-confirm',
            onYes: () => {
                bloc.remove(row.langKey, () => {
                    enqueueSnackbar(t('quiz-admin-translation-deleted') as string, { variant: 'success' });
                }, showError);
            }
        });
    };

    const columns: GridColDef[] = useMemo(() => [
        { field: 'langKey', headerName: t('quiz-admin-translation-key') as string, flex: 1, minWidth: 220 },
        ...ADMIN_TRANSLATION_LANGS.map((lang): GridColDef => ({
            field: lang, headerName: lang.toUpperCase(), flex: 1.5, minWidth: 240
        })),
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => bloc.openEdit(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => askRemove(params.row)} />
            ]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    return (
        <UIStream
            initialData={null}
            stream={bloc.getStream('rows')}
            builder={(snapshot) => {
                const rows: QuizAdminTranslationRow[] = snapshot.data ?? [];
                return (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={2}>
                                <Typography variant="h6" fontWeight={700}>{t('quiz-admin-translations')}</Typography>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        size="small"
                                        placeholder={t('quiz-admin-translation-search') as string}
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { bloc.search(searchInput); } }}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }}
                                    />
                                    <Button variant="outlined" onClick={() => bloc.search(searchInput)}>{t('search')}</Button>
                                    <Button variant="contained" startIcon={<AddOutlined />} onClick={() => bloc.openNew()}>{t('new')}</Button>
                                </Stack>
                            </Stack>
                            <Box sx={{ height: 560 }}>
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    getRowId={(row) => row.langKey}
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
                                    <UIStream
                                        initialData={false}
                                        stream={bloc.getStream('isEditingKey')}
                                        builder={(editingSnap) => (
                                            <AppDialog
                                                open={view.isShow === true}
                                                onClose={() => bloc.closeForm()}
                                                maxWidth="sm"
                                                title={t(editingSnap.data === true ? 'quiz-admin-translation-edit' : 'quiz-admin-translation-new')}
                                                icon={editingSnap.data === true ? EditOutlined : AddOutlined}
                                            >
                                                <DialogContent>
                                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                                        <TextField
                                                            label={t('quiz-admin-translation-key')}
                                                            defaultValue={bloc.getField('req')?.langKey ?? ''}
                                                            onChange={(e) => bloc.setField('req', { ...bloc.getField('req'), langKey: e.target.value })}
                                                            disabled={editingSnap.data === true}
                                                            autoFocus={editingSnap.data !== true}
                                                            fullWidth
                                                        />
                                                        {ADMIN_TRANSLATION_LANGS.map((lang) => (
                                                            <TextField
                                                                key={lang}
                                                                label={lang.toUpperCase()}
                                                                defaultValue={bloc.getField('req')?.values?.[lang] ?? ''}
                                                                onChange={(e) => bloc.setValue(lang, e.target.value)}
                                                                multiline
                                                                minRows={1}
                                                                maxRows={4}
                                                                fullWidth
                                                            />
                                                        ))}
                                                    </Stack>
                                                </DialogContent>
                                                <DialogActions>
                                                    <Button onClick={() => bloc.closeForm()} variant="contained" startIcon={<CloseOutlined />} sx={DIALOG_CANCEL_BUTTON_SX}>{t('cancel')}</Button>
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
                                        )}
                                    />
                                );
                            }}
                        />
                    </>
                );
            }}
        />
    );
}
