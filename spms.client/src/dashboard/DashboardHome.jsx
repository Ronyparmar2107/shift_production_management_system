import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import SupervisorDashboard from './SupervisorDashboard';
import CrewLeadHome from './CrewLeadHome';
import PlannerHome from './PlannerHome';

// Same matching rule as the API: ignore case, spaces and punctuation
const normalize = (value) => (value ?? '').toString().replace(/[^a-z0-9]/gi, '').toLowerCase();

// The "/" landing page: each role gets the view that answers its own question.
export default function DashboardHome() {
  const role = normalize(useSelector((state) => state.auth.role));

  if (role === 'admin' || role === 'shiftsupervisor') return <SupervisorDashboard />;
  if (role === 'crewlead') return <CrewLeadHome />;
  if (role === 'mineplanner') return <PlannerHome />;

  return (
    <Typography variant="body1" sx={{ mt: 4 }}>
      Welcome. Nothing to show for your role yet.
    </Typography>
  );
}
