"use client";

import {
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  List,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  SimpleShowLayout,
  Show,
  TextField,
  TextInput,
  required,
  usePermissions
} from "react-admin";
import { Box, Typography } from "@mui/material";

const shipmentFilters = [
  <TextInput key="status" source="status" label="Status" />
];

const CARRIER_CHOICES = [
  { id: "internal", name: "Internal" },
  { id: "shipbubble", name: "Shipbubble" },
  { id: "sendbox", name: "Sendbox" },
  { id: "gig", name: "GIG" },
  { id: "kwik", name: "KWIK" }
];

export function ShipmentList() {
  return (
    <List perPage={50} filters={shipmentFilters}>
      <Datagrid rowClick="show">
        <TextField source="order_no" label="Order" />
        <TextField source="reseller_name" label="Reseller" />
        <TextField source="location_name" label="Location" />
        <TextField source="channel" />
        <TextField source="carrier" />
        <TextField source="status" />
        <TextField source="tracking_no" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function ShipmentShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="order_no" label="Order" />
        <TextField source="order_id" label="Order ID" />
        <TextField source="reseller_name" label="Reseller" />
        <TextField source="location_name" label="Location" />
        <TextField source="channel" />
        <TextField source="carrier" />
        <TextField source="status" />
        <TextField source="tracking_no" />
        <DateField source="created_at" showTime />
      </SimpleShowLayout>
    </Show>
  );
}

export function ShipmentCreate() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canManageShipments =
    permissionList.includes("*") || permissionList.includes("logistics.shipment.write");

  return (
    <Create>
      {canManageShipments ? (
        <SimpleForm>
          <ReferenceInput source="order_id" reference="orders">
            <AutocompleteInput
              optionText={(record) =>
                record?.order_no
                  ? `${record.order_no}${record?.reseller_name ? ` • ${record.reseller_name}` : ""}`
                  : record?.id
              }
              filterToQuery={(search) => ({ q: search })}
              validate={[required()]}
            />
          </ReferenceInput>
          <SelectInput source="carrier" choices={CARRIER_CHOICES} validate={[required()]} fullWidth />
          <TextInput source="tracking_no" label="Tracking No" fullWidth />
        </SimpleForm>
      ) : (
        <Box sx={{ padding: 3 }}>
          <Typography variant="body2" color="text.secondary">
            You do not have permission to create shipments.
          </Typography>
        </Box>
      )}
    </Create>
  );
}
