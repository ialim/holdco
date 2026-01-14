"use client";

import {
  ArrayInput,
  Create,
  Datagrid,
  DateField,
  DateInput,
  List,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  required
} from "react-admin";

const journalFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

function accountOptionText(record: any) {
  if (!record) return "";
  const code = record.code ? String(record.code) : "";
  const name = record.name ? String(record.name) : "";
  if (!code && !name) return "";
  if (!code) return name;
  if (!name) return code;
  return `${code} - ${name}`;
}

function costCenterOptionText(record: any) {
  if (!record) return "";
  const code = record.code ? String(record.code) : "";
  const name = record.name ? String(record.name) : "";
  if (!code && !name) return "";
  if (!code) return name;
  if (!name) return code;
  return `${code} - ${name}`;
}

export function JournalEntriesList() {
  return (
    <List filters={journalFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="id" />
        <TextField source="fiscal_period_id" label="Fiscal period" />
        <TextField source="reference" />
        <TextField source="status" />
        <DateField source="posted_at" label="Posted at" showTime />
      </Datagrid>
    </List>
  );
}

export function JournalEntriesCreate() {
  return (
    <Create>
      <SimpleForm>
        <ReferenceInput source="fiscal_period_id" reference="finance/fiscal-periods" perPage={100}>
          <SelectInput optionText="name" validate={[required()]} fullWidth />
        </ReferenceInput>
        <TextInput source="reference" fullWidth />
        <TextInput source="memo" fullWidth />
        <ArrayInput source="lines" validate={[required()]}>
          <SimpleFormIterator inline>
            <ReferenceInput source="account_id" reference="finance/accounts" perPage={200}>
              <SelectInput optionText={accountOptionText} validate={[required()]} fullWidth />
            </ReferenceInput>
            <ReferenceInput source="cost_center_id" reference="finance/cost-centers" perPage={100}>
              <SelectInput optionText={costCenterOptionText} allowEmpty emptyText="(none)" fullWidth />
            </ReferenceInput>
            <TextInput source="description" fullWidth />
            <NumberInput source="debit" min={0} />
            <NumberInput source="credit" min={0} />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
}
