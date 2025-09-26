import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#b69ac1',       // Light purple
      light: '#c4bbce',      // Lighter purple
      dark: '#553d8e',       // Darker purple
      contrastText: '#FFF',  // White text for contrast
    },
    secondary: {
      main: '#c7dde7',       // Light blue
      light: '#c8dde9',      // Lighter blue
      dark: '#9ba2c2',       // Darker blue
      contrastText: '#FFF',  // White text for contrast
    },
    background: {
      default: '#F5F5F5',    // Light gray background
      paper: '#FFFFFF',      // White for cards/paper
    },
    text: {
      primary: '#212121',    // Dark gray for primary text
      secondary: '#757575',  // Medium gray for secondary text
    },
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '4rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,        // Rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '12px 32px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

export default theme;