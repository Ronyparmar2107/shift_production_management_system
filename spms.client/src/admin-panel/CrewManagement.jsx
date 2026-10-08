import React, { useMemo, useState } from 'react';
import {
  Alert,
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
  MenuItem,
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
  useGetAllCrewsQuery,
  useGetCrewLeadsQuery,
  useCreateCrewMutation,
  useUpdateCrewMutation,
  useDeleteCrewMutation,
} from '../features/crew/crewApi';

const errorMessage = (err) => err?.data?.message ?? 'Request failed';

export default function CrewManagement() {
  const { data: crews = [], isLoading, isError } = useGetAllCrewsQuery();
  const { data: leads = [] } = useGetCrewLeadsQuery();
  const [createCrew, { isLoading: creating }] = useCreateCrewMutation();
  const [updateCrew, { isLoading: updating }] = useUpdateCrewMutation();
  const [deleteCrew, { isLoading: deletingNow }] = useDeleteCrewMutation();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = create, {crewId,...} = edit
  const [leadEmpId, setLeadEmpId] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isEdit = Boolean(editing?.crewId);

  // A lead can be picked if they don't lead a crew yet — or they lead the crew being edited.
  const availableLeads = useMemo(
    () => leads.filter((l) => !l.crewId || l.crewId === editing?.crewId),
    [leads, editing],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crews;
    return crews.filter(
      (c) =>
        c.crewName?.toLowerCase().includes(q) ||
        c.leadName?.toLowerCase().includes(q) ||
        c.leadEmployeeNumber?.includes(q),
    );
  }, [crews, search]);

  const openCreate = () => {
    setLeadEmpId('');
    setEditing({});
  };

  const openEdit = (row) => {
    setLeadEmpId(row.leadEmpId ?? '');
    setEditing(row);
  };

  const closeDialog = () => setEditing(null);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      if (isEdit) {
        await updateCrew({ crewId: editing.crewId, leadEmpId }).unwrap();
        setFeedback({ severity: 'success', message: 'Crew updated' });
      } else {
        await createCrew({ leadEmpId }).unwrap();
        setFeedback({ severity: 'success', message: 'Crew created' });
      }
      closeDialog();
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteCrew({ crewId: deleting.crewId }).unwrap();
      setFeedback({ severity: 'success', message: `${deleting.crewName} deleted` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setDeleting(null);
  };

  const columns = [
    {
      field: 'crewName',
      headerName: 'Crew',
      width: 140,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    { field: 'leadName', headerName: 'Crew lead', flex: 1, minWidth: 200 },
    { field: 'leadEmployeeNumber', headerName: 'Lead emp. no.', width: 140 },
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
          <Tooltip title="Change crew lead">
            <IconButton size="small" aria-label="Edit crew" onClick={() => openEdit(params.row)}>
              <EditRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" aria-label="Delete crew" onClick={() => setDeleting(params.row)}>
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
          placeholder="Search by crew or lead"
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
          Add crew
        </Button>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn&apos;t load crews. Check the API is running and you&apos;re signed in.
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
          getRowId={(row) => row.crewId}
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

      {/* Create / change lead */}
      <Dialog open={Boolean(editing)} onClose={closeDialog} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{isEdit ? `Edit ${editing.crewName}` : 'Add crew'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                select
                label="Crew lead"
                value={leadEmpId}
                onChange={(e) => setLeadEmpId(e.target.value)}
                required
                fullWidth
                size="small"
                helperText={
                  availableLeads.length === 0
                    ? 'No free crew leads — add an employee with the CrewLead role first'
                    : 'Only crew leads without a crew are listed'
                }
              >
                {availableLeads.map((l) => (
                  <MenuItem key={l.empId} value={l.empId}>
                    {l.name} ({l.employeeNumber})
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} size="small">Cancel</Button>
            <Button type="submit" variant="contained" size="small" loading={creating || updating}>
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete crew?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.crewName} (lead: {deleting?.leadName}) will be removed. Crews that already have plans can&apos;t be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} size="small">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" size="small" loading={deletingNow}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
