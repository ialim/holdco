"use client";

import {
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";
import { formatJson, parseJson, validateJson } from "../catalog/json-utils";

const statusChoices = [
  { id: "active", name: "active" },
  { id: "inactive", name: "inactive" },
  { id: "retired", name: "retired" }
];

const deviceFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <TextInput key="subsidiary_id" source="subsidiary_id" label="Subsidiary ID" />,
  <TextInput key="location_id" source="location_id" label="Location ID" />,
  <SelectInput key="status" source="status" choices={statusChoices} />
];

function DeviceForm({ isEdit }: { isEdit?: boolean }) {
  return (
    <>
      <TextInput
        source="device_id"
        label="Device ID"
        validate={isEdit ? undefined : [required(), minLength(2)]}
        disabled={isEdit}
        fullWidth
      />
      <TextInput source="name" fullWidth />
      <TextInput source="location_id" label="Location ID" validate={[required()]} fullWidth />
      <SelectInput source="status" choices={statusChoices} />
      <TextInput
        source="metadata"
        label="Metadata (JSON)"
        multiline
        minRows={4}
        fullWidth
        parse={parseJson}
        format={formatJson}
        validate={validateJson}
      />
    </>
  );
}

export function DeviceList() {
  return (
    <List filters={deviceFilters} perPage={50}>
      <Datagrid rowClick="edit">
        <TextField source="device_id" />
        <TextField source="name" />
        <TextField source="status" />
        <TextField source="location_id" />
        <TextField source="subsidiary_id" />
        <DateField source="last_seen_at" showTime />
      </Datagrid>
    </List>
  );
}

export function DeviceCreate() {
  return (
    <Create>
      <SimpleForm>
        <DeviceForm />
      </SimpleForm>
    </Create>
  );
}

export function DeviceEdit() {
  return (
    <Edit>
      <SimpleForm>
        <DeviceForm isEdit />
      </SimpleForm>
    </Edit>
  );
}
