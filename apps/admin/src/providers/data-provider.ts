import type { DataProvider } from "react-admin";
import { apiFetch } from "../lib/api";
import { newIdempotencyKey } from "../lib/idempotency";

function idempotencyHeaders() {
  return { "Idempotency-Key": newIdempotencyKey() };
}

function buildQuery(params: Record<string, any>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function normalizeList(data: any) {
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const total = data?.meta?.total ?? items.length;
  return { items, total };
}

function mapPosDeviceRecord(record: any) {
  if (!record) return record;
  const deviceId = record.device_id ?? record.deviceId ?? record.id;
  return { ...record, id: deviceId };
}

function mapPosDeviceList(items: any[]) {
  return items.map((item) => mapPosDeviceRecord(item));
}

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const filter = params.filter || {};
    if (resource === "users") {
      const query = buildQuery({
        limit: perPage,
        offset: (page - 1) * perPage,
        q: filter.q,
        include_unscoped: filter.include_unscoped ? "true" : undefined
      });
      const response = await apiFetch(`/iam/users${query}`);
      const { items, total } = normalizeList(response.data);
      return { data: items, total };
    }
    if (resource === "app-users") {
      const query = buildQuery({
        limit: perPage,
        offset: (page - 1) * perPage,
        q: filter.q
      });
      const response = await apiFetch(`/users${query}`);
      const { items, total } = normalizeList(response.data);
      return { data: items, total };
    }
    if (resource === "roles") {
      const response = await apiFetch(`/iam/roles`);
      const { items } = normalizeList(response.data);
      const query = (filter.q ?? "").toString().toLowerCase();
      const filtered = query
        ? items.filter((item: any) => String(item?.name ?? "").toLowerCase().includes(query))
        : items;
      const offset = (page - 1) * perPage;
      const paged = filtered.slice(offset, offset + perPage);
      return { data: paged, total: filtered.length };
    }
    if (resource === "app-roles") {
      const response = await apiFetch(`/roles`);
      const { items } = normalizeList(response.data);
      const query = (filter.q ?? "").toString().toLowerCase();
      const filtered = query
        ? items.filter((item: any) => String(item?.name ?? "").toLowerCase().includes(query))
        : items;
      const offset = (page - 1) * perPage;
      const paged = filtered.slice(offset, offset + perPage);
      return { data: paged, total: filtered.length };
    }
    if (resource === "app-permissions") {
      const response = await apiFetch(`/permissions`);
      const { items } = normalizeList(response.data);
      return { data: items, total: items.length };
    }
    if (resource === "subsidiaries") {
      const response = await apiFetch(`/tenants`);
      const { items } = normalizeList(response.data);
      const query = (filter.q ?? "").toString().toLowerCase();
      const filtered = query
        ? items.filter((item: any) => String(item?.name ?? "").toLowerCase().includes(query))
        : items;
      const offset = (page - 1) * perPage;
      const paged = filtered.slice(offset, offset + perPage);
      return { data: paged, total: filtered.length };
    }
    const query = buildQuery({
      limit: perPage,
      offset: (page - 1) * perPage,
      sort: field,
      order: order,
      ...filter
    });
    if (resource === "facet-values") {
      const facetId = filter.facet_id;
      if (!facetId) {
        return { data: [], total: 0 };
      }
      const response = await apiFetch(`/facets/${facetId}/values${query}`);
      const { items, total } = normalizeList(response.data);
      return { data: items, total };
    }
    if (resource === "pos/devices") {
      const response = await apiFetch(`/pos/devices${query}`);
      const { items, total } = normalizeList(response.data);
      return { data: mapPosDeviceList(items), total };
    }
    const response = await apiFetch(`/${resource}${query}`);
    const { items, total } = normalizeList(response.data);
    return { data: items, total };
  },
  getOne: async (resource, params) => {
    if (resource === "pos/devices") {
      const response = await apiFetch(`/pos/devices?device_id=${params.id}`);
      const { items } = normalizeList(response.data);
      return { data: mapPosDeviceRecord(items[0]) };
    }
    const response = await apiFetch(`/${resource}/${params.id}`);
    const record = (response.data as any)?.data ?? response.data;
    return { data: record };
  },
  getMany: async (resource, params) => {
    const query = buildQuery({ ids: params.ids.join(",") });
    const response = await apiFetch(`/${resource}${query}`);
    const { items } = normalizeList(response.data);
    return { data: items };
  },
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = buildQuery({
      limit: perPage,
      offset: (page - 1) * perPage,
      sort: field,
      order: order,
      [params.target]: params.id,
      ...params.filter
    });
    const response = await apiFetch(`/${resource}${query}`);
    const { items, total } = normalizeList(response.data);
    return { data: items, total };
  },
  create: async (resource, params) => {
    if (resource === "facet-values") {
      const facetId = params.data.facet_id;
      const payload = { ...params.data };
      delete payload.facet_id;
      const response = await apiFetch(`/facets/${facetId}/values`, {
        method: "POST",
        body: payload,
        headers: idempotencyHeaders()
      });
      const record = (response.data as any)?.data ?? response.data;
      return { data: record };
    }
    if (resource === "subsidiaries") {
      const response = await apiFetch(`/subsidiaries`, { method: "POST", body: params.data, headers: idempotencyHeaders() });
      const record = (response.data as any)?.subsidiary ?? response.data;
      return { data: record };
    }
    if (resource === "app-users") {
      const response = await apiFetch(`/users`, { method: "POST", body: params.data, headers: idempotencyHeaders() });
      const record = (response.data as any)?.data ?? response.data;
      return { data: record };
    }
    if (resource === "app-roles") {
      const response = await apiFetch(`/roles`, { method: "POST", body: params.data, headers: idempotencyHeaders() });
      const record = (response.data as any)?.data ?? response.data;
      return { data: record };
    }
    if (resource === "pos/shifts") {
      const payload = { ...params.data };
      const locationId = payload.location_id;
      delete payload.location_id;
      const response = await apiFetch(`/pos/shifts`, {
        method: "POST",
        body: payload,
        headers: { ...idempotencyHeaders(), ...(locationId ? { "X-Location-Id": locationId } : {}) }
      });
      const record = (response.data as any)?.data ?? response.data;
      return { data: record };
    }
    const response = await apiFetch(`/${resource}`, { method: "POST", body: params.data, headers: idempotencyHeaders() });
    const record = (response.data as any)?.data ?? response.data;
    if (resource === "pos/devices") {
      return { data: mapPosDeviceRecord(record) };
    }
    return { data: record };
  },
  update: async (resource, params) => {
    const response = await apiFetch(`/${resource}/${params.id}`, {
      method: "PATCH",
      body: params.data,
      headers: idempotencyHeaders()
    });
    const record = (response.data as any)?.data ?? response.data;
    if (resource === "pos/devices") {
      return { data: mapPosDeviceRecord(record) };
    }
    return { data: record };
  },
  updateMany: async (resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) =>
        apiFetch(`/${resource}/${id}`, { method: "PATCH", body: params.data, headers: idempotencyHeaders() })
      )
    );
    return { data: results.map((_, index) => params.ids[index]) };
  },
  delete: async (resource, params) => {
    const response = await apiFetch(`/${resource}/${params.id}`, { method: "DELETE" });
    const record = (response.data as any)?.data ?? response.data;
    return { data: record };
  },
  deleteMany: async (resource, params) => {
    await Promise.all(params.ids.map((id) => apiFetch(`/${resource}/${id}`, { method: "DELETE" })));
    return { data: params.ids };
  }
};
