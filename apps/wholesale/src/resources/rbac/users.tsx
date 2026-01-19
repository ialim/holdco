"use client";

import { Box, Button, MenuItem, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import {
  BooleanInput,
  Datagrid,
  FunctionField,
  List,
  TextField,
  TextInput,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const userFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <BooleanInput key="include_unscoped" source="include_unscoped" label="Include unassigned" alwaysOn />
];

function useRoleChoices() {
  const dataProvider = useDataProvider();
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    dataProvider
      .getList("roles", {
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
  const [roleId, setRoleId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    if (!roleId && roles.length) {
      setRoleId(roles[0].name);
    }
  }, [roles, roleId]);

  useEffect(() => {
    if (!record) return;
    setGroupId((record as any).group_id ?? "");
    setSubsidiaryId((record as any).subsidiary_id ?? "");
    setLocationId((record as any).location_id ?? "");
  }, [record?.id]);

  const assign = async () => {
    if (!record?.id) return;
    if (!roleId) {
      notify("Role is required", { type: "warning" });
      return;
    }

    const response = await apiFetch(`/iam/users/${record.id}/roles`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        role: roleId
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

  const updateAttributes = async () => {
    if (!record?.id) return;
    const response = await apiFetch(`/iam/users/${record.id}/attributes`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        group_id: groupId || undefined,
        subsidiary_id: subsidiaryId || undefined,
        location_id: locationId || undefined
      }
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Update tenancy failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Tenancy attributes updated", { type: "success" });
    refresh();
  };

  if (!record) return null;

  return (
    <Box sx={{ padding: 2, border: "1px solid #E3DED3", borderRadius: 2, background: "#FFFDFA" }}>
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
        Assign role to {record.email || record.name}
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
            <MenuItem key={role.id} value={role.name}>
              {role.name}
            </MenuItem>
          ))}
        </MuiTextField>
        <Button variant="contained" onClick={assign}>
          Assign
        </Button>
      </Stack>
      <Typography variant="subtitle2" sx={{ marginTop: 3, marginBottom: 1 }}>
        Tenancy scope
      </Typography>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Group ID"
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Subsidiary ID"
          value={subsidiaryId}
          onChange={(event) => setSubsidiaryId(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Location ID"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          fullWidth
        />
        <Button variant="outlined" onClick={updateAttributes}>
          Update tenancy
        </Button>
      </Stack>
    </Box>
  );
}

export function UsersList() {
  return (
    <List filters={userFilters} perPage={50} filterDefaultValues={{ include_unscoped: true }}>
      <Datagrid rowClick="expand" expand={<UserRolePanel />}>
        <TextField source="username" />
        <TextField source="email" />
        <TextField source="name" />
        <TextField source="group_id" label="Group" />
        <TextField source="subsidiary_id" label="Subsidiary" />
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
