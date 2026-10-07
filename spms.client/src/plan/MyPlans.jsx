import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useGetMyPlansQuery } from '../features/plan/planApi';

const STATUS_COLOR = {
  Pending: 'warning',
  Accepted: 'success',
  'Accepted with changes': 'info',
};

const FILTERS = ['All', 'Pending', 'Accepted', 'Accepted with changes'];

const fmtTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

export default function MyPlans() {
  // Poll so a crew lead's acceptance shows up without a manual refresh.
  const { data: plans = [], isLoading, isError } = useGetMyPlansQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
  });

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c = { All: plans.length, Pending: 0, Accepted: 0, 'Accepted with changes': 0 };
    plans.forEach((p) => {
      c[p.status] = (c[p.status] ?? 0) + 1;
    });
    return c;
  }, [plans]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (filter !== 'All' && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.area?.toLowerCase().includes(q) ||
        p.planType?.toLowerCase().includes(q) ||
        p.leadName?.toLowerCase().includes(q) ||
        p.crewName?.toLowerCase().includes(q)
      );
    });
  }, [plans, filter, search]);

  const columns = [
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'shiftType', headerName: 'Shift', width: 100 },
    {
      field: 'crewName',
      headerName: 'Crew',
      flex: 1,
      minWidth: 170,
      valueGetter: (value, row) => `${row.crewName}${row.leadName ? ` — ${row.leadName}` : ''}`,
    },
    { field: 'area', headerName: 'Area', flex: 1, minWidth: 170 },
    { field: 'planType', headerName: 'Activity', width: 140 },
    {
      field: 'target',
      headerName: 'Target',
      width: 130,
      valueGetter: (value, row) => (row.target != null ? `${row.target} ${row.unit}` : ''),
    },
    {
      field: 'window',
      headerName: 'Planned window',
      width: 150,
      sortable: false,
      valueGetter: (value, row) => `${fmtTime(row.startTime)} – ${fmtTime(row.endTime)}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 190,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={STATUS_COLOR[params.value] ?? 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'acceptedBy',
      headerName: 'Accepted by',
      width: 200,
      sortable: false,
      renderCell: (params) =>
        params.row.acceptedAt ? (
          <Tooltip title={fmtDateTime(params.row.acceptedAt)}>
            <span>
              {params.row.acceptedByName || '—'} · {fmtDateTime(params.row.acceptedAt)}
            </span>
          </Tooltip>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        My Plans
      </Typography>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {FILTERS.map((f) => (
              <Chip
                key={f}
                label={`${f} (${counts[f] ?? 0})`}
                size="small"
                color={f === 'All' ? 'default' : STATUS_COLOR[f]}
                variant={filter === f ? 'filled' : 'outlined'}
                onClick={() => setFilter(f)}
              />
            ))}
          </Stack>
          <TextField
            size="small"
            placeholder="Search area, activity or crew"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', md: 320 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Couldn&apos;t load your plans. Check the API is running and you&apos;re signed in.
          </Alert>
        )}

        <Box sx={{ height: 520, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.planId}
            loading={isLoading}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
            }
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            disableColumnResize
            density="compact"
          />
        </Box>
      </Card>
    </Box>
  );
}
