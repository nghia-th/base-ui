import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DemoSection from "../components/common/DemoSection";

interface Product {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

const SEED: Product[] = [
    { id: 1, name: 'Ao thun', price: 150000, quantity: 40 },
    { id: 2, name: 'Quan jean', price: 420000, quantity: 15 },
    { id: 3, name: 'Giay the thao', price: 890000, quantity: 8 }
];

// CrudDemo minh hoạ 1 màn hình quản lý dữ liệu điển hình: DataGrid + Dialog form thêm/sửa,
// state cục bộ trong component (không cần Bloc riêng vì đây chỉ là demo UI-kit thuần tuý;
// với 1 trang nghiệp vụ thật, nên tách state/gọi API này ra 1 Bloc riêng như Dashboard.tsx).
export default function CrudDemo() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<Product[]>(SEED);
    const [editing, setEditing] = useState<Product | null>(null);
    const [open, setOpen] = useState(false);

    const openNew = () => { setEditing({ id: 0, name: '', price: 0, quantity: 0 }); setOpen(true); };
    const openEdit = (row: Product) => { setEditing({ ...row }); setOpen(true); };
    const remove = (id: number) => setRows((r) => r.filter((x) => x.id !== id));

    const save = () => {
        if (!editing) return;
        if (editing.id === 0) {
            const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
            setRows((r) => [...r, { ...editing, id: nextId }]);
        } else {
            setRows((r) => r.map((x) => (x.id === editing.id ? editing : x)));
        }
        setOpen(false);
        setEditing(null);
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: t('id') as string, width: 70 },
        { field: 'name', headerName: t('product-name') as string, flex: 1, minWidth: 160 },
        { field: 'price', headerName: t('price') as string, width: 130, type: 'number' },
        { field: 'quantity', headerName: t('quantity') as string, width: 110, type: 'number' },
        {
            field: 'actions', type: 'actions', headerName: t('actions') as string, width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<EditOutlined fontSize="small" />} label="edit" onClick={() => openEdit(params.row)} />,
                <GridActionsCellItem icon={<DeleteOutlined fontSize="small" />} label="delete" onClick={() => remove(params.row.id)} />
            ]
        }
    ];

    return (
        <DemoSection title={t('crud')} description={t('crud-desc') as string}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                <Button variant="contained" startIcon={<AddOutlined />} onClick={openNew}>{t('new')}</Button>
            </Stack>
            <Box sx={{ height: 360 }}>
                <DataGrid rows={rows} columns={columns} disableRowSelectionOnClick />
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editing?.id ? t('edit-product') : t('new-product')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label={t('product-name')} value={editing?.name ?? ''} onChange={(e) => setEditing((s) => s && { ...s, name: e.target.value })} autoFocus />
                        <TextField label={t('price')} type="number" value={editing?.price ?? 0} onChange={(e) => setEditing((s) => s && { ...s, price: Number(e.target.value) })} />
                        <TextField label={t('quantity')} type="number" value={editing?.quantity ?? 0} onChange={(e) => setEditing((s) => s && { ...s, quantity: Number(e.target.value) })} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
                    <Button variant="contained" onClick={save}>{t('save')}</Button>
                </DialogActions>
            </Dialog>
        </DemoSection>
    );
}
