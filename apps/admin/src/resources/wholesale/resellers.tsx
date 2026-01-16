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
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../../lib/api";

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
  limit_amount?: number;
  used_amount?: number;
  available_amount?: number;
  status?: string;
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
        limit_amount: Number(account.limit_amount),
        used_amount: Number(account.used_amount),
        available_amount: Number(account.available_amount),
        status: account.status
      });
    };
    loadCredit();
  }, [record?.id, notify]);

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
  }, [record?.id, notify]);

  const lastRepayment = report?.repayments?.[0];
  const openOrders = report?.open_orders ?? [];
  const openBalance = openOrders.reduce((sum, order) => sum + Number(order.balance_due ?? 0), 0);

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
      </Stack>
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
