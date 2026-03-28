import { useState } from 'react';
import {
  Group, Title, Text, SimpleGrid, Card, RingProgress, Center, Stack,
  Badge, Table, Button,
} from '@mantine/core';
import { IconUsers, IconCreditCard, IconActivity, IconAlertTriangle } from '@tabler/icons-react';

export default function Dashboard() {
  const mockStats = {
    totalTenants: 12,
    activeTenants: 9,
    totalCredits: 150000,
    creditsIssued: 125000,
    skillExecutions: 3847,
  };

  const activeRate = Math.round((mockStats.activeTenants / mockStats.totalTenants) * 100);
  const creditUtilization = Math.round((mockStats.creditsIssued / mockStats.totalCredits) * 100);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Dashboard</Title>
        <Button variant="outline" size="sm" onClick={() => {}} loading={loading}>
          Refresh
        </Button>
      </Group>

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        {/* Total Tenants */}
        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total Tenants</Text>
              <Title order={3} mt="sm">{mockStats.totalTenants}</Title>
              <Text size="xs" c="green.6" mt={4}>
                {mockStats.activeTenants} active
              </Text>
            </Stack>
            <Center>
              <RingProgress
                size={80}
                thickness={8}
                roundCaps
                sections={[{ value: activeRate, color: 'brand.6' }]}
                label={
                  <Center>
                    <IconUsers size={24} />
                  </Center>
                }
              />
            </Center>
          </Group>
        </Card>

        {/* Credits Issued */}
        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Credits Issued</Text>
              <Title order={3} mt="sm">{mockStats.creditsIssued.toLocaleString()}</Title>
              <Text size="xs" c="dimmed" mt={4}>
                of {mockStats.totalCredits.toLocaleString()} total
              </Text>
            </Stack>
            <Center>
              <RingProgress
                size={80}
                thickness={8}
                roundCaps
                sections={[{ value: creditUtilization, color: 'accent.5' }]}
                label={
                  <Center>
                    <IconCreditCard size={24} />
                  </Center>
                }
              />
            </Center>
          </Group>
        </Card>

        {/* Skill Executions */}
        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Skill Executions</Text>
              <Title order={3} mt="sm">{mockStats.skillExecutions.toLocaleString()}</Title>
              <Text size="xs" c="green.6" mt={4}>
                <IconTrendingUp size={12} /> +12% this week
              </Text>
            </Stack>
            <Center>
              <RingProgress
                size={80}
                thickness={8}
                roundCaps
                sections={[{ value: 75, color: 'green.6' }]}
                label={
                  <Center>
                    <IconActivity size={24} />
                  </Center>
                }
              />
            </Center>
          </Group>
        </Card>

        {/* Alerts */}
        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Pending Actions</Text>
              <Title order={3} mt="sm">3</Title>
              <Text size="xs" c="orange.6" mt={4}>
                Requires attention
              </Text>
            </Stack>
            <Center>
              <RingProgress
                size={80}
                thickness={8}
                roundCaps
                sections={[{ value: 30, color: 'orange.6' }]}
                label={
                  <Center>
                    <IconAlertTriangle size={24} />
                  </Center>
                }
              />
            </Center>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Recent Activity */}
      <Card withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={4}>Recent Activity</Title>
          <Button variant="subtle" size="xs">View All</Button>
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Tenant</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Credits</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>2 min ago</Table.Td>
              <Table.Td>Acme Insurance</Table.Td>
              <Table.Td>Skill Executed</Table.Td>
              <Table.Td>-10</Table.Td>
              <Table.Td><Badge color="green">Success</Badge></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>15 min ago</Table.Td>
              <Table.Td>Global Brokers</Table.Td>
              <Table.Td>Credits Purchased</Table.Td>
              <Table.Td>+5000</Table.Td>
              <Table.Td><Badge color="green">Success</Badge></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>1 hour ago</Table.Td>
              <Table.Td>Prime Agency</Table.Td>
              <Table.Td>Tenant Created</Table.Td>
              <Table.Td>+1000</Table.Td>
              <Table.Td><Badge color="blue">Pending</Badge></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>2 hours ago</Table.Td>
              <Table.Td>Acme Insurance</Table.Td>
              <Table.Td>Skill Executed</Table.Td>
              <Table.Td>-5</Table.Td>
              <Table.Td><Badge color="green">Success</Badge></Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>

      {/* Quick Actions */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card withBorder>
          <Title order={5} mb="sm">Onboard New Tenant</Title>
          <Text size="sm" c="dimmed" mb="md">
            Create a new broker company account with initial credits.
          </Text>
          <Button variant="outline" fullWidth>Get Started</Button>
        </Card>

        <Card withBorder>
          <Title order={5} mb="sm">View Credit Reports</Title>
          <Text size="sm" c="dimmed" mb="md">
            Analyze credit usage patterns and revenue.
          </Text>
          <Button variant="outline" fullWidth>View Reports</Button>
        </Card>

        <Card withBorder>
          <Title order={5} mb="sm">Manage Skills</Title>
          <Text size="sm" c="dimmed" mb="md">
            Configure available skills and pricing tiers.
          </Text>
          <Button variant="outline" fullWidth>Manage</Button>
        </Card>
      </SimpleGrid>
    </div>
  );
}
