---
name: geo-zones-delivery-fees
description: "Recipe for shared Leaflet/OSM maps, Geoman Free zone editing, delivery fee slabs and authoritative geo calculations."
---

# Geo zones and delivery fees

Covers SA4, CK3/CK5, RD6 (`domain-accounts-admin.instructions.md`,
`domain-delivery-riders.instructions.md`).
Map library, tile configuration and usage limits are fixed by the
[Leaflet/OSM contract](../../../specs/_foundation/media-and-maps.md#leaflet-and-openstreetmap).

## Steps

1. Model a city as having zones; each zone has a polygon (for
   map/eligibility checks) and a fee-slab table (distance/weight bands
   -> fee), owned by the `geo` module.
2. `cart-checkout` resolves a delivery address to a zone (point-in-
   polygon) to check delivery eligibility (CK5) and compute the fee
   from that zone's slab — never hard-code or let the client supply a
   fee.
3. `delivery`/`settings` compute rider earning (per-ride base + per-km)
   from the current global settings at job-completion time, and persist
   the computed value so later settings changes don't retroactively
   change historical earnings (`domain-delivery-riders.instructions.md`).
4. Super admin city/zone screens (SA4): enable/disable a city requires
   a confirmation naming the impact (active orders/riders); the polygon
   editor uses shared client-only Leaflet with Geoman Free. Convert to
   GeoJSON `[longitude,latitude]`; PostGIS validates polygons. Keep
   keyboard/coordinate/list alternatives, OSM attribution, safe popups
   and HTTP tile caching; no offline tile downloads or paid plugin features.
5. Manually verify (`verify-change`; no automated test files): address inside/outside a zone, address outside all zones
   ("We are not in your city yet" + notify-me, LC5), fee slab boundary
   values, earning calculation stability after a settings change.

## Skeleton

```ts
async function resolveDeliveryFee(address: LatLng, shopId: string): Promise<DeliveryFeeResult> {
  const zone = await geo.findZoneContaining(address);
  if (!zone) return { eligible: false, reason: 'OUTSIDE_SERVICE_AREA' };
  const distanceKm = await geo.distanceFromShop(shopId, address);
  const fee = zone.feeSlabs.resolve(distanceKm);
  return { eligible: true, feePaise: fee };
}
```

## Checklist

- [ ] Delivery fee always server-computed from the zone's slab.
- [ ] Rider earning persisted at completion time, stable against later
  settings changes.
- [ ] Outside-service-area state shown clearly with a notify-me option.
- [ ] City/zone changes require impact-aware confirmation.
- [ ] One Leaflet MapView, policy-compliant tiles and usable failure fallback.
- [ ] React Query owns API state; no implicit geocoding/routing provider.
