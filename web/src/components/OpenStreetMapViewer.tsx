'use client';

import React from 'react';

interface OpenStreetMapViewerProps {
  pickupLat?: number;
  pickupLng?: number;
  pickupLabel?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  dropoffLabel?: string;
  className?: string;
}

export const OpenStreetMapViewer: React.FC<OpenStreetMapViewerProps> = ({
  pickupLat = 51.5074,
  pickupLng = -0.1278,
  pickupLabel = 'Pickup',
  dropoffLat,
  dropoffLng,
  dropoffLabel = 'Drop-off',
  className = '',
}) => {
  // Center between pickup and dropoff if both available, otherwise default to London Central
  const centerLat = dropoffLat ? (pickupLat + dropoffLat) / 2 : pickupLat;
  const centerLng = dropoffLng ? (pickupLng + dropoffLng) / 2 : pickupLng;

  // Compute a bounding box around points for Leaflet/OSM embed
  const delta = 0.04;
  const minLng = (centerLng - delta).toFixed(4);
  const minLat = (centerLat - delta).toFixed(4);
  const maxLng = (centerLng + delta).toFixed(4);
  const maxLat = (centerLat + delta).toFixed(4);

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${centerLat}%2C${centerLng}`;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 ${className}`}>
      {/* Native OpenStreetMap Iframe */}
      <iframe
        title="OpenStreetMap Location Viewer"
        src={osmEmbedUrl}
        className="w-full h-full min-h-[220px] rounded-2xl border-0"
        loading="lazy"
        scrolling="no"
      />

      {/* Floating Info Overlay */}
      <div className="absolute bottom-2 left-2 right-2 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between text-[11px] shadow-lg">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-white font-medium truncate">
            {pickupLabel} {dropoffLabel ? `➔ ${dropoffLabel}` : ''}
          </span>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=13/${centerLat}/${centerLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 font-bold shrink-0 ml-2"
        >
          View Full OSM ↗
        </a>
      </div>
    </div>
  );
};
