"use client";

import {
  Create,
  Datagrid,
  DateField,
  DateInput,
  Edit,
  List,
  NumberField,
  NumberInput,
  SelectField,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";

const typeChoices = [
  { id: "vendor", name: "Vendor" },
  { id: "client", name: "Client" },
  { id: "partner", name: "Partner" },
];

const originChoices = [
  { id: "domestic", name: "Domestic" },
  { id: "foreign", name: "Foreign" },
];

const vendorFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput key="type" source="type" choices={typeChoices} />,
  <SelectInput key="origin" source="origin" choices={originChoices} />,
];

export function VendorList() {
  return (
    <List filters={vendorFilters} filterDefaultValues={{ type: "vendor" }} perPage={50}>
      <Datagrid rowClick="edit">
        <TextField source="name" />
        <SelectField source="type" choices={typeChoices} />
        <SelectField source="origin" choices={originChoices} />
        <NumberField source="credit_limit" />
        <TextField source="credit_currency" />
        <NumberField source="payment_term_days" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

function VendorForm() {
  return (
    <>
      <TextInput source="name" validate={[required()]} fullWidth />
      <SelectInput source="type" choices={typeChoices} defaultValue="vendor" />
      <SelectInput source="origin" choices={originChoices} defaultValue="domestic" />
      <TextInput source="email" />
      <TextInput source="phone" />
      <NumberInput source="credit_limit" />
      <TextInput source="credit_currency" />
      <NumberInput source="payment_term_days" />
      <TextInput source="negotiation_notes" multiline minRows={2} fullWidth />
      <TextInput source="last_negotiated_by" />
      <DateInput source="last_negotiated_at" />
      <SelectInput
        source="status"
        choices={[
          { id: "active", name: "Active" },
          { id: "inactive", name: "Inactive" },
        ]}
        defaultValue="active"
      />
    </>
  );
}

export function VendorCreate() {
  return (
    <Create>
      <SimpleForm>
        <VendorForm />
      </SimpleForm>
    </Create>
  );
}

export function VendorEdit() {
  return (
    <Edit>
      <SimpleForm>
        <VendorForm />
      </SimpleForm>
    </Edit>
  );
}
