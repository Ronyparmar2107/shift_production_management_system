import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useGetShiftOverviewQuery,
  useStartShiftMutation,
  useEndShiftMutation,
} from '../features/shift/shiftApi';
import {
  useAcceptPlanMutation,
  useUpdateAndAcceptPlanMutation,
} from '../features/plan/planApi';
import { useGetAllAreasQuery } from '../features/area/areaApi';
import { useGetAllPlanTypesQuery } from '../features/planType/planTypeApi';
import { SHIFTS, currentShift, utcDate, fmtClock } from '../app/shiftUtils';

const PLAN_STATUS_COLOR = {
  Pending: 'warning',
  Accepted: 'success',
  Updated: 'info',
};

const SHIFT_STATUS = {
  NotStarted: { label: 'Not started', color: 'warning' },
  Running: { label: 'Running', color: 'success' },
  Ended: { label: 'Ended', color: 'default' },
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

export default function ShiftManagement() {
  const navigate = useNavigate();
  const initial = useMemo(currentShift, []);
  const [date, setDate] = useState(initial.date);
  const [shift, setShift] = useState(initial.shift);

  const { data: overview, isLoading, isError, error } = useGetShiftOverviewQuery(
    { date, shiftType: shift },
    { pollingInterval: 30000, refetchOnFocus: true, refetchOnMountOrArgChange: true, skip: !date },
  );
  const { data: areas = [] } = useGetAllAreasQuery();
  const { data: planTypes = [] } = useGetAllPlanTypesQuery();
  const [startShift, { isLoading: starting }] = useStartShiftMutation();
  const [endShift, { isLoading: ending }] = useEndShiftMutation();
  const [acceptPlan, { isLoading: accepting }] = useAcceptPlanMutation();
  const [updateAndAccept, { isLoading: updating }] = useUpdateAndAcceptPlanMutation();

  const [filter, setFilter] = useState('All');
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [toAccept, setToAccept] = useState(null); // plan row awaiting accept confirmation
  const [editing, setEditing] = useState(null); // plan row being edited
  const [form, setForm] = useState({});
  const [feedback, setFeedback] = useState(null);

  const status = overview?.status ?? 'NotStarted';
  const plans = useMemo(() => overview?.plans ?? [], [overview]);
  const running = status === 'Running';
  const ended = status === 'Ended';

  const pendingCount = plans.filter((p) => p.status === 'Pending').length;
  const counts = { Pending: pendingCount, Accepted: plans.length - pendingCount, All: plans.length };

  const rows = useMemo(() => {
    if (filter === 'Pending') return plans.filter((p) => p.status === 'Pending');
    if (filter === 'Accepted') return plans.filter((p) => p.status !== 'Pending');
    return plans;
  }, [plans, filter]);

  const unit = planTypes.find((t) => t.type === form.planType)?.unit;
  const timesInvalid = form.startTime && form.endTime && form.endTime <= form.startTime;

  const handleStart = async () => {
    try {
      await startShift({ date, shiftType: shift }).unwrap();
      setFeedback({ severity: 'success', message: `${shift} shift started` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setConfirmStart(false);
  };

  const handleEnd = async () => {
    try {
      await endShift({ id: overview.shiftId }).unwrap();
      setFeedback({ severity: 'success', message: `${shift} shift ended. Actuals are now locked.` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setConfirmEnd(false);
  };

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
    const row = toAccept;
    try {
      await acceptPlan(toPlanDto(row)).unwrap();
      setFeedback({ severity: 'success', message: `Accepted: ${row.planType} in ${row.area}` });
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
    setToAccept(null);
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
    { field: 'area', headerName: 'Area', flex: 1, minWidth: 170 },
    { field: 'planType', headerName: 'Activity', width: 130 },
    {
      field: 'crew',
      headerName: 'Crew',
      width: 170,
      valueGetter: (value, row) => `${row.crewName} · ${row.leadName}`,
    },
    {
      field: 'target',
      headerName: 'Target',
      width: 120,
      valueGetter: (value, row) => (row.target != null ? `${row.target} ${row.unit}` : ''),
    },
    {
      field: 'window',
      headerName: 'Planned window',
      width: 140,
      sortable: false,
      valueGetter: (value, row) => `${fmtTime(row.startTime)} – ${fmtTime(row.endTime)}`,
    },
    { field: 'comment', headerName: 'Comment', flex: 1, minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={PLAN_STATUS_COLOR[params.value] ?? 'default'} variant="outlined" />
      ),
    },
    { field: 'createdByName', headerName: 'Created by', width: 130 },
    { field: 'acceptedByName', headerName: 'Accepted by', width: 130 },
    { field: 'updatedByName', headerName: 'Updated by', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) =>
        running && params.row.status === 'Pending' ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Accept as is">
              <IconButton size="small" aria-label="Accept plan" onClick={() => setToAccept(params.row)}>
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
        Shift
      </Typography>

      <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          <TextField
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField select label="Shift" value={shift} onChange={(e) => setShift(e.target.value)} size="small" sx={{ minWidth: 150 }}>
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>

          <Chip
            label={SHIFT_STATUS[status].label}
            color={SHIFT_STATUS[status].color}
            variant={running ? 'filled' : 'outlined'}
          />
          {overview?.startedAt && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Started {fmtClock(utcDate(overview.startedAt))}
              {overview.startedByName ? ` by ${overview.startedByName}` : ''}
              {overview.endedAt ? `, ended ${fmtClock(utcDate(overview.endedAt))}` : ''}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {!ended && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/plans/create', { state: { date, shift } })}
            >
              Create plan
            </Button>
          )}
          {status === 'NotStarted' && (
            <Button variant="contained" size="small" onClick={() => setConfirmStart(true)} disabled={!date}>
              Start shift
            </Button>
          )}
          {running && (
            <Button variant="contained" color="error" size="small" onClick={() => setConfirmEnd(true)}>
              End shift
            </Button>
          )}
        </Stack>
      </Card>

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
            {errorMessage(error)}
          </Alert>
        )}
        {feedback && (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        )}
        {!isLoading && !isError && status === 'NotStarted' && plans.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Start the shift to accept its plans.
          </Alert>
        )}
        {!isLoading && !isError && plans.length === 0 && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              !ended && (
                <Button color="inherit" size="small" onClick={() => navigate('/plans/create', { state: { date, shift } })}>
                  Create plan
                </Button>
              )
            }
          >
            No plans for this shift yet.
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

      {/* Start shift */}
      <Dialog open={confirmStart} onClose={() => setConfirmStart(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start {shift} shift?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {date}. You will be recorded as the supervisor. Plans can be accepted once the shift is running.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmStart(false)} size="small">Cancel</Button>
          <Button onClick={handleStart} variant="contained" size="small" loading={starting}>
            Start shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* End shift */}
      <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)} maxWidth="xs" fullWidth>
        <DialogTitle>End {shift} shift?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Crew leads will no longer be able to log actuals for this shift. This can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmEnd(false)} size="small">Cancel</Button>
          <Button onClick={handleEnd} variant="contained" color="error" size="small" loading={ending}>
            End shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accept as is */}
      <Dialog open={Boolean(toAccept)} onClose={() => setToAccept(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Accept plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toAccept?.planType} in {toAccept?.area}, target {toAccept?.target} {toAccept?.unit} for{' '}
            {toAccept?.crewName}. Once accepted, the plan is locked.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToAccept(null)} size="small">Cancel</Button>
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
