"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrayInput,
  AutocompleteInput,
  BooleanInput,
  Create,
  Datagrid,
  DateInput,
  FormDataConsumer,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SaveButton,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  Toolbar,
  required,
  useNotify,
  usePermissions,
  useRecordContext,
  useRefresh
} from "react-admin";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useFormContext, useWatch } from "react-hook-form";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const orderFilters = [
  <TextInput key="reseller_id" source="reseller_id" label="Reseller ID" />,
  <TextInput key="status" source="status" label="Status" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

type CreditSnapshot = {
  resellerId?: string;
  limit?: number;
  used?: number;
  available?: number;
  status?: string;
  orderTotal?: number;
  allowOverride?: boolean;
  hasAccount?: boolean;
};

const formatMoney = (value?: number) =>
  Number.isFinite(value) ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

function FulfillWholesaleButton() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  const fulfill = async () => {
    if (!record?.id) return;
    setLoading(true);
    const response = await apiFetch(`/adapters/wholesale/orders/${record.id}/fulfill`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() }
    });
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Wholesale order fulfilled", { type: "success" });
    refresh();
  };

  return (
    <Button size="small" variant="outlined" onClick={fulfill} disabled={loading || record?.status === "fulfilled"}>
      Fulfill
    </Button>
  );
}

export function WholesaleOrderList() {
  const location = useLocation();
  const resellerId = useMemo(() => new URLSearchParams(location.search).get("reseller_id") || "", [location.search]);
  const defaultFilters = resellerId ? { reseller_id: resellerId } : undefined;

  return (
    <List filters={orderFilters} perPage={50} filterDefaultValues={defaultFilters}>
      <Datagrid rowClick="show">
        <TextField source="order_no" label="Order No" />
        <TextField source="reseller_id" />
        <TextField source="status" />
        <TextField source="payment_status" />
        <NumberField source="total_amount" />
        <NumberField source="paid_amount" />
        <NumberField source="balance_due" />
        <TextField source="currency" />
        <FulfillWholesaleButton />
      </Datagrid>
    </List>
  );
}

