import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
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
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  useGetCrewPlansQuery,
  useAcceptPlanMutation,
  useUpdateAndAcceptPlanMutation,
} from '../features/plan/planApi';
import { useGetAllAreasQuery } from '../features/area/areaApi';
import { useGetAllPlanTypesQuery } from '../features/planType/planTypeApi';

const STATUS_COLOR = {
  Pending: 'warning',
  Accepted: 'success',
  'Accepted with changes': 'info',
};

const FILTERS = ['Pending', 'Accepted', 'All'];

const errorMessage = (err) => err?.data?.message ?? 'Request failed';

const fmtTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

// "2026-10-07T06:00:00" -> value for <input type="datetime-local">
const toInputValue = (value) => (value ? value.slice(0, 16) : '');

// Backend binds the PlanDto, so send every field it expects.
const toPlanDto = (row) => ({
  id: row.planId,
  date: row.date,
  shiftType: row.shiftType,
  area: row.area,
  planType: row.planType,
  target: row.target,
  startTime: row.startTime,
  endTime: row.endTime,
  comment: row.comment,
});

export default function CrewPlans() {
  const { data: plans = [], isLoading, isError } = useGetCrewPlansQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
  });
  const { data: areas = [] } = useGetAllAreasQuery();
  const { data: planTypes = [] } = useGetAllPlanTypesQuery();
  const [acceptPlan, { isLoading: accepting }] = useAcceptPlanMutation();
  const [updateAndAccept, { isLoading: updating }] = useUpdateAndAcceptPlanMutation();

  const [filter, setFilter] = useState('Pending');
  const [accepting_, setAccepting] = useState(null); // plan row awaiting accept confirmation
  const [editing, setEditing] = useState(null); // plan row being edited
  const [form, setForm] = useState({});
  const [feedback, setFeedback] = useState(null);

  const pendingCount = plans.filter((p) => p.status === 'Pending').length;
  const acceptedCount = plans.length - pendingCount;

  const rows = useMemo(() => {
    if (filter === 'Pending') return plans.filter((p) => p.status === 'Pending');
    if (filter === 'Accepted') return plans.filter((p) => p.status !== 'Pending');
    return plans;
  }, [plans, filter]);

  const counts = { Pending: pendingCount, Accepted: acceptedCount, All: plans.length };

  const unit = planTypes.find((t) => t.type === form.planType)?.unit;
  const timesInvalid = form.startTime && form.endTime && form.endTime <= form.startTime;

  const openEdit = (row) => {
    setForm({
      area: row.area,
      planType: row.planType,
      target: row.target ?? '',
      startTime: toInputValue(row.startTime),
      endTime: toInputValue(row.endTime),
      comment: row.comment ?? '',
    });
    setEditing(row);
  };

  const setField = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const confirmAccept = async () => {
    const row = accepting_;
    try {
      await acceptPlan(toPlanDto(row)).unwrap();
      setFeedback({ severity: 'success', message: `Accepted: ${row.planType} in ${row.area}` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setAccepting(null);
  };

  const handleUpdateAndAccept = async (event) => {
    event.preventDefault();
    if (timesInvalid) return;
    try {
      await updateAndAccept({
        ...toPlanDto(editing),
        area: form.area,
        planType: form.planType,
        target: Number(form.target),
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
        comment: form.comment.trim() || null,
      }).unwrap();
      setFeedback({ severity: 'success', message: `Updated and accepted: ${form.planType} in ${form.area}` });
      setEditing(null);
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
  };

  const columns = [
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'shiftType', headerName: 'Shift', width: 100 },
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
    { field: 'comment', headerName: 'Comment', flex: 1, minWidth: 160 },
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
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) =>
        params.row.status === 'Pending' ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Accept as is">
              <IconButton size="small" aria-label="Accept plan" onClick={() => setAccepting(params.row)}>
                <CheckCircleRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit and accept">
              <IconButton size="small" aria-label="Edit and accept plan" onClick={() => openEdit(params.row)}>
                <EditRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null,
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Crew Plans
      </Typography>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 2 }}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={`${f} (${counts[f]})`}
              size="small"
              color={f === 'Pending' ? 'warning' : f === 'Accepted' ? 'success' : 'default'}
              variant={filter === f ? 'filled' : 'outlined'}
              onClick={() => setFilter(f)}
            />
          ))}
        </Stack>

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Couldn&apos;t load plans. Check the API is running and you&apos;re signed in.
          </Alert>
        )}
        {feedback && (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        )}
        {!isLoading && !isError && plans.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No plans for you yet. Plans appear here when someone creates one for the crew you lead.
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

      {/* Accept as is */}
      <Dialog open={Boolean(accepting_)} onClose={() => setAccepting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Accept plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {accepting_?.planType} in {accepting_?.area}, target {accepting_?.target} {accepting_?.unit} (
            {accepting_?.shiftType}, {accepting_?.date}). Once accepted, the plan is locked.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAccepting(null)} size="small">Cancel</Button>
          <Button onClick={confirmAccept} variant="contained" size="small" loading={accepting}>
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit and accept */}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleUpdateAndAccept}>
          <DialogTitle>Edit and accept plan</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {editing?.shiftType} shift, {editing?.date}. Date and shift can&apos;t be changed.
            </Typography>
            <Grid container spacing={2} columns={12}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select name="area" label="Area" value={form.area ?? ''} onChange={setField} required fullWidth size="small">
                  {areas.map((a) => (
                    <MenuItem key={a.areaId} value={a.areaName}>{a.areaName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select name="planType" label="Activity" value={form.planType ?? ''} onChange={setField} required fullWidth size="small">
                  {planTypes.map((t) => (
                    <MenuItem key={t.planTypeId} value={t.type}>{t.type}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  type="number"
                  name="target"
                  label="Target"
                  value={form.target ?? ''}
                  onChange={setField}
                  required
                  fullWidth
                  size="small"
                  slotProps={{
                    htmlInput: { min: 1 },
                    input: unit
                      ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }
                      : undefined,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="datetime-local"
                  name="startTime"
                  label="Planned start"
                  value={form.startTime ?? ''}
                  onChange={setField}
                  required
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="datetime-local"
                  name="endTime"
                  label="Planned end"
                  value={form.endTime ?? ''}
                  onChange={setField}
                  required
                  fullWidth
                  size="small"
                  error={Boolean(timesInvalid)}
                  helperText={timesInvalid ? 'End must be after start' : undefined}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  name="comment"
                  label="Comment (optional)"
                  value={form.comment ?? ''}
                  onChange={setField}
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditing(null)} size="small">Cancel</Button>
            <Button type="submit" variant="contained" size="small" loading={updating} disabled={Boolean(timesInvalid)}>
              Update and accept
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
