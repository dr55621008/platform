import { useState } from 'react';
import {
  Group, Title, Text, Card, Stack, TextInput, Button, Switch,
  Select, Divider, Alert, Code,
} from '@mantine/core';
import { IconBrandGithub, IconDatabase, IconBell } from '@tabler/icons-react';

export default function Settings() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div>
      <Title order={2} mb="lg">Settings</Title>

      <Stack gap="lg">
        {/* Platform Settings */}
        <Card withBorder>
          <Group mb="md">
            <IconDatabase size={24} />
            <Title order={4}>Platform Configuration</Title>
          </Group>

          <Stack gap="md">
            <TextInput
              label="Platform Name"
              defaultValue="brokerHub"
              description="Public-facing platform name"
            />
            <TextInput
              label="API Base URL"
              defaultValue="https://api.brokerhub.com"
              description="Base URL for API endpoints"
            />
            <Select
              label="Default Region"
              defaultValue="ap-east-1"
              data={[
                { value: 'ap-east-1', label: 'Asia Pacific (Hong Kong)' },
                { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
                { value: 'us-east-1', label: 'US East (N. Virginia)' },
              ]}
            />
          </Stack>
        </Card>

        {/* Authentication */}
        <Card withBorder>
          <Group mb="md">
            <IconBrandGithub size={24} />
            <Title order={4}>Authentication</Title>
          </Group>

          <Stack gap="md">
            <TextInput
              label="JWT Secret"
              type="password"
              defaultValue="••••••••••••••••"
              description="Secret key for JWT token signing"
            />
            <Alert title="Security Note" color="orange" radius="md">
              Rotate JWT secrets regularly. All active sessions will be invalidated.
            </Alert>
          </Stack>
        </Card>

        {/* Notifications */}
        <Card withBorder>
          <Group mb="md">
            <IconBell size={24} />
            <Title order={4}>Notifications</Title>
          </Group>

          <Stack gap="md">
            <Switch
              label="Email Notifications"
              description="Send email alerts for critical events"
              defaultChecked
            />
            <Switch
              label="Low Credit Alerts"
              description="Notify when tenant credits fall below threshold"
              defaultChecked
            />
            <TextInput
              label="Alert Email"
              type="email"
              defaultValue="admin@brokerhub.com"
              description="Email address for system alerts"
            />
          </Stack>
        </Card>

        {/* Feature Flags */}
        <Card withBorder>
          <Group mb="md">
            <IconBell size={24} />
            <Title order={4}>Feature Flags</Title>
          </Group>

          <Stack gap="md">
            <Switch
              label="White-Label Branding"
              description="Allow tenants to customize branding"
              defaultChecked
            />
            <Switch
              label="Auto Top-Up"
              description="Automatic credit purchase when balance is low"
            />
            <Switch
              label="API Webhooks"
              description="Enable webhook callbacks for skill executions"
              defaultChecked
            />
          </Stack>
        </Card>

        {/* System Info */}
        <Card withBorder>
          <Title order={4} mb="md">System Information</Title>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text c="dimmed">Version</Text>
              <Code>0.1.0</Code>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text c="dimmed">Environment</Text>
              <Code>development</Code>
            </Group>
          </Stack>
        </Card>

        {/* Save Button */}
        <Group justify="flex-end">
          <Button onClick={handleSave} loading={saving} size="lg">
            Save Changes
          </Button>
        </Group>
      </Stack>
    </div>
  );
}
