"use client";

import { Box, Button, MenuItem, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Create,
  Datagrid,
  FunctionField,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";
import { useTenant } from "../../providers/tenant-context";

const userFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

function useRoleChoices() {
  const dataProvider = useDataProvider();
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    dataProvider
      .getList("app-roles", {
        pagination: { page: 1, perPage: 500 },
        sort: { field: "name", order: "ASC" },
        filter: {}
      })
      .then(({ data }) => setChoices(data as any))
      .catch(() => setChoices([]));
  }, [dataProvider]);

  return choices;
}

function UserRolePanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const roles = useRoleChoices();
  const { tenant } = useTenant();
  const [roleId, setRoleId] = useState("");
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    if (!roleId && roles.length) {
      setRoleId(roles[0].id);
    }
  }, [roles, roleId]);

  useEffect(() => {
    setSubsidiaryId(tenant.subsidiaryId || "");
    setLocationId(tenant.locationId || "");
  }, [tenant.subsidiaryId, tenant.locationId]);

  const assign = async () => {
    if (!record?.id) return;
    if (!roleId) {
      notify("Role is required", { type: "warning" });
      return;
    }

    const response = await apiFetch(`/users/${record.id}/roles`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        role_id: roleId,
        subsidiary_id: subsidiaryId || undefined,
        location_id: locationId || undefined
      }
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Assign role failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Role assigned", { type: "success" });
    refresh();
  };

  if (!record) return null;

  return (
    <Box sx={{ padding: 2, border: "1px solid #E3DED3", borderRadius: 2, background: "#FFFDFA" }}>
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
        Assign app role to {record.email || record.name}
      </Typography>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          select
          label="Role"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          fullWidth
        >
          {roles.map((role) => (
            <MenuItem key={role.id} value={role.id}>
              {role.name}
            </MenuItem>
          ))}
        </MuiTextField>
        <MuiTextField
          label="Subsidiary ID (optional)"
          value={subsidiaryId}
          onChange={(event) => setSubsidiaryId(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Location ID (optional)"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={assign}>
          Assign
        </Button>
      </Stack>
    </Box>
  );
}

export function AppUsersList() {
  return (
    <List filters={userFilters} perPage={50}>
      <Datagrid rowClick="expand" expand={<UserRolePanel />}>
        <TextField source="email" />
        <TextField source="name" />
        <FunctionField
          label="Roles"
          render={(record: any) => (Array.isArray(record?.roles) ? record.roles.join(", ") : "")}
        />
        <FunctionField
          label="Permissions"
          render={(record: any) => (Array.isArray(record?.permissions) ? record.permissions.join(", ") : "")}
        />
      </Datagrid>
    </List>
  );
}

export function AppUserCreate() {
  const { tenant } = useTenant();
  const roles = useRoleChoices();
  const defaultValues = {
    subsidiary_id: tenant.subsidiaryId || undefined,
    location_id: tenant.locationId || undefined
  };

  return (
    <Create>
      <SimpleForm defaultValues={defaultValues}>
        <TextInput source="email" label="Email" fullWidth validate={[required()]} />
        <TextInput source="name" label="Name" fullWidth />
        <SelectInput
          source="role_id"
          label="Role"
          choices={roles}
          optionText="name"
          optionValue="id"
          fullWidth
          validate={[required()]}
        />
        <TextInput source="subsidiary_id" label="Subsidiary ID (optional)" fullWidth />
        <TextInput source="location_id" label="Location ID (optional)" fullWidth />
      </SimpleForm>
    </Create>
  );
}
