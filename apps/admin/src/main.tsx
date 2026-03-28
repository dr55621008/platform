import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import App from './App';

// brokerHub Brand Theme
const theme = createTheme({
  colors: {
    brand: [
      '#E6F1F8', '#B3D9F0', '#80C1E9', '#4DA9E1', '#1A91DA',
      '#0A7BCF', '#0A192F', '#081426', '#060F1D', '#040A14',
    ],
  },
  primaryColor: 'brand',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Montserrat, sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
