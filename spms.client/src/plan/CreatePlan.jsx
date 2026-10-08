import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGetAllAreasQuery } from '../features/area/areaApi';
import { useGetAllCrewsQuery } from '../features/crew/crewApi';
import { useCreatePlanMutation } from '../features/plan/planApi';
import { useGetAllPlanTypesQuery } from '../features/planType/planTypeApi';

// Shift names are stored as text in shift_master.type; default times prefill the plan window.
const SHIFTS = [
  { name: 'Morning', start: '06:00', end: '14:00', endsNextDay: false },
  { name: 'Afternoon', start: '14:00', end: '22:00', endsNextDay: false },
  { name: 'Night', start: '22:00', end: '06:00', endsNextDay: true },
];

const todayISO = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

const addDay = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

// Plan window for a date + shift, as values for <input type="datetime-local">
const shiftWindow = (date, shiftName) => {
  const shift = SHIFTS.find((s) => s.name === shiftName);
  if (!date || !shift) return { startTime: '', endTime: '' };
  return {
    startTime: `${date}T${shift.start}`,
    endTime: `${shift.endsNextDay ? addDay(date) : date}T${shift.end}`,
  };
};

const initialForm = () => ({
  date: todayISO(),
  shift: 'Morning',
  crewLeadId: '',
  area: '',
  planType: '',
  target: '',
  comment: '',
  ...shiftWindow(todayISO(), 'Morning'),
});

const errorMessage = (err) => err?.data?.message ?? 'Request failed';

export default function CreatePlan() {
  const { data: areas = [], isLoading: areasLoading } = useGetAllAreasQuery();
  const { data: crews = [], isLoading: crewsLoading } = useGetAllCrewsQuery();
  const { data: planTypes = [], isLoading: typesLoading } = useGetAllPlanTypesQuery();
  const [createPlan, { isLoading: saving }] = useCreatePlanMutation();

  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState(null);

  const unit = planTypes.find((t) => t.type === form.planType)?.unit;
  const timesInvalid = form.startTime && form.endTime && form.endTime <= form.startTime;

  const setField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  // Changing date or shift refills the plan window with that shift's default hours.
  const setDateOrShift = (event) => {
    const next = { ...form, [event.target.name]: event.target.value };
    setForm({ ...next, ...shiftWindow(next.date, next.shift) });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (timesInvalid) return;

    try {
      await createPlan({
        date: form.date,
        shiftType: form.shift,
        crewLeadId: form.crewLeadId,
        area: form.area,
        planType: form.planType,
        target: Number(form.target),
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
        comment: form.comment.trim() || null,
      }).unwrap();

      const crew = crews.find((c) => c.leadEmpId === form.crewLeadId);
      setFeedback({
        severity: 'success',
        message: `Plan created: ${crew?.crewName ?? 'crew'}, ${form.planType} in ${form.area} (${form.shift}, ${form.date})`,
      });
      // Keep date and shift so several plans for the same shift can be entered quickly.
      setForm((current) => ({
        ...current,
        crewLeadId: '',
        area: '',
        planType: '',
        target: '',
        comment: '',
        ...shiftWindow(current.date, current.shift),
      }));
    } catch (err) {
      setFeedback({ severity: 'error', message: errorMessage(err) });
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Create Plan
      </Typography>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2} columns={12} sx={{ maxWidth: 900 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="date"
                name="date"
                label="Date"
                value={form.date}
                onChange={setDateOrShift}
                required
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                name="shift"
                label="Shift"
                value={form.shift}
                onChange={setDateOrShift}
                required
                fullWidth
                size="small"
              >
                {SHIFTS.map((s) => (
                  <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                name="crewLeadId"
                label="Crew"
                value={form.crewLeadId}
                onChange={setField}
                required
                fullWidth
                size="small"
                disabled={crewsLoading}
                helperText={!crewsLoading && crews.length === 0 ? 'No crews yet — create one in Admin Panel' : undefined}
              >
                {crews.map((c) => (
                  <MenuItem key={c.crewId} value={c.leadEmpId}>
                    {c.crewName} — {c.leadName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                name="area"
                label="Area"
                value={form.area}
                onChange={setField}
                required
                fullWidth
                size="small"
                disabled={areasLoading}
                helperText={!areasLoading && areas.length === 0 ? 'No areas yet — create one in Admin Panel' : undefined}
              >
                {areas.map((a) => (
                  <MenuItem key={a.areaId} value={a.areaName}>{a.areaName}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                name="planType"
                label="Activity"
                value={form.planType}
                onChange={setField}
                required
                fullWidth
                size="small"
                disabled={typesLoading}
              >
                {planTypes.map((t) => (
                  <MenuItem key={t.planTypeId} value={t.type}>{t.type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                name="target"
                label="Target"
                value={form.target}
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
                value={form.startTime}
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
                value={form.endTime}
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
                value={form.comment}
                onChange={setField}
                fullWidth
                multiline
                minRows={2}
                size="small"
              />
            </Grid>

            <Grid size={12}>
              <Stack spacing={2}>
                <Box>
                  <Button type="submit" variant="contained" size="small" loading={saving} disabled={Boolean(timesInvalid)}>
                    Create plan
                  </Button>
                </Box>
                {feedback && (
                  <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
                    {feedback.message}
                  </Alert>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
