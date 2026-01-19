"use client";

import { useEffect, useState } from "react";
import {
  Create,
  Datagrid,
  FunctionField,
  List,
  SelectInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  required,
  useNotify,
  useRecordContext
} from "react-admin";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const statusChoices = [
  { id: "active", name: "active" },
  { id: "inactive", name: "inactive" },
  { id: "suspended", name: "suspended" }
];

const resellerFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput key="status" source="status" choices={statusChoices} />
];

export function ResellerList() {
  return (
    <List filters={resellerFilters} perPage={50}>
      <Datagrid rowClick="show">
        <TextField source="name" />
        <TextField source="status" />
        <TextField source="id" />
        <FunctionField
          label="Actions"
          render={(record: any) => (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                component={RouterLink}
                to={`/credit-accounts?reseller_id=${record.id}`}
              >
                Credit
              </Button>
              <Button
                size="small"
                component={RouterLink}
                to={`/wholesale-orders?reseller_id=${record.id}`}
              >
                Orders
              </Button>
            </Stack>
          )}
        />
      </Datagrid>
    </List>
  );
}

type CreditAccountSummary = {
  id?: string;
  limit_amount?: number;
  used_amount?: number;
  available_amount?: number;
  status?: string;
  updated_at?: string;
};

type CreditReportEntry = {
  reseller_id: string;
  limit_amount: number;
  used_amount: number;
  available_amount: number;
  status: string;
  open_orders?: Array<{ order_id: string; balance_due: number }>;
  repayments?: Array<{ amount: number; paid_at: string }>;
};

const formatMoney = (value?: number) =>
  Number.isFinite(value) ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

