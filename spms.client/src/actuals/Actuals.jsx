import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGetMyActualsQuery, useLogActualMutation } from '../features/actuals/actualsApi';

const STATUS_COLOR = {
  Green: 'success',
  Yellow: 'warning',
  Red: 'error',
  Stale: 'default',
  'Not started': 'default',
  'Awaiting acceptance': 'default',
};

const errorMessage = (err) => err?.data?.message ?? 'Request failed';

const fmt = (value, digits = 1) =>
  value == null ? '–' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

const fmtSigned = (value, digits = 1) =>
  value == null ? '–' : `${value > 0 ? '+' : ''}${fmt(value, digits)}`;

const fmtTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

// Local "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
const nowInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const toInputValue = (value) => (value ? value.slice(0, 16) : '');

const lastUpdate = (row) =>
  row.minutesSinceUpdate == null ? 'No entries yet' : `Last entry ${row.minutesSinceUpdate} min ago`;

export default function Actuals() {
  const { data: plans = [], isLoading, isError } = useGetMyActualsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [logActual, { isLoading: saving }] = useLogActualMutation();

  const [logging, setLogging] = useState(null); // plan row being logged
  const [form, setForm] = useState({ value: '', readingTime: '', comment: '' });
  const [prompt, setPrompt] = useState(null); // server asked for a reason: { message }
  const [dialogError, setDialogError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const openLog = (row) => {
    setForm({ value: '', readingTime: nowInput(), comment: '' });
    setPrompt(null);
    setDialogError(null);
    setLogging(row);
  };

  const closeLog = () => {
    setLogging(null);
    setPrompt(null);
    setDialogError(null);
  };

  const setField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDialogError(null);
    try {
      const result = await logActual({
        planId: logging.planId,
        value: Number(form.value),
        readingTime: `${form.readingTime}:00`,
        comment: form.comment.trim() || null,
      }).unwrap();

      if (result.reasonRequired) {
        // Nothing was saved yet: show why and let the lead add a reason
        setPrompt({ message: result.message });
        return;
      }

      setFeedback({
        severity: 'success',
        message: `Logged ${form.value} ${logging.unit} for ${logging.planType} in ${logging.area}`,
      });
      closeLog();
    } catch (err) {
      setDialogError(errorMessage(err));
    }
  };

  const reasonNeeded = Boolean(prompt);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Actuals
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn&apos;t load your plans. Check the API is running and you&apos;re signed in.
        </Alert>
      )}
      {feedback && (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {!isLoading && !isError && plans.length === 0 && (
        <Alert severity="info">
          Nothing to log right now. Plans show up here once your supervisor has started the shift and accepted them.
        </Alert>
      )}

      <Grid container spacing={2} columns={12}>
        {plans.map((row) => {
          const progress = row.target ? Math.min(100, (row.actual / row.target) * 100) : 0;
          const showProjection = row.projectedEnd != null;

          return (
            <Grid key={row.planId} size={{ xs: 12, md: 6, xl: 4 }}>
              <Card sx={{ p: 2.5, height: '100%' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {row.planType}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {row.area} · {row.shiftType} · {fmtTime(row.plannedStart)} – {fmtTime(row.plannedEnd)}
                    </Typography>
                  </Box>
                  <Chip
                    label={row.status || '–'}
                    size="small"
                    color={STATUS_COLOR[row.status] ?? 'default'}
                    variant={row.status === 'Green' || row.status === 'Yellow' || row.status === 'Red' ? 'filled' : 'outlined'}
                  />
                </Stack>

                <Typography variant="h5" sx={{ mt: 1 }}>
                  {fmt(row.actual)}{' '}
                  <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                    of {fmt(row.target, 0)} {row.unit}
                  </Typography>
                </Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ my: 1.5, height: 8, borderRadius: 4 }} />

                <Grid container spacing={1} columns={12} sx={{ mb: 1.5 }}>
                  <Grid size={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Expected now</Typography>
                    <Typography variant="body2">{fmt(row.expected)} {row.unit}</Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Variance</Typography>
                    <Typography variant="body2">
                      {fmtSigned(row.varianceUnits)} {row.unit}
                      {row.variancePct != null ? ` (${fmtSigned(row.variancePct)}%)` : ''}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {showProjection ? 'Projected finish' : 'Projection'}
                    </Typography>
                    <Typography variant="body2">
                      {showProjection
                        ? `${fmt(row.projectedEnd, 0)} ${row.unit}`
                        : 'Not enough data yet'}
                    </Typography>
                  </Grid>
                </Grid>

                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: row.status === 'Stale' ? 'warning.main' : 'text.secondary' }}>
                    {lastUpdate(row)}
                  </Typography>
                  <Button variant="contained" size="small" onClick={() => openLog(row)}>
                    Log actual
                  </Button>
                </Stack>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={Boolean(logging)} onClose={closeLog} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>Log actual</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {logging?.planType} in {logging?.area}. Enter the total so far, not just the latest amount
              {logging?.lastLoggedAt ? ` (last total: ${fmt(logging?.actual)} ${logging?.unit})` : ''}.
            </Typography>

            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            {reasonNeeded && <Alert severity="warning" sx={{ mb: 2 }}>{prompt.message}</Alert>}

            <Stack spacing={2}>
              <TextField
                type="datetime-local"
                name="readingTime"
                label="Reading time"
                value={form.readingTime}
                onChange={setField}
                required
                fullWidth
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: toInputValue(logging?.plannedStart) },
                }}
              />
              <TextField
                type="number"
                name="value"
                label="Total so far"
                value={form.value}
                onChange={setField}
                required
                fullWidth
                size="small"
                autoFocus
                slotProps={{
                  htmlInput: { min: 0, step: 'any' },
                  input: logging?.unit
                    ? { endAdornment: <InputAdornment position="end">{logging.unit}</InputAdornment> }
                    : undefined,
                }}
              />
              <TextField
                name="comment"
                label={reasonNeeded ? 'Reason (required)' : 'Comment (optional)'}
                value={form.comment}
                onChange={setField}
                required={reasonNeeded}
                fullWidth
                multiline
                minRows={2}
                size="small"
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeLog} size="small">Cancel</Button>
            <Button type="submit" variant="contained" size="small" loading={saving}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
