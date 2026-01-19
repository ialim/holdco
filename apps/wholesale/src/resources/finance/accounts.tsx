"use client";

import {
  Create,
  Datagrid,
  List,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required
} from "react-admin";

const accountTypeChoices = [
  { id: "asset", name: "asset" },
  { id: "liability", name: "liability" },
  { id: "equity", name: "equity" },
  { id: "income", name: "income" },
  { id: "expense", name: "expense" },
  { id: "cogs", name: "cogs" }
];

const accountFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

function accountOptionText(record: any) {
  if (!record) return "";
  const code = record.code ? String(record.code) : "";
  const name = record.name ? String(record.name) : "";
  if (!code && !name) return "";
  if (!code) return name;
  if (!name) return code;
  return `${code} - ${name}`;
}

export function ChartOfAccountsList() {
  return (
    <List filters={accountFilters} perPage={100}>
      <Datagrid rowClick={false}>
        <TextField source="code" />
        <TextField source="name" />
        <TextField source="type" />
        <TextField source="parent_id" label="Parent" />
      </Datagrid>
    </List>
  );
}

export function ChartOfAccountsCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="code" validate={[required()]} fullWidth />
        <TextInput source="name" validate={[required()]} fullWidth />
        <SelectInput source="type" choices={accountTypeChoices} validate={[required()]} />
        <ReferenceInput source="parent_id" reference="finance/accounts" perPage={200}>
          <SelectInput optionText={accountOptionText} allowEmpty emptyText="(none)" fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
}
