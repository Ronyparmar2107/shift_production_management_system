import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  useGetAllAreasQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
} from '../features/area/areaApi';
import EmployeeManagement from './EmployeeManagement';
import CrewManagement from './CrewManagement';
import PlanTypeManagement from './PlanTypeManagement';

const sections = [
  {
    title: 'Crew Management',
    fields: [],
    custom: CrewManagement, // tabs with a `custom` component render it instead of the generic form
  },
  {
    title: 'Employee Management',
    fields: [],
    custom: EmployeeManagement,
  },
  {
    title: 'Plan Type Management',
    fields: [],
    custom: PlanTypeManagement,
  },
  {
    title: 'Area Management',
    fields: [
      { name: 'areaName', label: 'Area name' },
    ],
    crud: true,
  },
  {
    title: 'Shift Management',
    fields: [
      { name: 'shiftName', label: 'Shift name' },
      { name: 'startTime', label: 'Start time', type: 'time' },
      { name: 'endTime', label: 'End time', type: 'time' },
    ],
  },
];

export default function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [values, setValues] = useState({});
  const [areaMode, setAreaMode] = useState('create');
  const [feedback, setFeedback] = useState(null); // { severity, message }
  const section = sections[tab];

  const { data: areas = [], isLoading: areasLoading } = useGetAllAreasQuery();
  const [createArea, { isLoading: creating }] = useCreateAreaMutation();
  const [updateArea, { isLoading: updating }] = useUpdateAreaMutation();
  const saving = creating || updating;

  const updateField = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleTabChange = (_, nextTab) => {
    setTab(nextTab);
    setValues({});
    setAreaMode('create');
    setFeedback(null);
  };

  const handleAreaModeChange = (_, nextMode) => {
    if (!nextMode) return;
    setAreaMode(nextMode);
    setValues({});
    setFeedback(null);
  };

  const handleAreaSelect = (event) => {
    const id = event.target.value;
    const area = areas.find((item) => item.areaId === id);
    setValues({ areaId: id, areaName: area ? area.areaName : '' });
  };

  const submitArea = async () => {
    try {
      if (areaMode === 'update') {
        await updateArea({ areaId: values.areaId, areaName: values.areaName }).unwrap();
        setFeedback({ severity: 'success', message: 'Area updated' });
      } else {
        await createArea({ areaName: values.areaName }).unwrap();
        setFeedback({ severity: 'success', message: 'Area created' });
      }
      setValues({});
    } catch (err) {
      setFeedback({ severity: 'error', message: err?.data?.message ?? 'Request failed' });
    }
  };

  const submitForm = (event) => {
    event.preventDefault();
    if (section.crud) {
      submitArea();
      return;
    }
    // Other tabs: replace with the appropriate API request when their backend is available.
    setValues({});
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Admin Panel
      </Typography>
      <Card sx={{ p: 0, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="standard"
          centered
          aria-label="Admin management forms"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          {sections.map(({ title }) => <Tab key={title} label={title} />)}
        </Tabs>
        {section.custom && (
          <Box key={section.title} sx={{ p: { xs: 2, md: 3 } }}>
            <section.custom />
          </Box>
        )}
        {!section.custom && (
        <Box component="form" key={section.title} onSubmit={submitForm} sx={{ p: { xs: 2, md: 3 } }}>
          <Typography component="h3" variant="subtitle1" sx={{ mb: 2 }}>
            {section.title}
          </Typography>

          {section.crud && (
            <Box sx={{ mb: 2 }}>
              <ToggleButtonGroup
                value={areaMode}
                exclusive
                onChange={handleAreaModeChange}
                size="small"
              >
                <ToggleButton value="create">Create</ToggleButton>
                <ToggleButton value="update">Update</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          <Box sx={{ display: 'grid', gap: 2, maxWidth: 480 }}>
            {section.crud && areaMode === 'update' && (
              <TextField
                select
                label="Select area"
                value={values.areaId || ''}
                onChange={handleAreaSelect}
                required
                fullWidth
                size="small"
                disabled={areasLoading}
                helperText={!areasLoading && areas.length === 0 ? 'No areas yet — create one first' : undefined}
              >
                {areas.map((area) => (
                  <MenuItem key={area.areaId} value={area.areaId}>{area.areaName}</MenuItem>
                ))}
              </TextField>
            )}

            {section.fields.map((field) => (
              <TextField
                key={field.name}
                {...field}
                label={field.label}
                value={values[field.name] || ''}
                onChange={updateField}
                fullWidth
                required
                size="small"
                InputLabelProps={field.type === 'time' ? { shrink: true } : undefined}
              />
            ))}
            {section.status && (
              <TextField
                select
                name="employmentStatus"
                label="Employment status"
                value={values.employmentStatus || ''}
                onChange={updateField}
                required
                fullWidth
                size="small"
              >
                {['Active', 'On leave', 'Inactive'].map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </TextField>
            )}
            <Box>
              <Button type="submit" variant="contained" size="small" disabled={section.crud && saving}>
                {section.crud && areaMode === 'update' ? 'Update' : 'Save'}
              </Button>
            </Box>
            {section.crud && feedback && (
              <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
                {feedback.message}
              </Alert>
            )}
          </Box>
        </Box>
        )}
      </Card>
    </Box>
  );
}
