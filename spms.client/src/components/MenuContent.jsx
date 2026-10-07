import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import { useNavigate, useLocation } from 'react-router-dom';

// path: null = not wired to a route yet (template placeholder, still inert)
const mainListItems = [
  { text: 'Home', icon: <HomeRoundedIcon />, path: '/' },
  { text: 'Admin Panel', icon: <HomeRoundedIcon />, path: '/admin' },
  { text: 'Create Plan', icon: <EventNoteRoundedIcon />, path: '/plans/create' },
  { text: 'My Plans', icon: <ListAltRoundedIcon />, path: '/plans/mine' },
  { text: 'Crew Plans', icon: <FactCheckRoundedIcon />, path: '/plans/crew' },
  { text: 'Analytics', icon: <AnalyticsRoundedIcon />, path: null },
  { text: 'Clients', icon: <PeopleRoundedIcon />, path: null },
  { text: 'Tasks', icon: <AssignmentRoundedIcon />, path: null },
];

const secondaryListItems = [
  { text: 'Settings', icon: <SettingsRoundedIcon />, path: null },
  { text: 'About', icon: <InfoRoundedIcon />, path: null },
  { text: 'Feedback', icon: <HelpRoundedIcon />, path: null },
];

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={item.path === location.pathname}
              disabled={!item.path}
              onClick={() => item.path && navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton disabled={!item.path} onClick={() => item.path && navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
