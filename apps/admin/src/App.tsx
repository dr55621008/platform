import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell, Burger, Group, Image, Text, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHome, IconUsers, IconCreditCard, IconSettings, IconActivity } from '@tabler/icons-react';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Credits from './pages/Credits';
import Skills from './pages/Skills';
import Settings from './pages/Settings';
import logo from './assets/logo.svg';

function NavbarLink({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Box
      component="a"
      onClick={onClick}
      style={{
        display: 'block',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: active ? 'var(--mantine-color-brand-6)' : 'transparent',
        color: active ? 'white' : 'var(--mantine-color-gray-7)',
        cursor: 'pointer',
        textDecoration: 'none',
        marginBottom: '4px',
      }}
      onMouseEnter={(e: any) => {
        if (!active) e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
      }}
      onMouseLeave={(e: any) => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Group gap="sm">
        <Icon size={20} />
        <Text size="sm" fw={500}>{label}</Text>
      </Group>
    </Box>
  );
}

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const [activePage, setActivePage] = React.useState('dashboard');

  const navLinks = [
    { icon: IconHome, label: 'Dashboard', page: 'dashboard' },
    { icon: IconUsers, label: 'Tenants', page: 'tenants' },
    { icon: IconCreditCard, label: 'Credits', page: 'credits' },
    { icon: IconActivity, label: 'Skills', page: 'skills' },
    { icon: IconSettings, label: 'Settings', page: 'settings' },
  ];

  return (
    <BrowserRouter>
      <AppShell
        header={{ height: 64 }}
        navbar={{
          width: 260,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header bg="var(--mantine-color-brand-6)">
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
              <Group gap="sm">
                <Image src={logo} h={40} fit="contain" visibleFrom="sm" />
                <Image src={logoIcon} h={40} fit="contain" hiddenFrom="sm" />
                <Text c="white" fz="lg" fw={700} visibleFrom="sm">broker</Text>
                <Text c="accent.5" fz="lg" fw={400} visibleFrom="sm">Hub</Text>
              </Group>
            </Group>
            <Group gap="xs">
              <Text c="white" size="sm">Your 24/7 AI Admin</Text>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <nav>
            {navLinks.map((link) => (
              <NavbarLink
                key={link.page}
                icon={link.icon}
                label={link.label}
                active={activePage === link.page}
                onClick={() => {
                  setActivePage(link.page);
                  if (window.location.pathname !== `/${link.page}`) {
                    window.location.href = `/${link.page}`;
                  }
                  if (opened) toggle();
                }}
              />
            ))}
          </nav>
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  );
}
