import { useState } from 'react';
import {
  Group, Title, Text, Table, Badge, Card, SimpleGrid, Stack, Box,
  Button, Modal, TextInput, NumberInput, Switch, Select,
} from '@mantine/core';
import { IconCode, IconFileText, IconMessage, IconSettings } from '@tabler/icons-react';

interface Skill {
  skill_id: string;
  name: string;
  tier: 'starter' | 'professional' | 'enterprise';
  credit_cost: number;
  rate_limit: number;
  enabled: boolean;
  executions: number;
}

const mockSkills: Skill[] = [
  { skill_id: 'basic_qa', name: 'Basic Q&A', tier: 'starter', credit_cost: 1, rate_limit: 100, enabled: true, executions: 1250 },
  { skill_id: 'document_analysis', name: 'Document Analysis', tier: 'professional', credit_cost: 5, rate_limit: 20, enabled: true, executions: 847 },
  { skill_id: 'compliance_check', name: 'Compliance Check', tier: 'professional', credit_cost: 8, rate_limit: 15, enabled: true, executions: 423 },
  { skill_id: 'market_analytics', name: 'Market Analytics', tier: 'enterprise', credit_cost: 10, rate_limit: 10, enabled: true, executions: 156 },
  { skill_id: 'api_integration', name: 'API Integration', tier: 'enterprise', credit_cost: 2, rate_limit: 50, enabled: true, executions: 1171 },
];

export default function Skills() {
  const [opened, setOpened] = useState(false);
  const [skills] = useState<Skill[]>(mockSkills);

  const getTierColor = (tier: Skill['tier']) => {
    switch (tier) {
      case 'starter': return 'blue';
      case 'professional': return 'cyan';
      case 'enterprise': return 'purple';
      default: return 'gray';
    }
  };

  const getSkillIcon = (skill_id: string) => {
    switch (skill_id) {
      case 'basic_qa': return <IconMessage size={20} />;
      case 'document_analysis': return <IconFileText size={20} />;
      case 'compliance_check': return <IconSettings size={20} />;
      case 'market_analytics': return <IconSettings size={20} />;
      case 'api_integration': return <IconCode size={20} />;
      default: return <IconSettings size={20} />;
    }
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Skills Registry</Title>
        <Button onClick={() => setOpened(true)}>Add Skill</Button>
      </Group>

      {/* Skills Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md" mb="xl">
        {skills.map((skill) => (
          <Card key={skill.skill_id} withBorder padding="sm">
            <Stack gap="xs">
              <Group justify="space-between">
                <Box c="brand.6">{getSkillIcon(skill.skill_id)}</Box>
                <Badge color={getTierColor(skill.tier)} variant="light" size="sm">
                  {skill.tier}
                </Badge>
              </Group>
              <Text fw={600} size="sm">{skill.name}</Text>
              <Text size="xs" c="dimmed">{skill.credit_cost} credits/use</Text>
              <Text size="xs" c="dimmed">{skill.rate_limit}/hour</Text>
              <Text size="xs" c="green.6">{skill.executions.toLocaleString()} executions</Text>
              <Switch
                checked={skill.enabled}
                size="xs"
                label={skill.enabled ? 'Active' : 'Disabled'}
              />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Detailed Table */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Skill Details</Title>
          <Button variant="subtle" size="xs">Export</Button>
        </Group>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Skill</Table.Th>
              <Table.Th>ID</Table.Th>
              <Table.Th>Tier</Table.Th>
              <Table.Th>Credit Cost</Table.Th>
              <Table.Th>Rate Limit</Table.Th>
              <Table.Th>Executions</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {skills.map((skill) => (
              <Table.Tr key={skill.skill_id}>
                <Table.Td>
                  <Group gap="sm">
                    <Box c="brand.6">{getSkillIcon(skill.skill_id)}</Box>
                    <Text fw={500}>{skill.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" ff="monospace">{skill.skill_id}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={getTierColor(skill.tier)} variant="light">
                    {skill.tier}
                  </Badge>
                </Table.Td>
                <Table.Td fw={600}>{skill.credit_cost}</Table.Td>
                <Table.Td>{skill.rate_limit}/hour</Table.Td>
                <Table.Td>{skill.executions.toLocaleString()}</Table.Td>
                <Table.Td>
                  <Badge color={skill.enabled ? 'green' : 'gray'} variant="dot">
                    {skill.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button variant="subtle" size="xs">Configure</Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Add Skill Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Add New Skill" size="lg">
        <Stack>
          <TextInput label="Skill Name" placeholder="e.g., Advanced Analytics" required />
          <TextInput
            label="Skill ID"
            placeholder="e.g., advanced_analytics"
            description="Unique identifier (lowercase, underscores)"
            required
          />
          <Select
            label="Tier"
            placeholder="Select tier"
            data={[
              { value: 'starter', label: 'Starter' },
              { value: 'professional', label: 'Professional' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            required
          />
          <NumberInput label="Credit Cost" placeholder="10" min={1} required />
          <NumberInput label="Rate Limit (per hour)" placeholder="100" min={1} required />
          <TextInput
            label="Description"
            placeholder="Brief description of the skill"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setOpened(false)}>Cancel</Button>
            <Button onClick={() => setOpened(false)}>Create Skill</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
