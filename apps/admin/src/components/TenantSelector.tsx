"use client";

import { Box, Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useTenant } from "../providers/tenant-context";

const CHANNELS = ["admin_ops", "retail", "wholesale", "credit", "digital"];

export function TenantSelector() {
  const { tenant, setTenant } = useTenant();
  const [draft, setDraft] = useState(tenant);

  useEffect(() => {
    setDraft(tenant);
  }, [tenant]);

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
        <TextField
          label="Group"
          size="small"
          value={draft.groupId}
          onChange={(event) => setDraft({ ...draft, groupId: event.target.value })}
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="Subsidiary"
          size="small"
          value={draft.subsidiaryId}
          onChange={(event) => setDraft({ ...draft, subsidiaryId: event.target.value })}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="Location"
          size="small"
          value={draft.locationId || ""}
          onChange={(event) => setDraft({ ...draft, locationId: event.target.value })}
          sx={{ minWidth: 150 }}
        />
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
