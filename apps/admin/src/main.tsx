import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import App from './App';

// brokerHub Brand Theme
// Colors: Navy #1a3a5c, Cyan #00b4d8
const theme = createTheme({
  colors: {
    brand: [
      '#E8F4F8', '#B8E3F0', '#87D2E7', '#57C1DF', '#26B0D6',
      '#1A9EC9', '#1A3A5C', '#142D47', '#0F2136', '#0A1624',
    ],
    accent: [
      '#E0F7FA', '#B3EBF2', '#80DEEA', '#4DD0E1', '#26C6DA',
      '#00BCD4', '#00B4D8', '#0097A7', '#00838F', '#006064',
    ],
  },
  primaryColor: 'brand',
  primaryShade: 6,
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
