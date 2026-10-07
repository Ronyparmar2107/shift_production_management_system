import React, { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  useGetAllPlanTypesQuery,
  useCreatePlanTypeMutation,
  useUpdatePlanTypeMutation,
  useDeletePlanTypeMutation,
} from '../features/planType/planTypeApi';

// Suggestions only — any unit can be typed.
const UNIT_SUGGESTIONS = ['meters', 'holes', 'tonnes', 'bolts', 'm²', 'm³'];

const errorMessage = (err) => err?.data?.message ?? 'Request failed';

export default function PlanTypeManagement() {
  const { data: planTypes = [], isLoading, isError } = useGetAllPlanTypesQuery();
  const [createPlanType, { isLoading: creating }] = useCreatePlanTypeMutation();
  const [updatePlanType, { isLoading: updating }] = useUpdatePlanTypeMutation();
  const [deletePlanType, { isLoading: deletingNow }] = useDeletePlanTypeMutation();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = create, {planTypeId,...} = edit
  const [form, setForm] = useState({ type: '', unit: '' });
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isEdit = Boolean(editing?.planTypeId);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return planTypes;
    return planTypes.filter(
      (p) => p.type?.toLowerCase().includes(q) || p.unit?.toLowerCase().includes(q),
    );
  }, [planTypes, search]);

  const openCreate = () => {
    setForm({ type: '', unit: '' });
    setEditing({});
  };

  const openEdit = (row) => {
    setForm({ type: row.type, unit: row.unit });
    setEditing(row);
  };

  const closeDialog = () => setEditing(null);

  const handleSave = async (event) => {
    event.preventDefault();
    const body = { type: form.type.trim(), unit: form.unit.trim() };
    try {
      if (isEdit) {
        await updatePlanType({ planTypeId: editing.planTypeId, ...body }).unwrap();
        setFeedback({ severity: 'success', message: 'Plan type updated' });
      } else {
        await createPlanType(body).unwrap();
        setFeedback({ severity: 'success', message: 'Plan type created' });
      }
      closeDialog();
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePlanType({ planTypeId: deleting.planTypeId }).unwrap();
      setFeedback({ severity: 'success', message: `${deleting.type} deleted` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setDeleting(null);
  };

  const columns = [
    { field: 'type', headerName: 'Plan type', flex: 1, minWidth: 220 },
    {
      field: 'unit',
      headerName: 'Unit',
      width: 140,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
          <Tooltip title="Edit">
            <IconButton size="small" aria-label="Edit plan type" onClick={() => openEdit(params.row)}>
              <EditRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" aria-label="Delete plan type" onClick={() => setDeleting(params.row)}>
              <DeleteRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}
      >
        <TextField
          size="small"
          placeholder="Search by type or unit"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
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
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Add plan type
        </Button>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn&apos;t load plan types. Check the API is running and you&apos;re signed in.
        </Alert>
      )}
      {feedback && (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      <Box sx={{ height: 480, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.planTypeId}
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

      {/* Create / edit */}
      <Dialog open={Boolean(editing)} onClose={closeDialog} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{isEdit ? `Edit ${editing.type}` : 'Add plan type'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Plan type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                required
                fullWidth
                size="small"
                autoFocus
              />
              <Autocomplete
                freeSolo
                options={UNIT_SUGGESTIONS}
                value={form.unit}
                onChange={(_, value) => setForm((f) => ({ ...f, unit: value ?? '' }))}
                onInputChange={(_, value) => setForm((f) => ({ ...f, unit: value }))}
                renderInput={(params) => (
                  <TextField {...params} label="Unit" required size="small" helperText="e.g. tonnes, meters" />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} size="small">Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={creating || updating}>
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete plan type?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.type} ({deleting?.unit}) will be removed. Plan types used by existing plans can&apos;t be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} size="small">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" size="small" disabled={deletingNow}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
