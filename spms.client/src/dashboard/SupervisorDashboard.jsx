import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { BarChart } from '@mui/x-charts/BarChart';
import { useGetDashboardQuery } from '../features/shift/shiftApi';
import { SHIFTS, currentShift, utcDate, fmtClock } from '../app/shiftUtils';
import {
  ProgressBar,
  SHIFT_STATUS,
  StatTile,
  StatusChip,
  fmt,
  fmtDay,
  fmtSigned,
  fmtTime,
  pctOf,
} from './dashboardUi';

const errorMessage = (err) => err?.data?.message ?? 'Request failed';

function runningFor(startedAt) {
  const start = utcDate(startedAt);
  if (!start) return '';
  const minutes = Math.max(0, Math.round((Date.now() - start.getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

// One row per plan: "are we on track right now" without opening anything
function PlanTable({ rows, showProjection }) {
  return (
    <TableContainer>
      <Table size="small" aria-label="Plan versus actual">
        <TableHead>
          <TableRow>
            <TableCell>Crew / area</TableCell>
            <TableCell>Activity</TableCell>
            <TableCell align="right">Target</TableCell>
            <TableCell align="right">Expected</TableCell>
            <TableCell align="right">Actual</TableCell>
            <TableCell sx={{ minWidth: 120 }}>Progress</TableCell>
            <TableCell align="right">Variance</TableCell>
            <TableCell>Status</TableCell>
            {showProjection && <TableCell align="right">Projected finish</TableCell>}
            {showProjection && <TableCell>Last entry</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.planId} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.crewName}
                  {row.leadName ? ` · ${row.leadName}` : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.area} · {fmtTime(row.plannedStart)}–{fmtTime(row.plannedEnd)}
                </Typography>
              </TableCell>
              <TableCell>{row.planType}</TableCell>
              <TableCell align="right">
                {fmt(row.target, 0)} {row.unit}
              </TableCell>
              <TableCell align="right">{row.expected != null ? `${fmt(row.expected)} ${row.unit}` : '–'}</TableCell>
              <TableCell align="right">
                {fmt(row.actual)} {row.unit}
              </TableCell>
              <TableCell>
                <ProgressBar
                  actual={row.actual}
                  expected={row.expected}
                  target={row.target}
                  status={row.varianceStatus}
                />
              </TableCell>
              <TableCell align="right">
                {row.varianceUnits != null && row.expected ? (
                  <>
                    {fmtSigned(row.varianceUnits)} {row.unit}
                    {row.variancePct != null && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {fmtSigned(row.variancePct)}%
                      </Typography>
                    )}
                  </>
                ) : (
                  '–'
                )}
              </TableCell>
              <TableCell>
                <StatusChip row={row} />
              </TableCell>
              {showProjection && (
                <TableCell align="right">
                  {row.projectedEnd != null ? (
                    <Tooltip title="Projection at the current rate">
                      <span>
                        {fmt(row.projectedEnd, 0)} {row.unit}
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {row.projectedShortfall > 0
                            ? `shortfall ${fmt(row.projectedShortfall, 0)}`
                            : 'on target'}
                        </Typography>
                      </span>
                    </Tooltip>
                  ) : (
                    '–'
                  )}
                </TableCell>
              )}
              {showProjection && (
                <TableCell>
                  {row.minutesSinceUpdate == null ? 'No entries' : `${row.minutesSinceUpdate} min ago`}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ProgressChart({ rows }) {
  const accepted = rows.filter((r) => r.expected != null && r.target);
  if (accepted.length === 0) return null;

  const labels = accepted.map((r) => `${r.planType} · ${r.crewName}`);
  const expected = accepted.map((r) => Math.round(pctOf(r.expected, r.target) * 10) / 10);
  const actual = accepted.map((r) => Math.round(pctOf(r.actual, r.target) * 10) / 10);

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Progress vs expected, % of target
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Compared on the same scale, so tonnes, metres and holes can sit side by side.
      </Typography>
      <BarChart
        height={280}
        xAxis={[{ scaleType: 'band', data: labels }]}
        yAxis={[{ min: 0, max: 100, label: '% of target' }]}
        series={[
          { data: expected, label: 'Expected by now' },
          { data: actual, label: 'Actual' },
        ]}
        margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
      />
    </Card>
  );
}

function ShiftHeading({ shift }) {
  const state = SHIFT_STATUS[shift.status] ?? SHIFT_STATUS.NotStarted;
  const started = utcDate(shift.startedAt);
  const ended = utcDate(shift.endedAt);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {shift.shiftType} · {fmtDay(shift.date)}
      </Typography>
      <Chip size="small" label={state.label} color={state.color} variant={shift.status === 'Running' ? 'filled' : 'outlined'} />
      {started && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {fmtClock(started)}
          {ended ? `–${fmtClock(ended)}` : ''}
          {shift.startedByName ? ` · ${shift.startedByName}` : ''}
        </Typography>
      )}
    </Stack>
  );
}

function SummaryChips({ summary }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
      <Chip size="small" color="success" label={`${summary.green} on track`} variant={summary.green ? 'filled' : 'outlined'} />
      <Chip size="small" color="warning" label={`${summary.yellow} slipping`} variant={summary.yellow ? 'filled' : 'outlined'} />
      <Chip size="small" color="error" label={`${summary.red} behind`} variant={summary.red ? 'filled' : 'outlined'} />
    </Stack>
  );
}

// What the last shifts did, for the incoming supervisor
function HandoverCard({ shift }) {
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 1 }}
      >
        <ShiftHeading shift={shift} />
        <SummaryChips summary={shift.summary} />
      </Stack>
      <PlanTable rows={shift.rows} showProjection={false} />
    </Card>
  );
}

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const initial = useMemo(currentShift, []);
  const [date, setDate] = useState(initial.date);
  const [shift, setShift] = useState(initial.shift);

  const { data, isLoading, isError, error } = useGetDashboardQuery(
    { date, shiftType: shift },
    { pollingInterval: 30000, refetchOnFocus: true, refetchOnMountOrArgChange: true, skip: !date },
  );

  const current = data?.current;
  const previous = data?.previous ?? [];
  const summary = current?.summary;
  const rows = useMemo(() => current?.rows ?? [], [current]);
  const running = current?.status === 'Running';

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
      >
        <Box>
          <Typography component="h2" variant="h6">
            Shift dashboard
          </Typography>
          {current && <ShiftHeading shift={current} />}
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <TextField
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField select label="Shift" value={shift} onChange={(e) => setShift(e.target.value)} size="small" sx={{ minWidth: 140 }}>
            {SHIFTS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" size="small" onClick={() => navigate('/shift')}>
            Manage shift
          </Button>
        </Stack>
      </Stack>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(error)}
        </Alert>
      )}

      {current && summary && (
        <>
          <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <StatTile
                label="Plans accepted"
                value={`${summary.accepted}/${summary.total}`}
                hint={summary.pending ? `${summary.pending} awaiting acceptance` : 'all accepted'}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <StatTile label="On track" value={summary.green} color="success" />
            </Grid>
            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <StatTile label="Slipping" value={summary.yellow} color="warning" hint="5–15% behind" />
            </Grid>
            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <StatTile label="Behind" value={summary.red} color="error" hint="over 15% behind" />
            </Grid>
            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <StatTile label="No recent update" value={summary.stale} hint="no entry in 60 min" />
            </Grid>
            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <StatTile
                label={running ? 'Running for' : 'Shift'}
                value={running ? runningFor(current.startedAt) : (SHIFT_STATUS[current.status]?.label ?? '–')}
              />
            </Grid>
          </Grid>

          {current.status === 'NotStarted' && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/shift')}>
                  Open shift
                </Button>
              }
            >
              This shift hasn&apos;t started. Start it to accept plans and let crews log actuals.
            </Alert>
          )}
          {rows.length === 0 && current.status !== 'NotStarted' && (
            <Alert severity="info" sx={{ mb: 2 }}>No plans in this shift.</Alert>
          )}

          {rows.length > 0 && (
            <>
              <ProgressChart rows={rows} />
              <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Plan vs actual</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    The tick on each bar marks where the crew should be by now. Worst first.
                  </Typography>
                </Stack>
                <PlanTable rows={rows} showProjection />
              </Card>
            </>
          )}
        </>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Handover: last shifts
      </Typography>
      {!isLoading && previous.length === 0 && (
        <Alert severity="info">No earlier shifts with plans to show yet.</Alert>
      )}
      <Stack spacing={2}>
        {previous.map((s) => (
          <HandoverCard key={s.shiftId} shift={s} />
        ))}
      </Stack>
    </Box>
  );
}
