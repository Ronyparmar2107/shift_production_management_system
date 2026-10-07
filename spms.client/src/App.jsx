import { useSelector } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'

import SignIn from './sign-in/SignIn.jsx'
import Dashboard from './dashboard/Dashboard.jsx'
import DashboardHome from './dashboard/DashboardHome.jsx'
import AdminPanel from './admin-panel/AdminPanel.jsx'
import CreatePlan from './plan/CreatePlan.jsx'
import MyPlans from './plan/MyPlans.jsx'
import CrewPlans from './plan/CrewPlans.jsx'
import './App.css'

function App() {
  const authState = useSelector((state) => state.auth);

  let sessionData = localStorage.getItem('sessionData');
  if (sessionData) {
    sessionData = JSON.parse(sessionData);
  }

  const isAuthenticated = authState.isAuthenticated || (sessionData?.isAuthenticated ?? false);
  const userId = authState.userId || (sessionData?.userId);
  const role = authState.role || (sessionData?.role);
  const name = authState.name || (sessionData?.name);
  const token = authState.token || (sessionData?.token);

  if (!isAuthenticated) {
    return <SignIn />;
  }

  // Dashboard is the layout shell (sidebar + navbar). Each nav item is a
  // child route that renders inside it through <Outlet />.
  return (
    <Routes>
      <Route path="/" element={<Dashboard userId={userId} role={role} name={name} token={token} />}>
        <Route index element={<DashboardHome />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="plans/create" element={<CreatePlan />} />
        <Route path="plans/mine" element={<MyPlans />} />
        <Route path="plans/crew" element={<CrewPlans />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
