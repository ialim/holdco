"use client";

import { Box, Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useTenant } from "../providers/tenant-context";
import { apiFetch } from "../lib/api";

const CHANNELS = ["admin_ops", "retail", "wholesale", "credit", "digital"];

export function TenantSelector() {
  const { tenant, setTenant } = useTenant();
  const [draft, setDraft] = useState(tenant);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<
    { id: string; name: string; role?: string; status?: string }[]
  >([]);
  const [subsidiariesLoaded, setSubsidiariesLoaded] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);

  useEffect(() => {
    setDraft(tenant);
  }, [tenant]);

  useEffect(() => {
    let active = true;
    apiFetch("/tenant-groups")
      .then((response) => {
        if (!active) return;
        if (response.ok) {
          const data = (response.data as any)?.data ?? response.data;
          setGroups(Array.isArray(data) ? data : []);
        } else {
          setGroups([]);
        }
        setGroupsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setGroups([]);
        setGroupsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!draft.groupId) {
      setSubsidiaries([]);
      setSubsidiariesLoaded(false);
      return () => {
        active = false;
      };
    }

    setSubsidiariesLoaded(false);
    apiFetch("/tenants", { headers: { "X-Group-Id": draft.groupId } })
      .then((response) => {
        if (!active) return;
        if (response.ok) {
          const data = (response.data as any)?.data ?? response.data;
          setSubsidiaries(Array.isArray(data) ? data : []);
        } else {
          setSubsidiaries([]);
        }
        setSubsidiariesLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setSubsidiaries([]);
        setSubsidiariesLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [draft.groupId]);

  useEffect(() => {
    let active = true;
    if (!draft.groupId || !draft.subsidiaryId) {
      setLocations([]);
      setLocationsLoaded(false);
      return () => {
        active = false;
      };
    }

    setLocationsLoaded(false);
    const query = new URLSearchParams({
      subsidiary_id: draft.subsidiaryId,
      limit: "200",
      offset: "0"
    }).toString();
    apiFetch(`/locations?${query}`, { headers: { "X-Group-Id": draft.groupId } })
      .then((response) => {
        if (!active) return;
        if (response.ok) {
          const data = (response.data as any)?.data ?? response.data;
          setLocations(Array.isArray(data) ? data : []);
        } else {
          setLocations([]);
        }
        setLocationsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLocations([]);
        setLocationsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [draft.groupId, draft.subsidiaryId]);

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 1,
        borderRadius: 2,
        border: "1px solid #E3DED3",
        backgroundColor: "#FFFDFA",
        backdropFilter: "blur(8px)"
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {groupsLoaded && groups.length ? (
          <TextField
            select
            label="Group"
            size="small"
            value={draft.groupId || ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                groupId: event.target.value,
                subsidiaryId: "",
                locationId: ""
              })
            }
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Select group</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {`${group.name} (${group.id})`}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            label="Group"
            size="small"
            value={draft.groupId}
            onChange={(event) =>
              setDraft({
                ...draft,
                groupId: event.target.value,
                subsidiaryId: "",
                locationId: ""
              })
            }
            sx={{ minWidth: 140 }}
          />
        )}
        {subsidiariesLoaded && subsidiaries.length ? (
          <TextField
            select
            label="Subsidiary"
            size="small"
            value={draft.subsidiaryId || ""}
            onChange={(event) =>
              setDraft({ ...draft, subsidiaryId: event.target.value, locationId: "" })
            }
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Select subsidiary</MenuItem>
            {subsidiaries.map((subsidiary) => (
              <MenuItem key={subsidiary.id} value={subsidiary.id}>
                {`${subsidiary.name} (${subsidiary.id})`}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            label="Subsidiary"
            size="small"
            value={draft.subsidiaryId}
            onChange={(event) =>
              setDraft({ ...draft, subsidiaryId: event.target.value, locationId: "" })
            }
            sx={{ minWidth: 160 }}
          />
        )}
        {locationsLoaded && locations.length ? (
          <TextField
            select
            label="Location"
            size="small"
            value={draft.locationId || ""}
            onChange={(event) => setDraft({ ...draft, locationId: event.target.value })}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Select location</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {`${location.name} (${location.id})`}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            label="Location"
            size="small"
            value={draft.locationId || ""}
            onChange={(event) => setDraft({ ...draft, locationId: event.target.value })}
            sx={{ minWidth: 150 }}
          />
        )}
        <TextField
          select
          label="Channel"
          size="small"
          value={draft.channel}
          onChange={(event) => setDraft({ ...draft, channel: event.target.value })}
          sx={{ minWidth: 140 }}
        >
          {CHANNELS.map((channel) => (
            <MenuItem key={channel} value={channel}>
              {channel}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" size="small" onClick={() => setTenant(draft)}>
          Apply
        </Button>
      </Stack>
    </Paper>
  );
}
