"use client";

import { Datagrid, FunctionField, List, TextField, TextInput } from "react-admin";

const roleFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export function RolesList() {
  return (
    <List filters={roleFilters} perPage={50}>
      <Datagrid>
        <TextField source="name" />
        <TextField source="description" />
        <TextField source="composite" />
        <FunctionField
          label="Permissions"
          render={(record: any) =>
            Array.isArray(record?.permissions) ? record.permissions.join(", ") : ""
          }
        />
      </Datagrid>
    </List>
  );
}