function CreditSummaryPanel({
  canOverride,
  onSnapshot
}: {
  canOverride: boolean;
  onSnapshot: (snapshot: CreditSnapshot) => void;
}) {
  const { control } = useFormContext();
  const notify = useNotify();
  const resellerId = useWatch({ control, name: "reseller_id" }) as string | undefined;
  const items = (useWatch({ control, name: "items" }) as Array<any>) ?? [];
  const discountAmount = useWatch({ control, name: "discount_amount" }) as number | undefined;
  const taxAmount = useWatch({ control, name: "tax_amount" }) as number | undefined;
  const shippingAmount = useWatch({ control, name: "shipping_amount" }) as number | undefined;
  const allowOverride = useWatch({ control, name: "allow_credit_override" }) as boolean | undefined;

  const [credit, setCredit] = useState<CreditSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const orderTotal = items.reduce((sum, item) => {
    const quantity = Number(item?.quantity ?? 0);
    const unitPrice = Number(item?.unit_price ?? 0);
    return sum + quantity * unitPrice;
  }, 0);
  const total =
    orderTotal - Number(discountAmount ?? 0) + Number(taxAmount ?? 0) + Number(shippingAmount ?? 0);

  const exceedsCredit = credit?.available != null && total > credit.available && !allowOverride;

  useEffect(() => {
    onSnapshot({
      resellerId,
      limit: credit?.limit,
      used: credit?.used,
      available: credit?.available,
      status: credit?.status,
      hasAccount: credit?.hasAccount,
      orderTotal: total,
      allowOverride
    });
  }, [
    resellerId,
    credit?.limit,
    credit?.used,
    credit?.available,
    credit?.status,
    credit?.hasAccount,
    total,
    allowOverride,
    onSnapshot
  ]);

  useEffect(() => {
    if (!resellerId) {
      setCredit(null);
      return;
    }
    const loadCredit = async () => {
      setLoading(true);
      const response = await apiFetch(`/credit-accounts?reseller_id=${resellerId}&limit=1`);
      setLoading(false);

      if (!response.ok) {
        const message = (response.data as any)?.message || `Credit lookup failed (${response.status})`;
        notify(message, { type: "error" });
        setCredit({ resellerId, hasAccount: false });
        return;
      }

      const account = Array.isArray((response.data as any)?.data) ? (response.data as any).data[0] : undefined;
      if (!account) {
        setCredit({ resellerId, hasAccount: false });
        return;
      }

      setCredit({
        resellerId,
        limit: Number(account.limit_amount),
        used: Number(account.used_amount),
        available: Number(account.available_amount),
        status: account.status,
        hasAccount: true
      });
    };
    loadCredit();
  }, [resellerId, notify]);

  return (
    <Box sx={{ border: "1px solid #E3DED3", borderRadius: 2, padding: 2, backgroundColor: "rgba(255,255,255,0.7)" }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1">Credit summary</Typography>
        {!resellerId && (
          <Typography variant="body2" color="text.secondary">
            Select a reseller to view credit availability.
          </Typography>
        )}
        {resellerId && loading && (
          <Typography variant="body2" color="text.secondary">
            Loading credit account...
          </Typography>
        )}
        {resellerId && !loading && credit?.hasAccount === false && (
          <Alert severity="warning">No credit account found for this reseller.</Alert>
        )}
        {credit?.hasAccount && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Typography variant="body2">Limit: {formatMoney(credit.limit)}</Typography>
            <Typography variant="body2">Used: {formatMoney(credit.used)}</Typography>
            <Typography variant="body2">Available: {formatMoney(credit.available)}</Typography>
            <Typography variant="body2">Status: {credit.status}</Typography>
          </Stack>
        )}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Typography variant="body2">Order total: {formatMoney(total)}</Typography>
          {credit?.available != null && (
            <Typography variant="body2">
              Remaining after order: {formatMoney(credit.available - total)}
            </Typography>
          )}
        </Stack>
        {exceedsCredit && (
          <Alert severity="error">
            Credit limit exceeded. Available credit is {formatMoney(credit?.available)}.
            {canOverride ? " Enable override to proceed." : " You do not have override permission."}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

function WholesaleOrderToolbar({ snapshot }: { snapshot?: CreditSnapshot | null }) {
  const blocked =
    snapshot?.resellerId &&
    snapshot?.available != null &&
    snapshot.orderTotal != null &&
    snapshot.orderTotal > snapshot.available &&
    !snapshot.allowOverride;

  return (
    <Toolbar>
      <SaveButton disabled={Boolean(blocked)} />
    </Toolbar>
  );
}

function PriceLookupButton({
  priceListId,
  productId,
  variantId,
  target
}: {
  priceListId?: string;
  productId?: string;
  variantId?: string;
  target: string;
}) {
  const notify = useNotify();
  const { setValue } = useFormContext();
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!priceListId) {
      notify("Select a price list first", { type: "warning" });
      return;
    }
    if (!variantId && !productId) {
      notify("Select a product or variant first", { type: "warning" });
      return;
    }

    const params = new URLSearchParams({
      price_list_id: priceListId,
      limit: "1"
    });
    if (variantId) {
      params.set("variant_id", variantId);
    } else if (productId) {
      params.set("product_id", productId);
    }

    setLoading(true);
    const response = await apiFetch(`/price-rules?${params.toString()}`);
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    const items = (response.data as any)?.data ?? [];
    const rule = Array.isArray(items) ? items[0] : undefined;
    if (!rule) {
      notify("No price rule found for this item", { type: "warning" });
      return;
    }

    setValue(target, Number(rule.price ?? 0), { shouldDirty: true, shouldValidate: true });
    notify("Price applied", { type: "success" });
  };

  return (
    <Button size="small" variant="outlined" onClick={lookup} disabled={loading}>
      Use price list
    </Button>
  );
}

export function WholesaleOrderCreate() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canOverride = permissionList.includes("*") || permissionList.includes("credit.limit.override");
  const [snapshot, setSnapshot] = useState<CreditSnapshot | null>(null);

  const validate = useMemo(
    () => (values: any) => {
      if (!snapshot?.resellerId || snapshot.available == null || snapshot.orderTotal == null) {
        return {};
      }
      if (snapshot.orderTotal > snapshot.available && !values.allow_credit_override) {
        return {
          reseller_id: "Credit limit exceeded. Use override or reduce order total."
        };
      }
      return {};
    },
    [snapshot]
  );

  return (
    <Create>
      <SimpleForm validate={validate} toolbar={<WholesaleOrderToolbar snapshot={snapshot} />}>
        <ReferenceInput source="reseller_id" reference="resellers">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
            fullWidth
          />
        </ReferenceInput>
        <CreditSummaryPanel canOverride={canOverride} onSnapshot={setSnapshot} />
        {canOverride && (
          <BooleanInput
            source="allow_credit_override"
            label="Override credit limit"
            helperText="Requires credit.limit.override permission."
          />
        )}
        <ReferenceInput source="price_list_id" reference="price-lists" allowEmpty>
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.currency})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
          />
        </ReferenceInput>
        <TextInput source="currency" defaultValue="NGN" fullWidth />
        <NumberInput source="discount_amount" fullWidth />
        <NumberInput source="tax_amount" fullWidth />
        <NumberInput source="shipping_amount" fullWidth />
        <ArrayInput source="items">
          <SimpleFormIterator inline>
            <FormDataConsumer>
              {({ formData, scopedFormData, getSource }) => (
                <>
                  <ReferenceInput source={getSource("product_id")} reference="products">
                    <AutocompleteInput
                      optionText={(record) => (record?.name ? `${record.name} (${record.sku ?? record.id})` : record?.id)}
                      filterToQuery={(search) => ({ q: search })}
                      validate={[required()]}
                    />
                  </ReferenceInput>
                  <ReferenceInput
                    source={getSource("variant_id")}
                    reference="variants"
                    filter={{ product_id: scopedFormData?.product_id }}
                    allowEmpty
                  >
                    <AutocompleteInput
                      optionText={(record) =>
                        record?.size || record?.unit || record?.barcode
                          ? `${record?.size ?? ""}${record?.unit ? ` ${record.unit}` : ""}${record?.barcode ? ` • ${record.barcode}` : ""}`.trim()
                          : record?.id
                      }
                    />
                  </ReferenceInput>
                  <NumberInput source={getSource("quantity")} validate={[required()]} />
                  <NumberInput source={getSource("unit_price")} />
                  <PriceLookupButton
                    priceListId={formData?.price_list_id}
                    productId={scopedFormData?.product_id}
                    variantId={scopedFormData?.variant_id}
                    target={getSource("unit_price")}
                  />
                </>
              )}
            </FormDataConsumer>
          </SimpleFormIterator>
        </ArrayInput>
        <TextInput source="notes" multiline minRows={3} fullWidth />
      </SimpleForm>
    </Create>
  );
}
