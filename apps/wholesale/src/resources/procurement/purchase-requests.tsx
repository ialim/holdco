"use client";

import {
  ArrayInput,
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  DateInput,
  FunctionField,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  required
} from "react-admin";

const requestFilters = [
  <TextInput key="status" source="status" label="Status" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

export function PurchaseRequestList() {
  return (
    <List filters={requestFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="status" />
        <FunctionField
          label="Requester"
          render={(record: any) =>
            record?.requester_name || record?.requester_email || record?.requester_id || "-"
          }
        />
        <DateField source="needed_by" />
        <NumberField source="items_count" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function PurchaseRequestCreate() {
  return (
    <Create>
      <SimpleForm>
        <ReferenceInput source="requester_id" reference="app-users" allowEmpty>
          <AutocompleteInput
            optionText={(record) =>
              record?.name ? `${record.name} (${record.email ?? record.id})` : record?.email ?? record?.id
            }
            filterToQuery={(search) => ({ q: search })}
            fullWidth
          />
        </ReferenceInput>
        <DateInput source="needed_by" />
        <TextInput source="notes" multiline minRows={3} fullWidth />
        <ArrayInput source="items">
          <SimpleFormIterator inline>
            <TextInput source="description" validate={[required()]} />
            <NumberInput source="quantity" validate={[required()]} />
            <TextInput source="unit" />
            <NumberInput source="estimated_unit_cost" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
}
