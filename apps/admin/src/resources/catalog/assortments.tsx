"use client";

import {
  Box,
  Button,
  Chip,
  ListItemText,
  MenuItem,
  Stack,
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNotify } from "react-admin";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";
import { useTenant } from "../../providers/tenant-context";

type Subsidiary = {
  id: string;
  name: string;
  role?: string;
  status?: string;
};

type Brand = {
  id: string;
  name: string;
};

type FacetDefinition = {
  id: string;
  key: string;
  name: string;
  scope?: string;
};

type FacetValue = {
  id: string;
  value: string;
};

type Variant = {
  id: string;
  barcode?: string;
  size?: string;
  unit?: string;
};

const TARGET_ROLE_EXCLUSIONS = new Set(["PROCUREMENT_TRADING", "HOLDCO"]);
const ASSORTMENT_PAGE_SIZE = 200;

function parseIds(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\s,;]+/)
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function VariantAssortmentsPage() {
  const notify = useNotify();
  const { tenant } = useTenant();
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [targetSubsidiaryId, setTargetSubsidiaryId] = useState("");
  const [variantIdsInput, setVariantIdsInput] = useState("");
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Variant[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [facetDefs, setFacetDefs] = useState<FacetDefinition[]>([]);
  const [selectedFacetId, setSelectedFacetId] = useState("");
  const [facetValues, setFacetValues] = useState<FacetValue[]>([]);
  const [selectedFacetValues, setSelectedFacetValues] = useState<string[]>([]);
  const [assortedVariantIds, setAssortedVariantIds] = useState<string[]>([]);
  const [assortedVariantTotal, setAssortedVariantTotal] = useState(0);
  const [assortmentOffset, setAssortmentOffset] = useState(0);
  const [assortmentHasMore, setAssortmentHasMore] = useState(false);
  const [loadingAssortments, setLoadingAssortments] = useState(false);
  const [facetMatchMode, setFacetMatchMode] = useState<"any" | "all">("any");
  const [submitting, setSubmitting] = useState(false);

  const currentSubsidiary = useMemo(
    () => subsidiaries.find((item) => item.id === tenant.subsidiaryId),
    [subsidiaries, tenant.subsidiaryId]
  );
  const isTrading =
    String(currentSubsidiary?.role || "").toUpperCase() === "PROCUREMENT_TRADING";

  useEffect(() => {
    if (!tenant.groupId) {
      setSubsidiaries([]);
      setTargetSubsidiaryId("");
      return;
    }

    apiFetch("/tenants")
      .then((response) => {
        if (!response.ok) {
          setSubsidiaries([]);
          return;
        }
        const data = (response.data as any)?.data ?? response.data;
        const list = Array.isArray(data) ? data : [];
        setSubsidiaries(list);

        const preferred = list.find(
          (item: Subsidiary) => !TARGET_ROLE_EXCLUSIONS.has(String(item.role || "").toUpperCase())
        );
        if (preferred?.id && !targetSubsidiaryId) {
          setTargetSubsidiaryId(preferred.id);
        }
      })
      .catch(() => {
        setSubsidiaries([]);
      });
  }, [tenant.groupId, targetSubsidiaryId]);

  useEffect(() => {
    if (!tenant.groupId) {
      setBrands([]);
      setFacetDefs([]);
      return;
    }

    apiFetch("/brands?limit=500")
      .then((response) => {
        if (!response.ok) {
          setBrands([]);
          return;
        }
        const data = (response.data as any)?.data ?? response.data;
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch(() => setBrands([]));

    apiFetch("/facets?limit=500")
      .then((response) => {
        if (!response.ok) {
          setFacetDefs([]);
          return;
        }
        const data = (response.data as any)?.data ?? response.data;
        const list = Array.isArray(data) ? data : [];
        setFacetDefs(list.filter((item) => String(item.scope).toLowerCase() === "variant"));
      })
      .catch(() => setFacetDefs([]));
  }, [tenant.groupId]);

  useEffect(() => {
    if (!selectedFacetId) {
      setFacetValues([]);
      setSelectedFacetValues([]);
      return;
    }

    apiFetch(`/facets/${selectedFacetId}/values?limit=500`)
      .then((response) => {
        if (!response.ok) {
          setFacetValues([]);
          return;
        }
        const data = (response.data as any)?.data ?? response.data;
        setFacetValues(Array.isArray(data) ? data : []);
      })
      .catch(() => setFacetValues([]));
  }, [selectedFacetId]);

  useEffect(() => {
    if (!targetSubsidiaryId) {
      setAssortedVariantIds([]);
      setAssortedVariantTotal(0);
      setAssortmentOffset(0);
      setAssortmentHasMore(false);
      return;
    }

    const loadAssorted = async () => {
      setLoadingAssortments(true);
      const response = await apiFetch(`/variants?limit=${ASSORTMENT_PAGE_SIZE}&offset=0`, {
        headers: { "X-Subsidiary-Id": targetSubsidiaryId }
      });
      setLoadingAssortments(false);
      if (!response.ok) {
        setAssortedVariantIds([]);
        setAssortedVariantTotal(0);
        setAssortmentOffset(0);
        setAssortmentHasMore(false);
        return;
      }
      const data = (response.data as any)?.data ?? [];
      const meta = (response.data as any)?.meta;
      const ids = Array.isArray(data) ? data.map((item: Variant) => item.id).filter(Boolean) : [];
      setAssortedVariantIds(ids);
      const total = Number(meta?.total ?? ids.length);
      setAssortedVariantTotal(total);
      setAssortmentOffset(ids.length);
      setAssortmentHasMore(ids.length < total);
    };

    loadAssorted();
  }, [targetSubsidiaryId]);

  const targetSubsidiaries = subsidiaries.filter(
    (item) => !TARGET_ROLE_EXCLUSIONS.has(String(item.role || "").toUpperCase())
  );

  const selectedFacet = useMemo(
    () => facetDefs.find((item) => item.id === selectedFacetId),
    [facetDefs, selectedFacetId]
  );

  const addVariants = (variants: Variant[]) => {
    setSelectedVariantIds((current) => {
      const next = new Set(current);
      for (const variant of variants) {
        if (variant?.id) next.add(variant.id);
      }
      return Array.from(next);
    });
  };

  const addIdsFromInput = () => {
    const ids = parseIds(variantIdsInput);
    if (!ids.length) {
      notify("Enter at least one variant ID", { type: "warning" });
      return;
    }
    setSelectedVariantIds((current) => Array.from(new Set([...current, ...ids])));
    setVariantIdsInput("");
  };

  const lookupBarcode = async () => {
    if (!barcodeSearch.trim()) {
      notify("Enter a barcode to search", { type: "warning" });
      return;
    }
    setLoadingSearch(true);
    const response = await apiFetch(`/variants?barcode=${encodeURIComponent(barcodeSearch.trim())}&limit=5`);
    setLoadingSearch(false);
    if (!response.ok) {
      const message = (response.data as any)?.message || `Search failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }
    const data = (response.data as any)?.data ?? [];
    setSearchResults(Array.isArray(data) ? data : []);
  };

  const addVariantsFromBrands = async () => {
    if (!isTrading) {
      notify("Select the Procurement/Trading subsidiary in the tenant selector.", { type: "warning" });
      return;
    }
    if (!selectedBrandIds.length) {
      notify("Select at least one brand", { type: "warning" });
      return;
    }

    setSubmitting(true);
    const nextVariants: Variant[] = [];
    const selectedBrands = brands.filter((brand) => selectedBrandIds.includes(brand.id));

    for (const brand of selectedBrands) {
      const facets = encodeURIComponent(`brand=${brand.name}`);
      const productsResponse = await apiFetch(`/products?limit=500&facets=${facets}`);
      if (!productsResponse.ok) {
        continue;
      }
      const products = (productsResponse.data as any)?.data ?? [];
      const list = Array.isArray(products) ? products : [];
      for (const product of list) {
        if (!product?.id) continue;
        const variantsResponse = await apiFetch(`/products/${product.id}/variants?limit=500`);
        if (!variantsResponse.ok) continue;
        const variants = (variantsResponse.data as any)?.data ?? [];
        if (Array.isArray(variants)) {
          nextVariants.push(...variants);
        }
      }
    }

    addVariants(nextVariants);
    setSubmitting(false);
  };

  const addVariantsFromFacetValues = async () => {
    if (!isTrading) {
      notify("Select the Procurement/Trading subsidiary in the tenant selector.", { type: "warning" });
      return;
    }
    if (!selectedFacet || !selectedFacetValues.length) {
      notify("Select a facet and at least one value", { type: "warning" });
      return;
    }

    setSubmitting(true);
    const nextVariants: Variant[] = [];
    if (facetMatchMode === "all") {
      const facets = encodeURIComponent(
        selectedFacetValues.map((value) => `${selectedFacet.key}=${value}`).join("|")
      );
      const response = await apiFetch(`/variants?limit=500&facets=${facets}`);
      if (response.ok) {
        const variants = (response.data as any)?.data ?? [];
        if (Array.isArray(variants)) {
          nextVariants.push(...variants);
        }
      }
    } else {
      for (const value of selectedFacetValues) {
        const facets = encodeURIComponent(`${selectedFacet.key}=${value}`);
        const response = await apiFetch(`/variants?limit=500&facets=${facets}`);
        if (!response.ok) continue;
        const variants = (response.data as any)?.data ?? [];
        if (Array.isArray(variants)) {
          nextVariants.push(...variants);
        }
      }
    }

    addVariants(nextVariants);
    setSubmitting(false);
  };

  const addAssortedVariantsToSelection = () => {
    if (!assortedVariantIds.length) {
      notify("No assorted variants loaded", { type: "warning" });
      return;
    }
    setSelectedVariantIds((current) => Array.from(new Set([...current, ...assortedVariantIds])));
  };

  const loadMoreAssorted = async () => {
    if (!targetSubsidiaryId || loadingAssortments || !assortmentHasMore) return;

    setLoadingAssortments(true);
    const response = await apiFetch(`/variants?limit=${ASSORTMENT_PAGE_SIZE}&offset=${assortmentOffset}`, {
      headers: { "X-Subsidiary-Id": targetSubsidiaryId }
    });
    setLoadingAssortments(false);
    if (!response.ok) return;

    const data = (response.data as any)?.data ?? [];
    const meta = (response.data as any)?.meta;
    const ids = Array.isArray(data) ? data.map((item: Variant) => item.id).filter(Boolean) : [];
    setAssortedVariantIds((current) => Array.from(new Set([...current, ...ids])));
    const total = Number(meta?.total ?? assortedVariantTotal);
    setAssortedVariantTotal(total);
    const nextOffset = assortmentOffset + ids.length;
    setAssortmentOffset(nextOffset);
    setAssortmentHasMore(nextOffset < total);
  };

  const addVariantId = (variantId: string) => {
    setSelectedVariantIds((current) => (current.includes(variantId) ? current : [...current, variantId]));
  };

  const removeVariantId = (variantId: string) => {
    setSelectedVariantIds((current) => current.filter((id) => id !== variantId));
  };

  const runAssortment = async (action: "publish" | "withdraw") => {
    if (!isTrading) {
      notify("Select the Procurement/Trading subsidiary in the tenant selector.", { type: "warning" });
      return;
    }
    if (!targetSubsidiaryId) {
      notify("Select a target subsidiary", { type: "warning" });
      return;
    }
    if (!selectedVariantIds.length) {
      notify("Select at least one variant", { type: "warning" });
      return;
    }

    setSubmitting(true);
    const response = await apiFetch(`/variants/assortments${action === "withdraw" ? "/withdraw" : ""}`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: { subsidiary_id: targetSubsidiaryId, variant_ids: selectedVariantIds }
    });
    setSubmitting(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    const updated = (response.data as any)?.updated;
    notify(
      `${action === "withdraw" ? "Withdrawn" : "Published"} ${updated ?? selectedVariantIds.length} variants`,
      { type: "success" }
    );
  };

  return (
    <Box sx={{ paddingBottom: 2 }}>
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Variant assortments
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
        Switch the tenant selector to the Procurement/Trading subsidiary, then publish variants to reseller or retail subsidiaries.
      </Typography>

      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          select
          label="Target subsidiary"
          value={targetSubsidiaryId}
          onChange={(event) => setTargetSubsidiaryId(event.target.value)}
          fullWidth
        >
          {targetSubsidiaries.map((subsidiary) => (
            <MenuItem key={subsidiary.id} value={subsidiary.id}>
              {`${subsidiary.name} (${subsidiary.role ?? "unknown"})`}
            </MenuItem>
          ))}
        </MuiTextField>
        <MuiTextField
          label="Variant IDs (comma or newline)"
          value={variantIdsInput}
          onChange={(event) => setVariantIdsInput(event.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
        <Stack spacing={1}>
          <Button variant="outlined" onClick={addIdsFromInput}>
            Add IDs
          </Button>
          <Button variant="text" onClick={() => setSelectedVariantIds([])}>
            Clear selection
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <MuiTextField
          select
          label="Brands"
          value={selectedBrandIds}
          onChange={(event) => setSelectedBrandIds(event.target.value as string[])}
          fullWidth
          SelectProps={{
            multiple: true,
            renderValue: (selected) =>
              (selected as string[])
                .map((id) => brands.find((brand) => brand.id === id)?.name || id)
                .join(", ")
          }}
        >
          {brands.map((brand) => (
            <MenuItem key={brand.id} value={brand.id}>
              <ListItemText primary={brand.name} />
            </MenuItem>
          ))}
        </MuiTextField>
        <Button variant="outlined" onClick={addVariantsFromBrands} disabled={submitting}>
          Add brand variants
        </Button>
      </Stack>

      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <MuiTextField
          select
          label="Variant facet"
          value={selectedFacetId}
          onChange={(event) => setSelectedFacetId(event.target.value)}
          fullWidth
        >
          {facetDefs.map((facet) => (
            <MenuItem key={facet.id} value={facet.id}>
              {facet.name} ({facet.key})
            </MenuItem>
          ))}
        </MuiTextField>
        <MuiTextField
          select
          label="Facet values"
          value={selectedFacetValues}
          onChange={(event) => setSelectedFacetValues(event.target.value as string[])}
          fullWidth
          SelectProps={{
            multiple: true,
            renderValue: (selected) => (selected as string[]).join(", ")
          }}
          disabled={!selectedFacetId}
        >
          {facetValues.map((value) => (
            <MenuItem key={value.id} value={value.value}>
              <ListItemText primary={value.value} />
            </MenuItem>
          ))}
        </MuiTextField>
        <MuiTextField
          select
          label="Facet match"
          value={facetMatchMode}
          onChange={(event) => setFacetMatchMode(event.target.value as "any" | "all")}
          fullWidth
          sx={{ maxWidth: { md: 200 } }}
        >
          <MenuItem value="any">Any value (OR)</MenuItem>
          <MenuItem value="all">All values (AND)</MenuItem>
        </MuiTextField>
        <Button variant="outlined" onClick={addVariantsFromFacetValues} disabled={submitting}>
          Add facet variants
        </Button>
      </Stack>

      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <Button
          variant="text"
          onClick={addAssortedVariantsToSelection}
          disabled={!assortedVariantIds.length}
        >
          Add current assortment ({assortedVariantIds.length}/{assortedVariantTotal}) to selection
        </Button>
        {assortmentHasMore && (
          <Button variant="text" onClick={loadMoreAssorted} disabled={loadingAssortments}>
            {loadingAssortments ? "Loading..." : `Load more (${ASSORTMENT_PAGE_SIZE})`}
          </Button>
        )}
        {loadingAssortments && !assortmentHasMore && (
          <Typography variant="body2">Loading current assortment...</Typography>
        )}
      </Stack>

      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 3 }}>
        <MuiTextField
          label="Lookup by barcode"
          value={barcodeSearch}
          onChange={(event) => setBarcodeSearch(event.target.value)}
          fullWidth
        />
        <Button variant="outlined" onClick={lookupBarcode} disabled={loadingSearch}>
          {loadingSearch ? "Searching..." : "Search"}
        </Button>
      </Stack>

      {searchResults.length > 0 && (
        <Stack spacing={1} sx={{ marginTop: 2 }}>
          {searchResults.map((variant) => (
            <Stack key={variant.id} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">
                {variant.id} {variant.barcode ? `- ${variant.barcode}` : ""}{" "}
                {variant.size ? `- ${variant.size}` : ""} {variant.unit ? variant.unit : ""}
              </Typography>
              <Button size="small" onClick={() => addVariantId(variant.id)}>
                Add
              </Button>
            </Stack>
          ))}
        </Stack>
      )}

      {selectedVariantIds.length > 0 && (
        <Stack spacing={1} sx={{ marginTop: 2 }}>
          <Typography variant="subtitle2">Selected variants ({selectedVariantIds.length})</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selectedVariantIds.map((variantId) => (
              <Chip key={variantId} label={variantId} onDelete={() => removeVariantId(variantId)} />
            ))}
          </Stack>
        </Stack>
      )}

      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 3 }}>
        <Button
          variant="contained"
          onClick={() => runAssortment("publish")}
          disabled={submitting}
        >
          Publish to subsidiary
        </Button>
        <Button
          variant="outlined"
          onClick={() => runAssortment("withdraw")}
          disabled={submitting}
        >
          Withdraw from subsidiary
        </Button>
      </Stack>
    </Box>
  );
}
