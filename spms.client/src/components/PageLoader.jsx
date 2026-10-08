import { Box, CircularProgress } from '@mui/material';

// Fallback shown while a lazily loaded page is being fetched.
export default function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, width: '100%' }}>
      <CircularProgress size={32} aria-label="Loading page" />
    </Box>
  );
}
