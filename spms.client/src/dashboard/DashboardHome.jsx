import Header from '../components/Header';
import MainGrid from '../components/MainGrid';

// The actual "/" landing content inside the Dashboard layout shell.
// This is where the plan variance dashboard will eventually live.
export default function DashboardHome() {
  return (
    <>
      <Header />
      <MainGrid />
    </>
  );
}
