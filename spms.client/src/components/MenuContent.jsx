import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

// Same matching rule as the API: ignore case, spaces and punctuation
const normalize = (value) => (value ?? '').toString().replace(/[^a-z0-9]/gi, '').toLowerCase();

// roles: who sees the item (omit = everyone). Admin sees everything except the crew lead's Actuals screen.
const mainListItems = [
  { text: 'Home', icon: <HomeRoundedIcon />, path: '/' },
  { text: 'Admin Panel', icon: <AdminPanelSettingsRoundedIcon />, path: '/admin', roles: ['Admin'] },
  { text: 'Create Plan', icon: <EventNoteRoundedIcon />, path: '/plans/create', roles: ['Admin', 'MinePlanner', 'ShiftSupervisor'] },
  { text: 'My Plans', icon: <ListAltRoundedIcon />, path: '/plans/mine', roles: ['Admin', 'MinePlanner', 'ShiftSupervisor'] },
  { text: 'Shift', icon: <PlayCircleRoundedIcon />, path: '/shift', roles: ['Admin', 'ShiftSupervisor'] },
  { text: 'Actuals', icon: <EditNoteRoundedIcon />, path: '/actuals', roles: ['CrewLead'] },
];

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useSelector((state) => state.auth.role);

  const visible = mainListItems.filter(
    (item) => !item.roles || item.roles.some((r) => normalize(r) === normalize(role)),
  );

  return (
    <Stack sx={{ flexGrow: 1, p: 1 }}>
      <List dense>
        {visible.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={item.path === location.pathname}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
