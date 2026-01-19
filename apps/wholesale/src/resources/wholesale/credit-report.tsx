"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNotify } from "react-admin";
import { apiFetch } from "../../lib/api";
import { useTenant } from "../../providers/tenant-context";

type CreditReportItem = {
  reseller_id: string;
  reseller_name?: string;
  limit_amount: number;
  used_amount: number;
  available_amount: number;
  status: string;
  aging: {
    "0_30": number;
    "31_60": number;
    "61_90": number;
    "90_plus": number;
  };
  open_orders: Array<{
    order_id: string;
    order_no: string;
    status: string;
    balance_due: number;
    currency: string;
    created_at: string;
    age_days: number;
  }>;
  repayments: Array<{
    repayment_id: string;
    amount: number;
    unapplied_amount: number;
    paid_at: string;
    method?: string;
    allocations: Array<{ order_id: string; amount: number }>;
  }>;
};

const formatAmount = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

export function CreditReportPage() {
  const notify = useNotify();
  const { tenant } = useTenant();
  const [items, setItems] = useState<CreditReportItem[]>([]);
  const [resellers, setResellers] = useState<Array<{ id: string; name: string }>>([]);
  const [resellerId, setResellerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadReport = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (resellerId) params.set("reseller_id", resellerId);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    const response = await apiFetch(`/reports/credit${params.toString() ? `?${params.toString()}` : ""}`);
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Report failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    const data = (response.data as any)?.data ?? [];
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadReport();
  }, [tenant.groupId, tenant.subsidiaryId]);

  useEffect(() => {
    const loadResellers = async () => {
      const response = await apiFetch("/resellers?limit=200&offset=0");
      if (!response.ok) {
        const message = (response.data as any)?.message || `Reseller lookup failed (${response.status})`;
        notify(message, { type: "error" });
        return;
      }
      const data = (response.data as any)?.data ?? [];
      setResellers(Array.isArray(data) ? data : []);
    };
    loadResellers();
  }, [tenant.groupId, tenant.subsidiaryId, notify]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const name = item.reseller_name?.toLowerCase() ?? "";
      return name.includes(term) || item.reseller_id.toLowerCase().includes(term);
    });
  }, [items, search]);

  return (
    <Box sx={{ paddingBottom: 2 }}>
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Credit statements
      </Typography>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Reseller"
          select
          value={resellerId}
          onChange={(event) => setResellerId(event.target.value)}
          fullWidth
        >
          <MenuItem value="">All resellers</MenuItem>
          {resellers.map((reseller) => (
            <MenuItem key={reseller.id} value={reseller.id}>
              {reseller.name}
            </MenuItem>
          ))}
        </MuiTextField>
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
          label="Search reseller"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={loadReport} disabled={loading}>
          Apply
        </Button>
      </Stack>

      {loading && (
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          Loading credit report...
        </Typography>
      )}

      <Stack spacing={2} sx={{ marginTop: 2 }}>
        {filtered.map((item) => (
          <Accordion key={item.reseller_id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack spacing={1} sx={{ width: "100%" }}>
                <Typography variant="subtitle1">
                  {item.reseller_name || item.reseller_id}
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Typography variant="body2">Limit: {formatAmount(item.limit_amount)}</Typography>
                  <Typography variant="body2">Used: {formatAmount(item.used_amount)}</Typography>
                  <Typography variant="body2">Available: {formatAmount(item.available_amount)}</Typography>
                  <Typography variant="body2">Status: {item.status}</Typography>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Typography variant="caption">0-30: {formatAmount(item.aging["0_30"])}</Typography>
                  <Typography variant="caption">31-60: {formatAmount(item.aging["31_60"])}</Typography>
                  <Typography variant="caption">61-90: {formatAmount(item.aging["61_90"])}</Typography>
                  <Typography variant="caption">90+: {formatAmount(item.aging["90_plus"])}</Typography>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
                Open orders
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order No</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Age (days)</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(item.open_orders || []).map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell>{order.order_no}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{formatAmount(order.balance_due)}</TableCell>
                      <TableCell>{order.age_days}</TableCell>
                      <TableCell>{order.created_at.slice(0, 10)}</TableCell>
                    </TableRow>
                  ))}
                  {!item.open_orders?.length && (
                    <TableRow>
                      <TableCell colSpan={5}>No open orders</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Typography variant="subtitle2" sx={{ marginTop: 2, marginBottom: 1 }}>
                Repayments
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Paid at</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Unapplied</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Allocations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(item.repayments || []).map((repayment) => (
                    <TableRow key={repayment.repayment_id}>
                      <TableCell>{repayment.paid_at.slice(0, 10)}</TableCell>
                      <TableCell>{formatAmount(repayment.amount)}</TableCell>
                      <TableCell>{formatAmount(repayment.unapplied_amount)}</TableCell>
                      <TableCell>{repayment.method || "-"}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          {(repayment.allocations || []).map((alloc, index) => (
                            <Typography variant="caption" key={`${repayment.repayment_id}-${alloc.order_id}-${index}`}>
                              {alloc.order_id.slice(0, 8)}... {formatAmount(alloc.amount)}
                            </Typography>
                          ))}
                          {!repayment.allocations?.length && <Typography variant="caption">-</Typography>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!item.repayments?.length && (
                    <TableRow>
                      <TableCell colSpan={5}>No repayments</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}
