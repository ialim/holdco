"use client";

import { Create, DateTimeInput, NumberInput, SimpleForm, TextInput, required } from "react-admin";

export function RepaymentCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="credit_account_id" label="Credit Account ID" validate={[required()]} fullWidth />
        <NumberInput source="amount" validate={[required()]} fullWidth />
        <DateTimeInput source="paid_at" label="Paid at" fullWidth />
        <TextInput source="method" fullWidth />
      </SimpleForm>
    </Create>
  );
}
