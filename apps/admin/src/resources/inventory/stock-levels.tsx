"use client";

import { Datagrid, List, NumberField, TextField, TextInput } from "react-admin";

const stockLevelFilters = [
  <TextInput key="product_id" source="product_id" label="Product ID" />,
  <TextInput key="variant_id" source="variant_id" label="Variant ID" />
];

export function StockLevelList() {
  return (
    <List filters={stockLevelFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="product_id" />
        <TextField source="variant_id" />
        <TextField source="location_id" />
        <NumberField source="on_hand" />
        <NumberField source="reserved" />
        <NumberField source="available" />
      </Datagrid>
    </List>
  );
}
