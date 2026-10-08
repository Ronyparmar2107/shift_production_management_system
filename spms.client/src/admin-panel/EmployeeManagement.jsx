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
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  useGetAllEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
} from '../features/employee/employeeApi';
import { useGetAllRolesQuery } from '../features/role/roleApi';

const emptyForm = { name: '', roleId: '', isActive: true, resignationDate: '' };
const PROTECTED_EMPLOYEE_NUMBER = '000'; // built-in admin — cannot be edited or deleted
const todayISO = () => new Date().toISOString().slice(0, 10);
const errorMessage = (err) => err?.data?.message ?? 'Request failed';

export default function EmployeeManagement() {
  const { data: employees = [], isLoading, isError } = useGetAllEmployeesQuery();
  const { data: roles = [] } = useGetAllRolesQuery();
  // GetAllEmployees returns the role name only, so map it back to an id for edit/delete.
  const roleIdFromName = (name) => roles.find((r) => r.role === name)?.roleId ?? '';
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = create, {id,...} = edit
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.employeeNumber?.includes(q) ||
        e.role?.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing({});
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      roleId: roleIdFromName(row.role),
      isActive: row.isActive === true,
      resignationDate: row.resignationDate ?? '',
    });
    setEditing(row);
  };

  const closeDialog = () => setEditing(null);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      if (editing?.id) {
        await updateEmployee({
          id: editing.id,
          name: form.name,
          roleId: form.roleId,
          isActive: form.isActive,
          resignationDate: form.isActive ? null : form.resignationDate,
          isDeleted: false,
        }).unwrap();
        setFeedback({ severity: 'success', message: 'Employee updated' });
      } else {
        await createEmployee({ name: form.name, roleId: form.roleId }).unwrap();
        setFeedback({ severity: 'success', message: 'Employee created' });
      }
      closeDialog();
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
  };

  const confirmDelete = async () => {
    // Soft delete through UpdateEmployee (isDeleted = true).
    try {
      await updateEmployee({
        id: deleting.id,
        name: deleting.name,
        roleId: roleIdFromName(deleting.role),
        isActive: deleting.isActive === true,
        resignationDate: deleting.resignationDate ?? null,
        isDeleted: true,
      }).unwrap();
      setFeedback({ severity: 'success', message: `${deleting.name} deleted` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setDeleting(null);
  };

  const columns = [
    { field: 'employeeNumber', headerName: 'Emp. No.', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'resignationDate',
      headerName: 'Resignation date',
      width: 150,
      valueFormatter: (value) => value ?? '—',
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
      renderCell: (params) => {
        const locked = params.row.employeeNumber === PROTECTED_EMPLOYEE_NUMBER;
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title={locked ? 'Protected account' : 'Edit'}>
              <span>
                <IconButton size="small" aria-label="Edit employee" disabled={locked} onClick={() => openEdit(params.row)}>
                  <EditRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={locked ? 'Protected account' : 'Delete'}>
              <span>
                <IconButton size="small" aria-label="Delete employee" disabled={locked} onClick={() => setDeleting(params.row)}>
                  <DeleteRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  const isEdit = Boolean(editing?.id);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}
      >
        <TextField
          size="small"
          placeholder="Search by name, number or role"
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
          Add employee
        </Button>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn&apos;t load employees. Check the API is running and you&apos;re signed in.
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
          <DialogTitle>{isEdit ? 'Edit employee' : 'Add employee'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {isEdit && (
                <Typography variant="body2" color="text.secondary">
                  Employee number: {editing.employeeNumber}
                </Typography>
              )}
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                fullWidth
                size="small"
                autoFocus
              />
              <TextField
                select
                label="Role"
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                required
                fullWidth
                size="small"
              >
                {roles.map((r) => (
                  <MenuItem key={r.roleId} value={r.roleId}>{r.role}</MenuItem>
                ))}
              </TextField>
              {isEdit && (
                <TextField
                  select
                  label="Status"
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => {
                    const isActive = e.target.value === 'active';
                    setForm({
                      ...form,
                      isActive,
                      // going inactive: suggest today until they pick the actual date
                      resignationDate: isActive ? '' : form.resignationDate || todayISO(),
                    });
                  }}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              )}
              {isEdit && !form.isActive && (
                <TextField
                  type="date"
                  label="Resignation date"
                  value={form.resignationDate}
                  onChange={(e) => setForm({ ...form, resignationDate: e.target.value })}
                  required
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
              {!isEdit && (
                <Typography variant="caption" color="text.secondary">
                  Employee number is generated automatically.
                </Typography>
              )}
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
        <DialogTitle>Delete employee?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.name} ({deleting?.employeeNumber}) will be removed from the employee list.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} size="small">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" size="small" loading={updating}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
