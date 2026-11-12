'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { Button } from '../primitives/Button.js';

export type MapConfiguration = {
  urlTemplate: string;
  attributionText: string;
  attributionUrl: string;
  maxZoom: number;
};
export type MapMarker = { id: string; lat: number; lng: number; label: string };

export function MapView({
  config, markers, selectedId, onSelect, position, labels,
}: {
  config: MapConfiguration;
  markers: readonly MapMarker[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
  position?: { lat: number; lng: number } | null | undefined;
  labels: { map: string; loading: string; failed: string; retry: string; privacy: string; zoomIn: string; zoomOut: string };
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const extent = useRef<{ markers: readonly MapMarker[]; position: typeof position } | null>(null);
  const select = useRef(onSelect);
  useEffect(() => { select.current = onSelect; }, [onSelect]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    setState('loading');
    void import('leaflet').then((L) => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, {
        attributionControl: false, scrollWheelZoom: false, zoomControl: false,
        zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
      });
      map.current = instance;
      extent.current = null;
      L.control.zoom({ zoomInTitle: labels.zoomIn, zoomOutTitle: labels.zoomOut }).addTo(instance);
      L.tileLayer(config.urlTemplate, {
        maxZoom: config.maxZoom, keepBuffer: 0, updateWhenIdle: true,
        crossOrigin: false, referrerPolicy: 'strict-origin-when-cross-origin',
      }).on('tileerror', () => setState('failed')).addTo(instance);
      resize = new ResizeObserver(() => instance.invalidateSize({ animate: false }));
      resize.observe(container.current);
      setState('ready');
    }).catch(() => { if (!disposed) setState('failed'); });
    return () => {
      disposed = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, [config.urlTemplate, config.maxZoom, attempt, labels.zoomIn, labels.zoomOut]);

  useEffect(() => {
    if (state !== 'ready' || !map.current) return;
    let disposed = false;
    let remove: (() => void) | undefined;
    void import('leaflet').then((L) => {
      const instance = map.current;
      if (disposed || !instance) return;
      const layer = L.layerGroup().addTo(instance);
      const points: [number, number][] = [];
      const styles = getComputedStyle(container.current!);
      const primary = styles.getPropertyValue('--at-primary').trim();
      for (const marker of markers) {
        const point: [number, number] = [marker.lat, marker.lng];
        points.push(point);
        const label = document.createElement('span');
        label.textContent = marker.label;
        L.circleMarker(point, {
          radius: selectedId === marker.id ? 11 : 7,
          color: primary, fillColor: primary, fillOpacity: 0.85,
        }).bindTooltip(label).on('click', () => select.current(marker.id)).addTo(layer);
      }
      if (position) {
        const point: [number, number] = [position.lat, position.lng];
        points.push(point);
        L.circleMarker(point, { radius: 5, color: primary }).addTo(layer);
      }
      if (points.length && (extent.current?.markers !== markers || extent.current.position !== position)) {
        instance.fitBounds(points, { padding: [24, 24], maxZoom: Math.min(15, config.maxZoom), animate: false });
        extent.current = { markers, position };
      }
      remove = () => layer.remove();
    }).catch(() => { if (!disposed) setState('failed'); });
    return () => { disposed = true; remove?.(); };
  }, [markers, position, selectedId, state, attempt, config.maxZoom]);

  return (
    <section aria-label={labels.map} className="grid gap-2">
      <p className="text-small text-muted">{labels.privacy}</p>
      <div ref={container} aria-label={labels.map} className="relative z-0 h-80 w-full rounded-md border border-border bg-surface-2" />
      {state === 'loading' && <p role="status">{labels.loading}</p>}
      {state === 'failed' && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-error">
          <p>{labels.failed}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>{labels.retry}</Button>
        </div>
      )}
      <p className="text-small text-text-2">
        <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="underline">Leaflet</a>
        {' · © '}
        <a href={config.attributionUrl} target="_blank" rel="noopener noreferrer" className="underline">{config.attributionText}</a>
      </p>
    </section>
  );
}
