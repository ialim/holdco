"use client";

import { Box, Button, MenuItem, TextField as MuiTextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Create,
  Datagrid,
  FunctionField,
  List,
  SelectArrayInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRefresh,
  required
} from "react-admin";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const roleScopeChoices = [
  { id: "group", name: "group" },
  { id: "subsidiary", name: "subsidiary" }
];

const roleFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

function usePermissionChoices() {
  const dataProvider = useDataProvider();
  const [choices, setChoices] = useState<{ id: string; code: string; description?: string }[]>([]);

  useEffect(() => {
    dataProvider
      .getList("app-permissions", {
        pagination: { page: 1, perPage: 500 },
        sort: { field: "code", order: "ASC" },
        filter: {}
      })
      .then(({ data }) => setChoices(data as any))
      .catch(() => setChoices([]));
  }, [dataProvider]);

  return choices;
}

function PermissionsPanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const choices = usePermissionChoices();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!record) return;
    const permissions = Array.isArray((record as any).permissions) ? (record as any).permissions : [];
    setSelected(permissions);
  }, [record?.id]);

  const save = async () => {
    if (!record?.id) return;
    const response = await apiFetch(`/roles/${record.id}/permissions`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: { permissions: selected }
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Update permissions failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Role permissions updated", { type: "success" });
    refresh();
  };

  if (!record) return null;

  return (
    <Box sx={{ padding: 2, border: "1px solid #E3DED3", borderRadius: 2, background: "#FFFDFA" }}>
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
        Update permissions for {record.name}
      </Typography>
      <MuiTextField
        label="Permissions"
        select
        fullWidth
        SelectProps={{ multiple: true }}
        value={selected}
        onChange={(event) => setSelected(event.target.value as string[])}
      >
        {choices.map((choice) => (
          <MenuItem key={choice.id} value={choice.code}>
            {choice.code}
          </MenuItem>
        ))}
      </MuiTextField>
      <Button variant="contained" sx={{ marginTop: 2 }} onClick={save}>
        Save permissions
      </Button>
    </Box>
  );
}

export function AppRolesList() {
  return (
    <List filters={roleFilters} perPage={50}>
      <Datagrid rowClick="expand" expand={<PermissionsPanel />}>
        <TextField source="name" />
        <TextField source="scope" />
        <FunctionField
          label="Permissions"
          render={(record: any) =>
            Array.isArray(record?.permissions) ? record.permissions.join(", ") : ""
          }
        />
      </Datagrid>
    </List>
  );
}

export function AppRoleCreate() {
  const permissionChoices = usePermissionChoices();
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required()]} fullWidth />
        <SelectInput source="scope" choices={roleScopeChoices} validate={[required()]} />
        <SelectArrayInput
          source="permissions"
          choices={permissionChoices}
          optionText="code"
          optionValue="code"
          fullWidth
        />
      </SimpleForm>
    </Create>
  );
}
