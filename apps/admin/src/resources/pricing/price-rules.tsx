"use client";

import {
  Create,
  Datagrid,
  FormDataConsumer,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SimpleForm,
  TextField,
  TextInput,
  AutocompleteInput,
  required
} from "react-admin";

const priceRuleFilters = [
  <TextInput key="price_list_id" source="price_list_id" label="Price list ID" />,
  <TextInput key="product_id" source="product_id" label="Product ID" />,
  <TextInput key="variant_id" source="variant_id" label="Variant ID" />
];

export function PriceRuleList() {
  return (
    <List filters={priceRuleFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="price_list_id" />
        <TextField source="product_id" />
        <TextField source="variant_id" />
        <NumberField source="min_qty" />
        <NumberField source="price" />
      </Datagrid>
    </List>
  );
}

export function PriceRuleCreate() {
  return (
    <Create>
      <SimpleForm>
        <ReferenceInput source="price_list_id" reference="price-lists">
          <AutocompleteInput optionText={(record) => record?.name ?? record?.id} validate={[required()]} />
        </ReferenceInput>
        <ReferenceInput source="product_id" reference="products">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.sku ?? record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
          />
        </ReferenceInput>
        <FormDataConsumer>
          {({ scopedFormData }) => (
            <ReferenceInput
              source="variant_id"
              reference="variants"
              filter={{ product_id: scopedFormData?.product_id }}
              allowEmpty
            >
              <AutocompleteInput
                optionText={(record) =>
                  record?.size || record?.unit || record?.barcode
                    ? `${record?.size ?? ""}${record?.unit ? ` ${record.unit}` : ""}${record?.barcode ? ` - ${record.barcode}` : ""}`.trim()
                    : record?.id
                }
              />
            </ReferenceInput>
          )}
        </FormDataConsumer>
        <NumberInput source="min_qty" validate={[required()]} fullWidth />
        <NumberInput source="price" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
