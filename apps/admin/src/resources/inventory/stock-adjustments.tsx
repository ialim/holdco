"use client";

import {
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SimpleForm,
  TextField,
  TextInput,
  required
} from "react-admin";

const adjustmentFilters = [
  <TextInput key="product_id" source="product_id" label="Product ID" />,
  <TextInput key="variant_id" source="variant_id" label="Variant ID" />,
  <TextInput key="location_id" source="location_id" label="Location ID" />
];

export function StockAdjustmentList() {
  return (
    <List perPage={50} filters={adjustmentFilters}>
      <Datagrid rowClick={false}>
        <TextField source="product_name" />
        <TextField source="product_sku" />
        <TextField source="variant_label" />
        <TextField source="location_name" />
        <NumberField source="quantity" />
        <TextField source="reason" />
        <TextField source="created_by_email" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function StockAdjustmentCreate() {
  return (
    <Create>
      <SimpleForm>
        <ReferenceInput source="product_id" reference="products">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.sku ?? record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
          />
        </ReferenceInput>
        <ReferenceInput source="variant_id" reference="variants" allowEmpty>
          <AutocompleteInput
            optionText={(record) =>
              record?.size || record?.unit || record?.barcode
                ? `${record?.size ?? ""}${record?.unit ? ` ${record.unit}` : ""}${record?.barcode ? ` - ${record.barcode}` : ""}`.trim()
                : record?.id
            }
          />
        </ReferenceInput>
        <ReferenceInput source="location_id" reference="locations">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
          />
        </ReferenceInput>
        <NumberInput source="quantity" validate={[required()]} fullWidth />
        <TextInput source="reason" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