function ResellerCreditSummary() {
  const record = useRecordContext();
  const notify = useNotify();
  const [credit, setCredit] = useState<CreditAccountSummary | null>(null);
  const [report, setReport] = useState<CreditReportEntry | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [repaymentOpen, setRepaymentOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentMethod, setRepaymentMethod] = useState("");
  const [repaymentDate, setRepaymentDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!record?.id) return;
    const loadCredit = async () => {
      const response = await apiFetch(`/credit-accounts?reseller_id=${record.id}&limit=1`);
      if (!response.ok) {
        const message = (response.data as any)?.message || `Credit lookup failed (${response.status})`;
        notify(message, { type: "error" });
        setCredit(null);
        return;
      }
      const account = Array.isArray((response.data as any)?.data) ? (response.data as any).data[0] : undefined;
      if (!account) {
        setCredit(null);
        return;
      }
      setCredit({
        id: account.id,
        limit_amount: Number(account.limit_amount),
        used_amount: Number(account.used_amount),
        available_amount: Number(account.available_amount),
        status: account.status,
        updated_at: account.updated_at
      });
    };
    loadCredit();
  }, [record?.id, notify, reloadKey]);

  useEffect(() => {
    if (!record?.id) return;
    const loadReport = async () => {
      const response = await apiFetch(`/reports/credit?reseller_id=${record.id}`);
      if (!response.ok) {
        const message = (response.data as any)?.message || `Credit report failed (${response.status})`;
        notify(message, { type: "error" });
        setReport(null);
        return;
      }
      const entries = Array.isArray((response.data as any)?.data) ? (response.data as any).data : [];
      setReport(entries[0] ?? null);
    };
    loadReport();
  }, [record?.id, notify, reloadKey]);

  const lastRepayment = report?.repayments?.[0];
  const openOrders = report?.open_orders ?? [];
  const openBalance = openOrders.reduce((sum, order) => sum + Number(order.balance_due ?? 0), 0);

  const submitRepayment = async () => {
    if (!credit?.id) return;
    const amount = Number(repaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Repayment amount is required", { type: "warning" });
      return;
    }

    setSubmitting(true);
    const response = await apiFetch("/adapters/credit/repayments", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        credit_account_id: credit.id,
        amount,
        method: repaymentMethod || undefined,
        paid_at: repaymentDate || undefined
      }
    });
    setSubmitting(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Repayment failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Repayment recorded", { type: "success" });
    setRepaymentOpen(false);
    setRepaymentAmount("");
    setRepaymentMethod("");
    setRepaymentDate("");
    setReloadKey((prev) => prev + 1);
  };

  return (
    <Box sx={{ border: "1px solid #E3DED3", borderRadius: 2, padding: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        Credit summary
      </Typography>
      {credit ? (
        <Stack spacing={1}>
          <Typography variant="body2">Limit: {formatMoney(credit.limit_amount)}</Typography>
          <Typography variant="body2">Used: {formatMoney(credit.used_amount)}</Typography>
          <Typography variant="body2">Available: {formatMoney(credit.available_amount)}</Typography>
          <Typography variant="body2">Status: {credit.status}</Typography>
          <Typography variant="body2">
            Last limit change: {credit.updated_at ? credit.updated_at.slice(0, 10) : "-"}
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No credit account found.
        </Typography>
      )}
      <Stack spacing={1} sx={{ marginTop: 2 }}>
        <Typography variant="body2">
          Open orders: {openOrders.length} ({formatMoney(openBalance)} outstanding)
        </Typography>
        <Typography variant="body2">
          Last repayment: {lastRepayment ? `${formatMoney(lastRepayment.amount)} on ${lastRepayment.paid_at.slice(0, 10)}` : "None"}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setRepaymentOpen(true)}
          disabled={!credit?.id}
        >
          Record repayment
        </Button>
      </Stack>

      <Typography variant="subtitle2" sx={{ marginTop: 3, marginBottom: 1 }}>
        Repayment allocations
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
          {(report?.repayments || []).map((repayment) => (
            <TableRow key={repayment.repayment_id}>
              <TableCell>{repayment.paid_at.slice(0, 10)}</TableCell>
              <TableCell>{formatMoney(repayment.amount)}</TableCell>
              <TableCell>{formatMoney(repayment.unapplied_amount)}</TableCell>
              <TableCell>{repayment.method || "-"}</TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  {(repayment.allocations || []).map((alloc, index) => (
                    <Typography variant="caption" key={`${repayment.repayment_id}-${alloc.order_id}-${index}`}>
                      {alloc.order_id.slice(0, 8)}... {formatMoney(alloc.amount)}
                    </Typography>
                  ))}
                  {!repayment.allocations?.length && <Typography variant="caption">-</Typography>}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {!report?.repayments?.length && (
            <TableRow>
              <TableCell colSpan={5}>No repayments recorded</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={repaymentOpen} onClose={() => setRepaymentOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record repayment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ marginTop: 1 }}>
            <MuiTextField label="Credit account ID" value={credit?.id ?? ""} disabled fullWidth />
            <MuiTextField
              label="Amount"
              type="number"
              value={repaymentAmount}
              onChange={(event) => setRepaymentAmount(event.target.value)}
              fullWidth
            />
            <MuiTextField
              label="Method"
              select
              value={repaymentMethod}
              onChange={(event) => setRepaymentMethod(event.target.value)}
              fullWidth
            >
              <MenuItem value="">Unspecified</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="transfer">Transfer</MenuItem>
              <MenuItem value="card">Card</MenuItem>
            </MuiTextField>
            <MuiTextField
              label="Paid at"
              type="date"
              value={repaymentDate}
              onChange={(event) => setRepaymentDate(event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRepaymentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRepayment} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function ResellerShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="name" />
        <TextField source="status" />
        <TextField source="id" />
        <ResellerCreditSummary />
        <ResellerActions />
      </SimpleShowLayout>
    </Show>
  );
}

function ResellerActions() {
  const record = useRecordContext();
  if (!record?.id) return null;
  const resellerId = encodeURIComponent(String(record.id));

  return (
    <Stack direction="row" spacing={1}>
      <Button component={RouterLink} to={`/credit-accounts?reseller_id=${resellerId}`}>
        View credit accounts
      </Button>
      <Button component={RouterLink} to={`/wholesale-orders?reseller_id=${resellerId}`}>
        View orders
      </Button>
    </Stack>
  );
}

export function ResellerCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required()]} fullWidth />
        <SelectInput source="status" choices={statusChoices} fullWidth />
      </SimpleForm>
    </Create>
  );
}
