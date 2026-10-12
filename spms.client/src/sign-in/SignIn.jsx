import * as React from 'react';

import { useLoginMutation } from '../features/auth/authApi';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../theme/AppTheme';
import { SitemarkIcon } from '../components/CustomIcons';



const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

// Turns a failed login request into a message a person can act on.
function loginErrorMessage(error) {
  if (!error) return '';
  if (error.status === 401) return 'Employee ID or password is incorrect.';
  if (error.status === 'FETCH_ERROR') {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.';
  }
  return error.data?.message ?? 'Sign in failed. Please try again.';
}

export default function SignIn(props) {
  const [empIdError, setEmpIdError] = React.useState(false);
  const [empIdErrorMessage, setEmpIdErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');

  const [login, { isLoading: signingIn, error: loginError, reset }] = useLoginMutation();


  // Checks the two fields and shows a message under each one that is wrong.
  const validateInputs = (empId, password) => {
    let isValid = true;

    if (!empId || empId.length < 3) {
      setEmpIdError(true);
      setEmpIdErrorMessage('Please enter your Employee ID.');
      isValid = false;
    } else {
      setEmpIdError(false);
      setEmpIdErrorMessage('');
    }

    if (!password) {
      setPasswordError(true);
      setPasswordErrorMessage('Please enter your password.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const empId = (data.get('emp_id') ?? '').toString().trim();
    const password = (data.get('password') ?? '').toString();

    if (!validateInputs(empId, password)) return;

    // A failed attempt is shown in the alert above the form (see loginError)
    await login({ emp_id: empId, password });
  };

  // Typing again clears the previous failed-login message
  const clearLoginError = () => {
    if (loginError) reset();
  };

  return (
    <AppTheme >
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" sx={{ justifyContent: 'space-between' }}>

        <Card variant="outlined">
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          {loginError && (
            <Alert severity="error" onClose={reset}>
              {loginErrorMessage(loginError)}
            </Alert>
          )}
          <Box
            component="form"
            method="POST"
            onSubmit={handleSubmit}
            onChange={clearLoginError}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="empId">Employee ID</FormLabel>
              <TextField
                error={empIdError}
                helperText={empIdErrorMessage}
                id="empId"
                type="text"
                name="emp_id"
                placeholder="Employee ID"
                autoComplete="username"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={empIdError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              loading={signingIn}
            >
              Sign in
            </Button>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}
