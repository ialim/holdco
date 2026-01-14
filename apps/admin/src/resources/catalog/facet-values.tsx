"use client";

import {
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  List,
  ReferenceInput,
  SimpleForm,
  TextField,
  TextInput,
  required
} from "react-admin";

const facetValueFilters = [
  <ReferenceInput key="facet" source="facet_id" reference="facets" allowEmpty>
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <TextInput key="q" source="q" label="Search" />
];

export function FacetValueList() {
  return (
    <List filters={facetValueFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="key" />
        <TextField source="name" />
        <TextField source="value" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function FacetValueCreate() {
  return (
    <Create>
      <SimpleForm>
        <ReferenceInput source="facet_id" reference="facets">
          <AutocompleteInput optionText="name" />
        </ReferenceInput>
        <TextInput source="value" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
