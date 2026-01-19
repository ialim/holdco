"use client";

import { AutocompleteInput, Create, NumberInput, ReferenceInput, SimpleForm, TextInput, required } from "react-admin";

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
