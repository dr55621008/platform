import { useState } from 'react';
import {
  Group, Title, Text, Card, SimpleGrid, Table, Badge, Button, Modal,
  TextInput, NumberInput, Stack, Alert, RingProgress, Center, Box,
} from '@mantine/core';
import { IconPlus, IconTrendingUp, IconDownload } from '@tabler/icons-react';

interface Transaction {
  id: number;
  tenant: string;
  type: 'purchase' | 'usage' | 'refund' | 'adjustment';
  amount: number;
  balance_after: number;
  skill_id?: string;
  created_at: string;
}

const mockTransactions: Transaction[] = [
  { id: 1, tenant: 'acme_insurance', type: 'purchase', amount: 5000, balance_after: 9500, created_at: '2026-03-28 10:30' },
  { id: 2, tenant: 'global_brokers', type: 'usage', amount: -10, balance_after: 11990, skill_id: 'market_analytics', created_at: '2026-03-28 10:15' },
  { id: 3, tenant: 'acme_insurance', type: 'usage', amount: -5, balance_after: 4495, skill_id: 'document_analysis', created_at: '2026-03-28 09:45' },
  { id: 4, tenant: 'prime_agency', type: 'purchase', amount: 1000, balance_after: 1000, created_at: '2026-03-27 16:20' },
  { id: 5, tenant: 'global_brokers', type: 'usage', amount: -2, balance_after: 12000, skill_id: 'api_integration', created_at: '2026-03-27 14:30' },
];

export default function Credits() {
  const [opened, setOpened] = useState(false);
  const [transactions] = useState<Transaction[]>(mockTransactions);

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase': return 'green';
      case 'refund': return 'blue';
      case 'usage': return 'orange';
      case 'adjustment': return 'gray';
      default: return 'gray';
    }
  };

  const totalCredits = 150000;
  const issuedCredits = 125000;
  const utilization = Math.round((issuedCredits / totalCredits) * 100);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Credit Management</Title>
        <Group>
          <Button variant="outline" leftSection={<IconDownload size={18} />}>
            Export
          </Button>
          <Button leftSection={<IconPlus size={18} />} onClick={() => setOpened(true)}>
            Add Credits
          </Button>
        </Group>
      </Group>

      {/* Credit Overview */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total Credits Pool</Text>
              <Title order={3} mt="sm">{totalCredits.toLocaleString()}</Title>
            </Stack>
            <RingProgress
              size={80}
              thickness={8}
              roundCaps
              sections={[{ value: 100, color: 'brand.6' }]}
              label={<Center><Text fw={700}>100%</Text></Center>}
            />
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Credits Issued</Text>
              <Title order={3} mt="sm">{issuedCredits.toLocaleString()}</Title>
            </Stack>
            <RingProgress
              size={80}
              thickness={8}
              roundCaps
              sections={[{ value: utilization, color: 'accent.5' }]}
              label={<Center><Text fw={700}>{utilization}%</Text></Center>}
            />
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between">
            <Stack gap={0}>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Available</Text>
              <Title order={3} mt="sm">{(totalCredits - issuedCredits).toLocaleString()}</Title>
            </Stack>
            <RingProgress
              size={80}
              thickness={8}
              roundCaps
              sections={[{ value: 100 - utilization, color: 'green.6' }]}
              label={<Center><Text fw={700}>{100 - utilization}%</Text></Center>}
            />
          </Group>
        </Card>
      </SimpleGrid>

      <Alert title="Credit Pricing" color="blue" mb="lg" radius="md">
        <Group gap="md">
          <Badge variant="light">Starter: $99 / 1,000 credits</Badge>
          <Badge variant="light">Professional: $399 / 5,000 credits</Badge>
          <Badge variant="light">Enterprise: $1,499 / 25,000 credits</Badge>
        </Group>
      </Alert>

      {/* Transaction History */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Recent Transactions</Title>
          <Button variant="subtle" size="xs">View All</Button>
        </Group>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Tenant</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Balance After</Table.Th>
              <Table.Th>Skill</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {transactions.map((tx) => (
              <Table.Tr key={tx.id}>
                <Table.Td>{tx.created_at}</Table.Td>
                <Table.Td fw={500}>{tx.tenant}</Table.Td>
                <Table.Td>
                  <Badge color={getTypeColor(tx.type)} variant="light">
                    {tx.type.toUpperCase()}
                  </Badge>
                </Table.Td>
                <Table.Td fw={700} c={tx.amount > 0 ? 'green' : 'red'}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </Table.Td>
                <Table.Td>{tx.balance_after.toLocaleString()}</Table.Td>
                <Table.Td>
                  {tx.skill_id ? (
                    <Text size="sm" c="dimmed">{tx.skill_id.replace(/_/g, ' ')}</Text>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Add Credits Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Add Credits to Tenant" size="lg">
        <Stack>
          <TextInput
            label="Tenant ID"
            placeholder="e.g., tenant_acme_insurance"
            required
          />
          <NumberInput
            label="Credit Amount"
            placeholder="5000"
            min={1}
            required
          />
          <TextInput
            label="Transaction Type"
            placeholder="purchase, refund, adjustment"
            defaultValue="purchase"
          />
          <TextInput
            label="Notes (Optional)"
            placeholder="Reason for credit addition"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setOpened(false)}>Cancel</Button>
            <Button onClick={() => setOpened(false)}>Add Credits</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
