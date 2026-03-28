import { useState } from 'react';
import {
  Group, Title, Text, Table, Badge, Button, Modal, TextInput,
  Select, Stack, Alert, ActionIcon, Menu,
} from '@mantine/core';
import { IconPlus, IconDots, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';

interface Tenant {
  tenant_id: string;
  company_id: string;
  agent_id: string;
  status: 'pending' | 'approved' | 'suspended' | 'terminated';
  credit_balance: number;
  created_at: string;
}

const mockTenants: Tenant[] = [
  { tenant_id: 'tenant_acme_insurance', company_id: 'acme_insurance_ltd', agent_id: 'agent_acme_001', status: 'approved', credit_balance: 4500, created_at: '2026-03-15' },
  { tenant_id: 'tenant_global_brokers', company_id: 'global_brokers_hk', agent_id: 'agent_global_001', status: 'approved', credit_balance: 12000, created_at: '2026-03-18' },
  { tenant_id: 'tenant_prime_agency', company_id: 'prime_agency_ltd', agent_id: 'agent_prime_001', status: 'pending', credit_balance: 1000, created_at: '2026-03-27' },
  { tenant_id: 'tenant_secure_life', company_id: 'secure_life_insurance', agent_id: 'agent_secure_001', status: 'suspended', credit_balance: 0, created_at: '2026-02-10' },
];

export default function Tenants() {
  const [opened, setOpened] = useState(false);
  const [tenants] = useState<Tenant[]>(mockTenants);

  const getStatusColor = (status: Tenant['status']) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'blue';
      case 'suspended': return 'orange';
      case 'terminated': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Tenants</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setOpened(true)}>
          Add Tenant
        </Button>
      </Group>

      <Alert title="Info" color="blue" mb="lg" radius="md">
        Manage broker company accounts. Approve pending tenants and monitor credit balances.
      </Alert>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Company</Table.Th>
            <Table.Th>Agent ID</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Credit Balance</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tenants.map((tenant) => (
            <Table.Tr key={tenant.tenant_id}>
              <Table.Td>
                <Text fw={500}>{tenant.company_id.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text size="xs" c="dimmed">{tenant.tenant_id}</Text>
              </Table.Td>
              <Table.Td>{tenant.agent_id}</Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(tenant.status)} variant="light">
                  {tenant.status.toUpperCase()}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text fw={tenant.credit_balance === 0 ? 700 : 400} c={tenant.credit_balance === 0 ? 'red' : undefined}>
                  {tenant.credit_balance.toLocaleString()}
                </Text>
              </Table.Td>
              <Table.Td>{tenant.created_at}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Menu withArrow>
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={16} />}>Edit</Menu.Item>
                      {tenant.status === 'pending' && (
                        <Menu.Item leftSection={<IconCheck size={16} />} color="green">Approve</Menu.Item>
                      )}
                      {tenant.status !== 'suspended' && (
                        <Menu.Item leftSection={<IconX size={16} />} color="orange">Suspend</Menu.Item>
                      )}
                      <Menu.Divider />
                      <Menu.Item leftSection={<IconTrash size={16} />} color="red">Delete</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Add Tenant Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Add New Tenant" size="lg">
        <Stack>
          <TextInput
            label="Company ID"
            placeholder="e.g., acme_insurance_ltd"
            description="Unique identifier for the company"
            required
          />
          <TextInput
            label="Agent ID"
            placeholder="e.g., agent_acme_001"
            description="AI agent instance identifier"
            required
          />
          <TextInput
            label="Initial Credits"
            type="number"
            placeholder="1000"
            description="Starting credit balance"
            defaultValue="1000"
          />
          <Select
            label="Tier"
            placeholder="Select tier"
            data={[
              { value: 'starter', label: 'Starter (1,000 credits/month)' },
              { value: 'professional', label: 'Professional (5,000 credits/month)' },
              { value: 'enterprise', label: 'Enterprise (25,000 credits/month)' },
            ]}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setOpened(false)}>Cancel</Button>
            <Button onClick={() => setOpened(false)}>Create Tenant</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
