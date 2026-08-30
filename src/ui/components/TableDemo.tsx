import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DemoSection from "./common/DemoSection";

const ROWS = [
    { id: 1, name: 'Nguyen Van A', country: 'Vietnam', status: 'active', balance: 1200 },
    { id: 2, name: 'John Smith', country: 'USA', status: 'inactive', balance: 300 },
    { id: 3, name: 'Yuki Tanaka', country: 'Japan', status: 'active', balance: 980 },
    { id: 4, name: 'Kim Min Jun', country: 'Korea', status: 'active', balance: 540 },
    { id: 5, name: 'Tran Thi B', country: 'Vietnam', status: 'inactive', balance: 75 }
];

export default function TableDemo() {
    const { t } = useTranslation();

    const columns: GridColDef[] = [
        { field: 'id', headerName: t('id') as string, width: 80 },
        { field: 'name', headerName: t('full-name') as string, flex: 1, minWidth: 160 },
        { field: 'country', headerName: t('country') as string, width: 140 },
        {
            field: 'status', headerName: t('status') as string, width: 130,
            renderCell: (p) => <Chip size="small" label={t(p.value)} color={p.value === 'active' ? 'success' : 'default'} />
        },
        { field: 'balance', headerName: t('balance') as string, width: 120, type: 'number' }
    ];

    return (
        <DemoSection title={t('table')} description={t('table-desc') as string}>
            <Box sx={{ height: 380 }}>
                <DataGrid
                    rows={ROWS}
                    columns={columns}
                    checkboxSelection
                    disableRowSelectionOnClick
                    initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                    pageSizeOptions={[5, 10]}
                />
            </Box>
        </DemoSection>
    );
}
