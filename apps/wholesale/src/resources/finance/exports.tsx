"use client";

import { Box, Button, MenuItem, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNotify } from "react-admin";
import { apiFetch } from "../../lib/api";

const formatChoices = [
  { id: "csv", name: "csv" },
  { id: "json", name: "json" }
];

type ExportResponse = {
  format?: string;
  content?: string;
  content_type?: string;
  file_name?: string;
  columns?: string[];
  data?: unknown;
  meta?: { row_count?: number; generated_at?: string };
};

function buildQuery(params: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    search.append(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function FinanceExportsPage() {
  const notify = useNotify();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState("csv");
  const [period, setPeriod] = useState("");
  const [fiscalPeriodId, setFiscalPeriodId] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [result, setResult] = useState<ExportResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");

  useEffect(() => {
    if (!downloadUrl) return;
    return () => {
      URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const runExport = async (path: string) => {
    const query = buildQuery({
      start_date: startDate,
      end_date: endDate,
      format,
      period,
      fiscal_period_id: fiscalPeriodId,
      invoice_type: invoiceType
    });
    const response = await apiFetch(`${path}${query}`);
    if (!response.ok) {
      const message = (response.data as any)?.message || `Export failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    const data = response.data as ExportResponse;
    setResult(data);

    if (data.content && data.file_name) {
      const blob = new Blob([data.content], { type: data.content_type || "text/csv" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(data.file_name);
    } else {
      setDownloadUrl("");
      setDownloadName("");
    }

    notify("Export ready", { type: "success" });
  };

  return (
    <Box sx={{ paddingBottom: 2 }}>
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Finance exports
      </Typography>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <MuiTextField
          label="End date"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <MuiTextField
          label="Format"
          select
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          fullWidth
        >
          {formatChoices.map((choice) => (
            <MenuItem key={choice.id} value={choice.id}>
              {choice.name}
            </MenuItem>
          ))}
        </MuiTextField>
      </Stack>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <MuiTextField
          label="Period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Fiscal period id"
          value={fiscalPeriodId}
          onChange={(event) => setFiscalPeriodId(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Invoice type"
          value={invoiceType}
          onChange={(event) => setInvoiceType(event.target.value)}
          fullWidth
        />
      </Stack>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <Button variant="contained" onClick={() => runExport("/finance/exports/invoices")}>
          Export invoices
        </Button>
        <Button variant="outlined" onClick={() => runExport("/finance/exports/journals")}>
          Export journals
        </Button>
        <Button variant="outlined" onClick={() => runExport("/finance/exports/payments")}>
          Export payments
        </Button>
      </Stack>

      {result && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="subtitle1">Latest export</Typography>
          <Typography variant="body2">
            Format: {result.format || ""} | Rows: {result.meta?.row_count ?? 0} | Generated: {result.meta?.generated_at || ""}
          </Typography>
          {downloadUrl ? (
            <Button
              component="a"
              href={downloadUrl}
              download={downloadName || "export.csv"}
              variant="contained"
              sx={{ marginTop: 2 }}
            >
              Download file
            </Button>
          ) : (
            <MuiTextField
              multiline
              minRows={6}
              value={result.data ? JSON.stringify(result.data, null, 2) : "No data returned"}
              fullWidth
              sx={{ marginTop: 2 }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
