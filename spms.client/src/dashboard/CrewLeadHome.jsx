import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, LinearProgress, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGetMyActualsQuery } from '../features/actuals/actualsApi';
import { ProgressBar, StatTile, StatusChip, fmt, fmtSigned, fmtTime } from './dashboardUi';

export default function CrewLeadHome() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading, isError } = useGetMyActualsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const count = (status) => plans.filter((p) => p.status === status).length;
  const needsUpdate = plans.filter((p) => p.status === 'Stale' || p.lastLoggedAt == null).length;

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography component="h2" variant="h6">
          My crew&apos;s shift
        </Typography>
        <Button variant="contained" size="small" onClick={() => navigate('/actuals')}>
          Log actuals
        </Button>
      </Stack>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Couldn&apos;t load your plans. Check the API is running and you&apos;re signed in.
        </Alert>
      )}
      {!isLoading && !isError && plans.length === 0 && (
        <Alert severity="info">
          Nothing running right now. Plans show up here once your supervisor starts the shift and accepts them.
        </Alert>
      )}

      {plans.length > 0 && (
        <>
          <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile label="Plans running" value={plans.length} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile label="On track" value={count('Green')} color="success" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile label="Slipping or behind" value={count('Yellow') + count('Red')} color="warning" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile label="Need an update" value={needsUpdate} hint="no entry yet, or over 60 min" />
            </Grid>
          </Grid>

          <Grid container spacing={2} columns={12}>
            {plans.map((row) => (
              <Grid key={row.planId} size={{ xs: 12, md: 6, xl: 4 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">{row.planType}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {row.area} · {fmtTime(row.plannedStart)}–{fmtTime(row.plannedEnd)}
                      </Typography>
                    </Box>
                    <StatusChip row={row} />
                  </Stack>
                  <Typography variant="h6">
                    {fmt(row.actual)}{' '}
                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                      of {fmt(row.target, 0)} {row.unit}
                    </Typography>
                  </Typography>
                  <Box sx={{ my: 1.5 }}>
                    <ProgressBar actual={row.actual} expected={row.expected} target={row.target} status={row.status} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Expected {fmt(row.expected)} {row.unit}
                    {row.varianceUnits != null && row.expected ? ` · variance ${fmtSigned(row.varianceUnits)} ${row.unit}` : ''}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
