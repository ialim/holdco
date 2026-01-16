"use client";

import {
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  Edit,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required
} from "react-admin";

const providerChoices = [
  { id: "paystack", name: "paystack" },
  { id: "flutterwave", name: "flutterwave" },
  { id: "moniepoint", name: "moniepoint" },
  { id: "monnify", name: "monnify" },
  { id: "interswitch", name: "interswitch" }
];

const environmentChoices = [
  { id: "test", name: "test" },
  { id: "live", name: "live" }
];

const statusChoices = [
  { id: "draft", name: "draft" },
  { id: "submitted", name: "submitted" },
  { id: "approved", name: "approved" },
  { id: "rejected", name: "rejected" }
];

const configFilters = [
  <TextInput key="subsidiary_id" source="subsidiary_id" label="Subsidiary ID" />,
  <SelectInput key="provider" source="provider" choices={providerChoices} />,
  <SelectInput key="environment" source="environment" choices={environmentChoices} />,
  <SelectInput key="status" source="status" choices={statusChoices} />
];

export function PaymentProviderConfigList() {
  return (
    <List filters={configFilters} perPage={50}>
      <Datagrid rowClick="edit">
        <TextField source="provider" />
        <TextField source="environment" />
        <TextField source="status" />
        <TextField source="subsidiary_id" label="Subsidiary" />
        <TextField source="settlement_account_name" />
        <TextField source="settlement_bank_name" />
        <TextField source="contact_email" />
        <DateField source="updated_at" showTime />
      </Datagrid>
    </List>
  );
}

export function PaymentProviderConfigCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="subsidiary_id" label="Subsidiary ID" validate={[required()]} fullWidth />
        <SelectInput source="provider" choices={providerChoices} validate={[required()]} fullWidth />
        <SelectInput source="environment" choices={environmentChoices} fullWidth />
        <SelectInput source="status" choices={statusChoices} fullWidth />
        <TextInput source="settlement_account_name" fullWidth />
        <TextInput source="settlement_account_number" fullWidth />
        <TextInput source="settlement_bank_name" fullWidth />
        <TextInput source="settlement_bank_code" fullWidth />
        <TextInput source="settlement_currency" fullWidth />
        <TextInput source="contact_name" fullWidth />
        <TextInput source="contact_email" fullWidth />
        <TextInput source="contact_phone" fullWidth />
        <TextInput source="provider_merchant_id" fullWidth />
        <DateTimeInput source="kyc_submitted_at" fullWidth />
        <DateTimeInput source="kyc_approved_at" fullWidth />
        <TextInput source="kyc_notes" multiline minRows={3} fullWidth />
      </SimpleForm>
    </Create>
  );
}

export function PaymentProviderConfigEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="provider" disabled fullWidth />
        <TextInput source="environment" disabled fullWidth />
        <TextInput source="subsidiary_id" disabled fullWidth />
        <SelectInput source="status" choices={statusChoices} fullWidth />
        <TextInput source="settlement_account_name" fullWidth />
        <TextInput source="settlement_account_number" fullWidth />
        <TextInput source="settlement_bank_name" fullWidth />
        <TextInput source="settlement_bank_code" fullWidth />
        <TextInput source="settlement_currency" fullWidth />
        <TextInput source="contact_name" fullWidth />
        <TextInput source="contact_email" fullWidth />
        <TextInput source="contact_phone" fullWidth />
        <TextInput source="provider_merchant_id" fullWidth />
        <DateTimeInput source="kyc_submitted_at" fullWidth />
        <DateTimeInput source="kyc_approved_at" fullWidth />
        <TextInput source="kyc_notes" multiline minRows={3} fullWidth />
      </SimpleForm>
    </Edit>
  );
}
