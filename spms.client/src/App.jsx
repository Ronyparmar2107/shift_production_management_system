import { lazy, Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'

import SignIn from './sign-in/SignIn.jsx'
import Dashboard from './dashboard/Dashboard.jsx'
const DashboardHome = lazy(() => import('./dashboard/DashboardHome.jsx'))
const AdminPanel = lazy(() => import('./admin-panel/AdminPanel.jsx'))
const CreatePlan = lazy(() => import('./plan/CreatePlan.jsx'))
const MyPlans = lazy(() => import('./plan/MyPlans.jsx'))
const CrewPlans = lazy(() => import('./plan/CrewPlans.jsx'))
import PageLoader from './components/PageLoader.jsx'
import './App.css'

// Pages load on demand; show a spinner while a page's code is fetched.
const page = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>

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
        <Route index element={page(<DashboardHome />)} />
        <Route path="admin" element={page(<AdminPanel />)} />
        <Route path="plans/create" element={page(<CreatePlan />)} />
        <Route path="plans/mine" element={page(<MyPlans />)} />
        <Route path="plans/crew" element={page(<CrewPlans />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
