// The shift that is on right now. After midnight the night shift still belongs to yesterday's date.
export const SHIFTS = ['Morning', 'Afternoon', 'Night'];

export const currentShift = () => {
  const now = new Date();
  const hour = now.getHours();
  const shift = hour >= 6 && hour < 14 ? 'Morning' : hour >= 14 && hour < 22 ? 'Afternoon' : 'Night';
  const day = new Date(now);
  if (hour < 6) day.setDate(day.getDate() - 1);
  return { date: day.toLocaleDateString('en-CA'), shift };
};

// Shift start/end are stamped in UTC by the server (no zone suffix), so tag them as UTC before converting
export const utcDate = (value) => (value ? new Date(`${value}Z`) : null);

export const fmtClock = (date) =>
  date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
