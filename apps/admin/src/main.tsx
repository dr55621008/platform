import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import App from './App';

// brokerHub Brand Theme
const theme = createTheme({
  colors: {
    // Trust Blue (Primary)
    brand: [
      '#E6F1F8',
      '#B3D9F0',
      '#80C1E9',
      '#4DA9E1',
      '#1A91DA',
      '#0A7BCF',
      '#0A192F', // Primary
      '#081426',
      '#060F1D',
      '#040A14',
    ],
    // Electric Cyan (Accent)
    accent: [
      '#E6F9FF',
      '#B3F0FF',
      '#80E7FF',
      '#4DDEFF',
      '#1AD5FF',
      '#00D4FF', // Accent
      '#00B8E6',
      '#009CB3',
      '#008099',
      '#00647D',
    ],
  },
  primaryColor: 'brand',
  accentColor: 'accent',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Montserrat, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
