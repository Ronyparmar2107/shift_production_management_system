import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGetMyPlansQuery } from '../features/plan/planApi';
import { StatTile, fmt, fmtDay, fmtTime } from './dashboardUi';

const PLAN_STATUS_COLOR = { Pending: 'warning', Accepted: 'success', Updated: 'info' };

export default function PlannerHome() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading, isError } = useGetMyPlansQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const count = (status) => plans.filter((p) => p.status === status).length;
  const recent = plans.slice(0, 10);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography component="h2" variant="h6">
          My plans
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={() => navigate('/plans/mine')}>
            All my plans
          </Button>
          <Button variant="contained" size="small" onClick={() => navigate('/plans/create')}>
            Create plan
          </Button>
        </Stack>
      </Stack>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn&apos;t load your plans. Check the API is running and you&apos;re signed in.
        </Alert>
      )}

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label="Plans created" value={plans.length} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label="Waiting for supervisor" value={count('Pending')} color="warning" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label="Accepted" value={count('Accepted')} color="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label="Changed by supervisor" value={count('Updated')} color="info" />
        </Grid>
      </Grid>

      {!isLoading && !isError && plans.length === 0 ? (
        <Alert severity="info">You haven&apos;t created any plans yet.</Alert>
      ) : (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Latest plans
          </Typography>
          <TableContainer>
            <Table size="small" aria-label="Latest plans">
              <TableHead>
                <TableRow>
                  <TableCell>Shift</TableCell>
                  <TableCell>Crew / area</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell>Window</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Accepted by</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent.map((p) => (
                  <TableRow key={p.planId} hover>
                    <TableCell>
                      {p.shiftType} · {fmtDay(p.date)}
                    </TableCell>
                    <TableCell>
                      {p.crewName} · {p.leadName}
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {p.area}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.planType}</TableCell>
                    <TableCell align="right">
                      {fmt(p.target, 0)} {p.unit}
                    </TableCell>
                    <TableCell>
                      {fmtTime(p.startTime)}–{fmtTime(p.endTime)}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={p.status} color={PLAN_STATUS_COLOR[p.status] ?? 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell>{p.acceptedByName || '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
