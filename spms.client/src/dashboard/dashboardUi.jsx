import React from 'react';
import { Box, Card, Chip, Typography } from '@mui/material';

// Variance status -> MUI palette colour (grey for the "no colour yet" states)
export const STATUS_COLOR = {
  Green: 'success',
  Yellow: 'warning',
  Red: 'error',
  Stale: 'default',
  'Not started': 'default',
  'Awaiting acceptance': 'default',
};

export const SHIFT_STATUS = {
  NotStarted: { label: 'Not started', color: 'warning' },
  Running: { label: 'Running', color: 'success' },
  Ended: { label: 'Ended', color: 'default' },
};

export const fmt = (value, digits = 1) =>
  value == null ? '–' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

export const fmtSigned = (value, digits = 1) =>
  value == null ? '–' : `${value > 0 ? '+' : ''}${fmt(value, digits)}`;

export const fmtTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export const fmtDay = (value) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

export const pctOf = (value, target) => (target ? (Number(value) / Number(target)) * 100 : 0);

// "No update in N min" instead of trusting the colour, per the variance spec
export const statusLabel = (row) => {
  const status = row.varianceStatus ?? row.status;
  if (status === 'Stale' && row.minutesSinceUpdate != null) return `No update in ${row.minutesSinceUpdate} min`;
  return status || '–';
};

export function StatusChip({ row }) {
  const status = row.varianceStatus ?? row.status;
  const color = STATUS_COLOR[status] ?? 'default';
  const solid = status === 'Green' || status === 'Yellow' || status === 'Red';
  return <Chip size="small" label={statusLabel(row)} color={color} variant={solid ? 'filled' : 'outlined'} />;
}

// Actual progress against target, with a tick at where the crew should be by now
export function ProgressBar({ actual, expected, target, status }) {
  const color = STATUS_COLOR[status] ?? 'default';
  const actualPct = Math.min(100, pctOf(actual, target));
  const expectedPct = Math.min(100, pctOf(expected, target));

  return (
    <Box
      sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: 'action.hover', minWidth: 90 }}
      role="img"
      aria-label={`${Math.round(actualPct)}% of target done, ${Math.round(expectedPct)}% expected by now`}
    >
      <Box
        sx={{
          width: `${actualPct}%`,
          height: '100%',
          borderRadius: 4,
          bgcolor: color === 'default' ? 'text.disabled' : `${color}.main`,
        }}
      />
      {expected != null && (
        <Box
          sx={{
            position: 'absolute',
            left: `calc(${expectedPct}% - 1px)`,
            top: -3,
            bottom: -3,
            width: 2,
            bgcolor: 'text.primary',
            opacity: 0.6,
          }}
        />
      )}
    </Box>
  );
}

export function StatTile({ label, value, hint, color }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        borderLeft: 4,
        borderLeftColor: color && color !== 'default' ? `${color}.main` : 'divider',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}
