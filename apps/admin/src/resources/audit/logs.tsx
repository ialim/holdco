"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  AutocompleteInput,
  Datagrid,
  DateField,
  DateInput,
  Filter,
  FunctionField,
  List,
  TextField,
  TextInput,
  useRecordContext
} from "react-admin";
import { apiFetch } from "../../lib/api";

type Choice = { id: string; name: string };

function useAuditChoices(endpoint: string, search: string) {
  const [choices, setChoices] = useState<Choice[]>([]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    query.set("limit", "200");
    if (search) {
      query.set("q", search);
    }

    apiFetch(`${endpoint}?${query.toString()}`)
      .then((response) => {
        if (!active) return;
        if (!response.ok) {
          setChoices([]);
          return;
        }
        const data = (response.data as any)?.data ?? [];
        const normalized = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.value ?? item.id,
              name: item.label ?? item.email ?? item.name ?? item.value ?? item.id
            }))
          : [];
        setChoices(normalized);
      })
      .catch(() => {
        if (!active) return;
        setChoices([]);
      });

    return () => {
      active = false;
    };
  }, [endpoint, search]);

  return choices;
}

function AuditLogFilters(props: any) {
  const [actionSearch, setActionSearch] = useState("");
  const [entitySearch, setEntitySearch] = useState("");
  const [actorSearch, setActorSearch] = useState("");

  const actionChoices = useAuditChoices("/audit-logs/actions", actionSearch);
  const entityChoices = useAuditChoices("/audit-logs/entity-types", entitySearch);
  const actorChoices = useAuditChoices("/audit-logs/actors", actorSearch);

  return (
    <Filter {...props}>
      <DateInput source="start_date" label="Start date" alwaysOn />
      <DateInput source="end_date" label="End date" alwaysOn />
      <AutocompleteInput
        source="action"
        label="Action"
        choices={actionChoices}
        onInputChange={(_, value) => setActionSearch(value ?? "")}
        fullWidth
      />
      <AutocompleteInput
        source="entity_type"
        label="Entity type"
        choices={entityChoices}
        onInputChange={(_, value) => setEntitySearch(value ?? "")}
        fullWidth
      />
      <AutocompleteInput
        source="actor_id"
        label="Actor"
        choices={actorChoices}
        onInputChange={(_, value) => setActorSearch(value ?? "")}
        fullWidth
      />
      <TextInput source="actor_email" label="Actor email" />
      <TextInput source="entity_id" label="Entity ID" />
      <TextInput source="subsidiary_id" label="Subsidiary ID" />
    </Filter>
  );
}

function AuditLogDetail() {
  const record = useRecordContext();
  const payload = useMemo(
    () => (record?.payload ? JSON.stringify(record.payload, null, 2) : ""),
    [record?.payload]
  );

  if (!record) return null;

  return (
    <Box sx={{ padding: 2, border: "1px solid #E3DED3", borderRadius: 2, background: "#FFFDFA" }}>
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
        Audit detail
      </Typography>
      <Stack spacing={1} sx={{ marginBottom: 2 }}>
        <Typography variant="body2">Action: {record.action}</Typography>
        <Typography variant="body2">Entity: {record.entity_type}</Typography>
        <Typography variant="body2">Entity ID: {record.entity_id}</Typography>
        <Typography variant="body2">Subsidiary: {record.subsidiary_id}</Typography>
        <Typography variant="body2">
          Actor: {record.actor?.email || record.actor_id || "n/a"}
        </Typography>
      </Stack>
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
        Payload
      </Typography>
      <Box
        component="pre"
        sx={{
          margin: 0,
          padding: 2,
          borderRadius: 1,
          backgroundColor: "#F4F1EC",
          fontSize: 12,
          overflow: "auto",
          maxHeight: 280
        }}
      >
        {payload || "{}"}
      </Box>
    </Box>
  );
}

export function AuditLogList() {
  return (
    <List filters={<AuditLogFilters />} perPage={50}>
      <Datagrid rowClick="expand" expand={<AuditLogDetail />}>
        <DateField source="created_at" label="Created" showTime />
        <TextField source="action" />
        <TextField source="entity_type" />
        <TextField source="entity_id" />
        <TextField source="actor.email" label="Actor" />
        <TextField source="subsidiary_id" label="Subsidiary" />
      </Datagrid>
    </List>
  );
}
