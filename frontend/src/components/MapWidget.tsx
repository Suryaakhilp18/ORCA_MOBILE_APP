import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { MapWidgetT } from "@/src/api";
import { useApp } from "@/src/context/AppContext";
import { colors, fonts, radius, spacing } from "@/src/theme";

export type MapStyleMode = "osm" | "dark" | "satellite" | "topo";

function getTileLayerConfig(mode: MapStyleMode): { url: string; attrib: string } {
  switch (mode) {
    case "dark":
      return {
        url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        attrib: "&copy; OpenStreetMap contributors &copy; CARTO",
      };
    case "satellite":
      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attrib: "&copy; Esri &copy; OpenStreetMap contributors",
      };
    case "topo":
      return {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attrib: "&copy; OpenStreetMap contributors, SRTM",
      };
    case "osm":
    default:
      // Direct OpenStreetMap tile layer — 100% Free, NO API KEY NEEDED
      return {
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attrib: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
      };
  }
}

function buildHtml(widget: MapWidgetT, mapMode: MapStyleMode = "osm", isDark = true) {
  const w = JSON.stringify(widget);
  const tileConfig = getTileLayerConfig(mapMode);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: ${isDark ? "#111417" : "#F8FAFC"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #map {
      position: absolute;
      inset: 0;
      height: 100%;
      width: 100%;
      background: ${isDark ? "#111417" : "#F8FAFC"};
    }
    
    /* Leaflet Popup Styling */
    .leaflet-popup-content-wrapper {
      background: ${isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF"};
      color: ${isDark ? "#FFFFFF" : "#0F172A"};
      border: 1px solid ${isDark ? "rgba(31, 166, 160, 0.6)" : "rgba(13, 148, 136, 0.4)"};
      border-radius: 8px;
      box-shadow: 0 4px 18px ${isDark ? "rgba(0,0,0,0.8)" : "rgba(15, 23, 42, 0.15)"};
      padding: 2px 4px;
      max-width: 240px;
    }
    .leaflet-popup-tip {
      background: ${isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF"};
    }
    .leaflet-popup-content {
      margin: 8px 12px;
      font-size: 11px;
      line-height: 15px;
    }
    .popup-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popup-header {
      font-weight: 800;
      font-size: 13px;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"};
    }
    .popup-header.fleet { color: #10B981; }
    .popup-header.pfz-rec { color: #F59E0B; }
    .popup-header.pfz { color: #0284C7; }
    .popup-meta-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 10.5px;
      line-height: 14px;
    }
    .popup-meta-row span {
      color: ${isDark ? "#94A3B8" : "#64748B"};
      font-weight: 600;
    }
    .popup-meta-row b {
      color: ${isDark ? "#F1F5F9" : "#0F172A"};
      font-weight: 700;
    }

    /* Tactical Custom Marker Styles */
    .tactical-marker-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      pointer-events: auto;
      cursor: pointer;
      transform: translate3d(0,0,0);
    }
    .tactical-bubble {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      border: 2.5px solid #FFFFFF;
      position: relative;
      flex-shrink: 0;
      box-sizing: border-box;
    }
    .bubble-fleet {
      background: #059669;
      box-shadow: 0 0 16px #10B981, 0 2px 8px rgba(0,0,0,0.6);
      color: #FFFFFF;
    }
    .bubble-fleet::after {
      content: '';
      position: absolute;
      top: -6px; left: -6px; right: -6px; bottom: -6px;
      border-radius: 50%;
      border: 1.5px solid #34D399;
      animation: sonar-radar 2.2s infinite;
    }
    @keyframes sonar-radar {
      0% { transform: scale(0.9); opacity: 1; }
      100% { transform: scale(1.65); opacity: 0; }
    }

    .bubble-pfz-rec {
      width: 34px;
      height: 34px;
      background: #D97706;
      box-shadow: 0 0 20px #F59E0B, 0 2px 8px rgba(0,0,0,0.6);
      color: #FFFFFF;
      font-weight: 900;
    }
    .bubble-pfz-rec::after {
      content: '';
      position: absolute;
      top: -6px; left: -6px; right: -6px; bottom: -6px;
      border-radius: 50%;
      border: 2px solid #FCD34D;
      animation: gold-pulse 1.8s infinite;
    }
    @keyframes gold-pulse {
      0% { transform: scale(0.95); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.35; }
      100% { transform: scale(0.95); opacity: 1; }
    }

    .bubble-pfz {
      background: #0284C7;
      box-shadow: 0 0 16px #38BDF8, 0 2px 8px rgba(0,0,0,0.5);
      color: #FFFFFF;
    }
    .bubble-pfz::after {
      content: '';
      position: absolute;
      top: -5px; left: -5px; right: -5px; bottom: -5px;
      border-radius: 50%;
      border: 1.5px solid #7DD3FC;
      animation: cyan-pulse 2s infinite;
    }
    @keyframes cyan-pulse {
      0% { transform: scale(0.95); opacity: 0.9; }
      50% { transform: scale(1.35); opacity: 0.25; }
      100% { transform: scale(0.95); opacity: 0.9; }
    }

    .bubble-start {
      background: #0D9488;
      box-shadow: 0 0 14px #14B8A6;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 900;
    }
    .bubble-dest {
      background: #10B981;
      box-shadow: 0 0 16px #34D399;
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 900;
    }
    .bubble-user {
      background: #00F0FF;
      box-shadow: 0 0 14px #00F0FF;
      color: #030712;
      font-size: 13px;
      font-weight: 900;
    }
    .bubble-danger {
      background: #EF4444;
      box-shadow: 0 0 14px #EF4444;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 900;
      border-radius: 6px;
    }

    /* Waypoint Dots */
    .pin-wp-safe {
      width: 12px;
      height: 12px;
      background: #10B981;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 8px #10B981;
    }
    .pin-wp-unsafe {
      width: 14px;
      height: 14px;
      background: #EF4444;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 10px #EF4444;
      animation: pulse-red 1.5s infinite;
    }
    @keyframes pulse-red {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Tactical Callout Chip Attached to Marker */
    .tactical-chip {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.2px;
      white-space: nowrap;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      line-height: 13px;
    }
    .tactical-chip-dark {
      background: rgba(11, 19, 29, 0.92);
      color: #FFFFFF;
      border: 1px solid rgba(0, 240, 255, 0.45);
      box-shadow: 0 2px 10px rgba(0,0,0,0.8);
    }
    .tactical-chip-light {
      background: #FFFFFF;
      color: #0F172A;
      border: 1.5px solid #0D9488;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.18);
    }
    .chip-title {
      font-weight: 800;
      font-size: 10.5px;
    }
    .chip-sub {
      font-size: 9px;
      font-weight: 600;
      opacity: 0.85;
      margin-top: 1px;
    }

    /* Tactical Map Legend */
    .tactical-legend {
      position: absolute;
      bottom: 12px;
      left: 12px;
      z-index: 1000;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      pointer-events: none;
      line-height: 14px;
    }
    .legend-dark {
      background: rgba(11, 19, 29, 0.9);
      border: 1px solid rgba(31, 166, 160, 0.4);
      color: #E2E8F0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
    }
    .legend-light {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(13, 148, 136, 0.35);
      color: #0F172A;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
    }
    .legend-header {
      font-size: 9px;
      letter-spacing: 0.6px;
      color: #0D9488;
      margin-bottom: 3px;
      text-transform: uppercase;
      font-weight: 900;
    }
    .legend-row {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 2px;
    }
    .legend-dot {
      font-size: 11px;
      width: 14px;
      text-align: center;
    }

    /* Tile filter for Dark mode when using OSM */
    .dark-tile-filter {
      filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="tactical-legend ${isDark ? 'legend-dark' : 'legend-light'}">
    <div class="legend-header">ORCA TACTICAL ECDIS</div>
    <div class="legend-row"><span class="legend-dot" style="color:#10B981">⛵</span> Active Fleet (AIS)</div>
    <div class="legend-row"><span class="legend-dot" style="color:#F59E0B">★</span> Best Catch (PFZ)</div>
    <div class="legend-row"><span class="legend-dot" style="color:#0284C7">🐟</span> PFZ Hotspot</div>
    <div class="legend-row"><span class="legend-dot" style="color:#0D9488">⚓</span> Port / Fairway</div>
    <div class="legend-row"><span class="legend-dot" style="color:#EF4444">⚠️</span> Restricted Zone</div>
  </div>
  <script>
    (function(){
      try {
        var w = ${w};
        var center = w.center || { lat: 17.68, lon: 83.21 };
        
        // Initialize the Leaflet map container directly
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([center.lat, center.lon], 9);

        // Add OpenStreetMap tile layer directly (No key needed)
        var tileLayer = L.tileLayer('${tileConfig.url}', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '${tileConfig.attrib}'
        }).addTo(map);

        var bounds = L.latLngBounds();
        var hasBounds = false;

        // Custom div icon helper
        function makeIcon(className, html) {
          return L.divIcon({
            className: className,
            html: html || '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -11]
          });
        }

        function makeTacticalIcon(kind, iconChar, title, sub) {
          var isDark = ${isDark ? "true" : "false"};
          var chipClass = isDark ? 'tactical-chip-dark' : 'tactical-chip-light';
          var bubbleClass = 'bubble-' + kind;

          var safeTitle = (title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          var safeSub = (sub || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

          var html = '<div class="tactical-marker-box marker-' + kind + '">' +
            '<div class="tactical-bubble ' + bubbleClass + '">' + iconChar + '</div>' +
            (safeTitle ? '<div class="tactical-chip ' + chipClass + '">' +
              '<span class="chip-title">' + safeTitle + '</span>' +
              (safeSub ? '<span class="chip-sub">' + safeSub + '</span>' : '') +
            '</div>' : '') +
            '</div>';

          return L.divIcon({
            className: 'custom-tactical-div',
            html: html,
            iconSize: null,
            iconAnchor: [16, 16],
            popupAnchor: [0, -20]
          });
        }

        // Layer groups
        var routeGroup = L.layerGroup().addTo(map);
        var markerGroup = L.layerGroup().addTo(map);
        var geofenceGroup = L.layerGroup().addTo(map);

        // Draw Markers
        (w.markers || []).forEach(function(m) {
          if (!m || typeof m.lat !== 'number' || typeof m.lon !== 'number') return;
          var latLng = [m.lat, m.lon];
          bounds.extend(latLng);
          hasBounds = true;

          var icon;
          var popupContent = '';

          if (m.kind === 'route_start') {
            icon = makeTacticalIcon('start', '⚑', m.name || m.label || 'Departure', 'Departure Port');
            popupContent = '<div class="popup-card"><div class="popup-header">⚑ ' + (m.name || m.label || 'Departure Port') + '</div><div class="popup-meta-row"><span>STATUS:</span> <b style="color:#10B981">Origin Fairway</b></div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          } else if (m.kind === 'route_end') {
            icon = makeTacticalIcon('dest', '⚓', m.name || m.label || 'Destination', 'Destination Port');
            popupContent = '<div class="popup-card"><div class="popup-header">⚓ ' + (m.name || m.label || 'Destination Port') + '</div><div class="popup-meta-row"><span>STATUS:</span> <b style="color:#10B981">Arrival Fairway</b></div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          } else if (m.kind === 'route_unsafe') {
            icon = makeIcon('pin-wp-unsafe', '');
            popupContent = '<div class="popup-card"><div class="popup-header" style="color:#EF4444">⚠️ RESTRICTED CHECKPOINT</div><div class="popup-meta-row"><span>HAZARD:</span> <b style="color:#EF4444">' + (m.label || 'Restricted Marine Zone') + '</b></div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          } else if (m.kind === 'route_safe') {
            icon = makeIcon('pin-wp-safe', '');
            popupContent = '<div class="popup-card"><div class="popup-header" style="color:#10B981">SAFE WAYPOINT</div><div class="popup-meta-row"><span>STATUS:</span> <b>Deep Water Fairway</b></div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          } else if (m.kind === 'pfz_recommended') {
            var recTitle = m.name || 'Recommended PFZ';
            var recSub = (m.species ? m.species : 'Tuna, Mackerel') + (m.depth_m ? ' • ' + m.depth_m + 'm' : '');
            icon = makeTacticalIcon('pfz-rec', '★', '★ ' + recTitle, recSub);
            popupContent = '<div class="popup-card">' +
              '<div class="popup-header pfz-rec">★ BEST CATCH: ' + recTitle + '</div>' +
              '<div class="popup-meta-row"><span>TARGET SPECIES:</span> <b style="color:#F59E0B">' + (m.species || 'Tuna, Seer, Mackerel') + '</b></div>' +
              '<div class="popup-meta-row"><span>SHELF DEPTH:</span> <b>' + (m.depth_m ? m.depth_m + ' m' : '35 m') + '</b></div>' +
              '<div class="popup-meta-row"><span>WATER TEMP:</span> <b>' + (m.sst_c ? m.sst_c + ' °C' : '28.2 °C') + '</b></div>' +
              '<div class="popup-meta-row"><span>CHLOROPHYLL:</span> <b>' + (m.chl_mg_m3 || m.chl ? (m.chl_mg_m3 || m.chl) + ' mg/m³' : '2.1 mg/m³') + '</b></div>' +
              '<div class="popup-meta-row"><span>CONFIDENCE:</span> <b style="color:#10B981">' + (m.confidence ? m.confidence + '%' : '86% High') + '</b></div>' +
              (m.distance_km ? '<div class="popup-meta-row"><span>OFFSHORE:</span> <b>~' + m.distance_km + ' km</b></div>' : '') +
              '<div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div>' +
              '</div>';
          } else if (m.kind === 'pfz') {
            var pfzTitle = m.name || 'PFZ Hotspot';
            var pfzSub = (m.species ? m.species : 'Pelagic') + (m.depth_m ? ' • ' + m.depth_m + 'm' : '');
            icon = makeTacticalIcon('pfz', '🐟', pfzTitle, pfzSub);
            popupContent = '<div class="popup-card">' +
              '<div class="popup-header pfz">🐟 PFZ HOTSPOT: ' + pfzTitle + '</div>' +
              '<div class="popup-meta-row"><span>TARGET SPECIES:</span> <b>' + (m.species || 'Pelagic Fish') + '</b></div>' +
              '<div class="popup-meta-row"><span>SHELF DEPTH:</span> <b>' + (m.depth_m ? m.depth_m + ' m' : '40 m') + '</b></div>' +
              '<div class="popup-meta-row"><span>WATER TEMP:</span> <b>' + (m.sst_c ? m.sst_c + ' °C' : '28.0 °C') + '</b></div>' +
              '<div class="popup-meta-row"><span>CHLOROPHYLL:</span> <b>' + (m.chl_mg_m3 || m.chl ? (m.chl_mg_m3 || m.chl) + ' mg/m³' : '1.8 mg/m³') + '</b></div>' +
              '<div class="popup-meta-row"><span>CONFIDENCE:</span> <b style="color:#10B981">' + (m.confidence ? m.confidence + '%' : '75%') + '</b></div>' +
              (m.distance_km ? '<div class="popup-meta-row"><span>OFFSHORE:</span> <b>~' + m.distance_km + ' km</b></div>' : '') +
              '<div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div>' +
              '</div>';
          } else if (m.kind === 'fleet' || m.kind === 'vessel' || m.kind === 'fleet_vessel') {
            var vslTitle = m.name || m.label || 'Fleet Craft';
            var vslSub = (m.speed_kn != null ? m.speed_kn + ' kn' : '') + (m.vhf_channel || m.vhf ? ' • ' + (m.vhf_channel || m.vhf) : '');
            icon = makeTacticalIcon('fleet', '⛵', vslTitle, vslSub);
            popupContent = '<div class="popup-card">' +
              '<div class="popup-header fleet">⛵ ' + vslTitle + '</div>' +
              '<div class="popup-meta-row"><span>VESSEL TYPE:</span> <b>' + (m.type || 'Mechanised Craft') + '</b></div>' +
              '<div class="popup-meta-row"><span>AIS SPEED:</span> <b style="color:#10B981">' + (m.speed_kn != null ? m.speed_kn + ' kn' : '—') + '</b></div>' +
              '<div class="popup-meta-row"><span>STATUS:</span> <b>' + (m.status || 'Active Trawling') + '</b></div>' +
              '<div class="popup-meta-row"><span>RADIO VHF:</span> <b>' + (m.vhf_channel || m.vhf || 'Ch 16') + '</b></div>' +
              (m.crew ? '<div class="popup-meta-row"><span>CREW:</span> <b>' + m.crew + ' onboard</b></div>' : '') +
              '<div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div>' +
              '</div>';
          } else if (m.kind === 'user') {
            var userTitle = m.name || m.label || 'Base Harbor';
            icon = makeTacticalIcon('user', '⚓', userTitle, 'Operational Hub');
            popupContent = '<div class="popup-card"><div class="popup-header">' + userTitle + '</div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          } else if (m.kind === 'danger') {
            icon = makeTacticalIcon('danger', '!', m.label || 'Restricted Area', 'Hazard Warning');
            popupContent = '<div class="popup-card"><div class="popup-header" style="color:#EF4444">⚠️ ' + (m.label || 'Restricted Area') + '</div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          } else {
            icon = makeTacticalIcon('user', '●', m.label || 'Waypoint', '');
            popupContent = '<div class="popup-card"><div class="popup-header">' + (m.label || 'Waypoint') + '</div><div class="popup-meta-row"><span>COORDS:</span> <span>' + m.lat.toFixed(4) + '°N, ' + m.lon.toFixed(4) + '°E</span></div></div>';
          }

          var marker = L.marker(latLng, { icon: icon }).addTo(markerGroup);
          marker.bindPopup(popupContent);
        });

        // Draw Layers (Polygons, Boundaries, Route lines, Heatmap)
        (w.layers || []).forEach(function(l) {
          if (l.type === 'route_line' && l.segments) {
            l.segments.forEach(function(s) {
              if (!s.a || !s.b) return;
              var p1 = [s.a[1], s.a[0]];
              var p2 = [s.b[1], s.b[0]];
              bounds.extend(p1);
              bounds.extend(p2);
              hasBounds = true;

              var isSafe = !s.unsafe;
              var color = isSafe ? '#10B981' : '#EF4444';

              // 3-Layer Luminous Navigation Fairway
              // Layer 1: Outer Cyan/Red Halo
              L.polyline([p1, p2], {
                color: isSafe ? '#00F0FF' : '#EF4444',
                weight: 10,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(routeGroup);

              // Layer 2: Core Fairway Channel
              L.polyline([p1, p2], {
                color: color,
                weight: 4.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(routeGroup);

              // Layer 3: Navigational Directional Dash
              L.polyline([p1, p2], {
                color: '#FFFFFF',
                weight: 1.5,
                opacity: 0.9,
                dashArray: '6, 10'
              }).addTo(routeGroup);
            });
          } else if ((l.type === 'boundary' || l.type === 'polygon') && (l.features || l.coordinates)) {
            // Geofence / Sanctuary / MPA polygon
            var featureList = l.features || [{ geometry: { type: 'Polygon', coordinates: [l.coordinates] }, name: l.label, restricted: true }];
            featureList.forEach(function(f) {
              if (!f || !f.geometry || !f.geometry.coordinates) return;
              var coords = f.geometry.coordinates;
              var rings = (f.geometry.type === 'Polygon') ? [coords[0]] : (f.geometry.type === 'MultiPolygon' ? coords.map(function(c){ return c[0]; }) : []);
              rings.forEach(function(ring) {
                if (!ring || !ring.length) return;
                var polyCoords = ring.map(function(pt) {
                  return [pt[1], pt[0]];
                });
                polyCoords.forEach(function(pt) { bounds.extend(pt); hasBounds = true; });

                var isRestricted = f.restricted !== false;
                var polyColor = isRestricted ? '#EF4444' : '#00F0FF';
                var poly = L.polygon(polyCoords, {
                  color: polyColor,
                  weight: isRestricted ? 2 : 1.5,
                  fillColor: polyColor,
                  fillOpacity: isRestricted ? 0.22 : 0.08,
                  dashArray: isRestricted ? '4, 6' : '2, 4'
                }).addTo(geofenceGroup);

                var title = isRestricted ? '⚠️ RESTRICTED ZONE' : 'MARITIME BOUNDARY';
                var sub = (f.name ? '<b>' + f.name + '</b><br/>' : '') + (f.note || '');
                poly.bindPopup('<div class="popup-title">' + title + '</div><div class="popup-sub">' + sub + '</div>');
              });
            });
          } else if (l.type === 'heatmap' && l.grid) {
            l.grid.forEach(function(cell) {
              if (!cell || typeof cell.lat !== 'number' || typeof cell.lon !== 'number') return;
              var val = l.metric === 'chl' ? cell.chl : cell.sst;
              var color = l.metric === 'chl'
                ? (val > 0.45 ? '#10B981' : (val > 0.25 ? '#22C55E' : '#3B82F6'))
                : (val > 28.5 ? '#F59E0B' : '#06B6D4');
              var circle = L.circleMarker([cell.lat, cell.lon], {
                radius: 8,
                color: 'transparent',
                fillColor: color,
                fillOpacity: 0.4
              }).addTo(markerGroup);
              circle.bindPopup(
                '<div class="popup-title">' + (l.metric === 'chl' ? 'CHLOROPHYLL-A PRODUCTIVITY' : 'SEA SURFACE TEMP') + '</div>' +
                '<div class="popup-sub">Lat: ' + cell.lat.toFixed(2) + ', Lon: ' + cell.lon.toFixed(2) + '<br/>Value: ' + (val != null ? val.toFixed(2) : '—') + ' ' + (l.metric === 'chl' ? 'mg/m³' : '°C') + '</div>'
              );
            });
          }
        });

        // Fit map bounds smoothly
        if (hasBounds && (w.markers || []).length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        } else {
          map.setView([center.lat, center.lon], 10);
        }

        // Expose global controller for iframe / native bridge
        window.leafletBridge = {
          fitAll: function() {
            if (hasBounds) map.fitBounds(bounds, { padding: [35, 35] });
          },
          focusCoord: function(lat, lon) {
            map.flyTo([lat, lon], 12, { duration: 1 });
          },
          toggleGeofences: function(show) {
            if (show) map.addLayer(geofenceGroup);
            else map.removeLayer(geofenceGroup);
          }
        };

        // Post load ready
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }
      } catch(e) {
        console.error('Leaflet Map Init Error:', e);
      }
    })();
  </script>
</body>
</html>`;
}

export default function MapWidget({ widget }: { widget: MapWidgetT }) {
  const { isDark, colors } = useApp();
  const [fullscreen, setFullscreen] = useState(false);
  const [mapMode, setMapMode] = useState<MapStyleMode>("osm");
  const [showGeofences, setShowGeofences] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const routeInfo = widget.route_info;
  const isRoute = !!routeInfo;
  const hasGeofences = (widget.layers || []).some(
    (l) => l.type === "boundary" || l.type === "polygon"
  );
  const waypoints = (widget.markers || []).filter(
    (m) => m.kind === "route_start" || m.kind === "route_safe" || m.kind === "route_unsafe" || m.kind === "route_end"
  );
  const fleetMarkers = (widget.markers || []).filter(
    (m) => m.kind === "fleet" || m.kind === "vessel" || m.kind === "fleet_vessel"
  );
  const isFleet = fleetMarkers.length > 0;
  const pfzMarkers = (widget.markers || []).filter(
    (m) => m.kind === "pfz_recommended" || m.kind === "pfz"
  );
  const isPfz = pfzMarkers.length > 0;

  const htmlContent = buildHtml(widget, mapMode, isDark);

  const executeMapCmd = useCallback((jsCode: string) => {
    if (Platform.OS === "web") {
      try {
        if (iframeRef.current && (iframeRef.current as any).contentWindow) {
          (iframeRef.current as any).contentWindow.eval(jsCode);
        }
      } catch (err) {
        console.warn("Leaflet web eval error:", err);
      }
    } else {
      webViewRef.current?.injectJavaScript(jsCode + "; true;");
    }
  }, []);

  const handleFitRoute = useCallback(() => {
    executeMapCmd("window.leafletBridge && window.leafletBridge.fitAll()");
  }, [executeMapCmd]);

  const handleFocusWaypoint = useCallback((lat: number, lon: number, idx: number) => {
    setSelectedWaypointIndex(idx);
    executeMapCmd(`window.leafletBridge && window.leafletBridge.focusCoord(${lat}, ${lon})`);
  }, [executeMapCmd]);

  const handleToggleGeofences = useCallback(() => {
    const next = !showGeofences;
    setShowGeofences(next);
    executeMapCmd(`window.leafletBridge && window.leafletBridge.toggleGeofences(${next})`);
  }, [showGeofences, executeMapCmd]);

  const renderMapBody = (isModal: boolean) => (
    <View
      style={[
        styles.mapCanvasWrap,
        {
          backgroundColor: isDark ? "#111417" : "#FFFFFF",
          borderColor: isDark ? "rgba(31, 166, 160, 0.3)" : colors.borderStrong,
        },
        isModal && styles.modalCanvasWrap,
      ]}
    >
      {Platform.OS === "web" ? (
        <iframe
          ref={iframeRef as any}
          title="OpenStreetMap Leaflet Engine"
          srcDoc={htmlContent}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: isDark ? "#060A12" : "#F8FAFC",
          }}
          onLoad={() => setLoading(false)}
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          style={[styles.webView, { backgroundColor: isDark ? "#111417" : "#F8FAFC" }]}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
        />
      )}

      {loading && (
        <View style={[styles.loaderOverlay, { backgroundColor: isDark ? "rgba(17, 20, 23, 0.9)" : "rgba(248, 250, 252, 0.9)" }]}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={[styles.loaderText, { color: colors.brand }]}>INITIALIZING OPENSTREETMAP ECDIS...</Text>
        </View>
      )}

      {/* Tactical Quick Action Toolbar */}
      <View style={styles.toolbarOverlay}>
        {isRoute && (
          <Pressable
            onPress={handleFitRoute}
            style={[
              styles.toolBtn,
              {
                backgroundColor: isDark ? "rgba(24, 28, 32, 0.9)" : "#FFFFFF",
                borderColor: isDark ? "rgba(31, 166, 160, 0.35)" : colors.borderStrong,
              },
            ]}
            accessibilityLabel="Fit Route Corridor"
          >
            <Ionicons name="scan-outline" size={16} color={colors.brand} />
          </Pressable>
        )}
        {hasGeofences && (
          <Pressable
            onPress={handleToggleGeofences}
            style={[
              styles.toolBtn,
              {
                backgroundColor: isDark ? "rgba(24, 28, 32, 0.9)" : "#FFFFFF",
                borderColor: isDark ? "rgba(31, 166, 160, 0.35)" : colors.borderStrong,
              },
              showGeofences && styles.toolBtnActive,
            ]}
            accessibilityLabel="Toggle MPAs & Restricted Geofences"
          >
            <Ionicons
              name={showGeofences ? "shield-checkmark" : "shield-outline"}
              size={16}
              color={showGeofences ? colors.brand : colors.muted}
            />
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            const modes: MapStyleMode[] = ["osm", "dark", "satellite", "topo"];
            const next = modes[(modes.indexOf(mapMode) + 1) % modes.length];
            setMapMode(next);
          }}
          style={[
            styles.toolBtn,
            {
              backgroundColor: isDark ? "rgba(24, 28, 32, 0.9)" : "#FFFFFF",
              borderColor: isDark ? "rgba(31, 166, 160, 0.35)" : colors.borderStrong,
            },
          ]}
          accessibilityLabel="Switch Tile Style"
        >
          <Ionicons name="layers-outline" size={16} color={colors.brand} />
        </Pressable>
        <Pressable
          onPress={() => setFullscreen(!fullscreen)}
          style={[
            styles.toolBtn,
            {
              backgroundColor: isDark ? "rgba(24, 28, 32, 0.9)" : "#FFFFFF",
              borderColor: isDark ? "rgba(31, 166, 160, 0.35)" : colors.borderStrong,
            },
          ]}
          accessibilityLabel="Fullscreen"
        >
          <Ionicons
            name={isModal ? "contract" : "expand"}
            size={16}
            color={colors.brand}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 1. Tactical Marine HUD Cluster */}
      {isRoute && routeInfo && (
        <View
          style={[
            styles.hudCard,
            {
              backgroundColor: isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF",
              borderColor: isDark ? "rgba(31, 166, 160, 0.3)" : colors.borderStrong,
            },
          ]}
        >
          {/* Header row with un-truncated departure and destination */}
          <View
            style={[
              styles.hudHeaderRow,
              {
                borderBottomColor: isDark ? "rgba(31, 166, 160, 0.18)" : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.hudLiveBadge,
                {
                  backgroundColor: isDark ? "rgba(31, 166, 160, 0.15)" : "rgba(13, 148, 136, 0.1)",
                  borderColor: isDark ? "rgba(31, 166, 160, 0.35)" : colors.borderCyan,
                },
              ]}
            >
              <View style={[styles.pulseDot, { backgroundColor: colors.brand }]} />
              <Text style={[styles.hudLiveText, { color: colors.brand }]}>ECDIS TRACK</Text>
            </View>
            <Text style={[styles.hudTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {routeInfo.start_name || "Departure"} ➔ {routeInfo.end_name || "Destination"}
            </Text>
            <View
              style={[
                styles.hudStatusTag,
                {
                  backgroundColor:
                    (routeInfo.unsafe_count || 0) > 0
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(16, 185, 129, 0.15)",
                  borderColor:
                    (routeInfo.unsafe_count || 0) > 0
                      ? colors.neonRed
                      : colors.neonEmerald,
                },
              ]}
            >
              <Text
                style={[
                  styles.hudStatusText,
                  {
                    color:
                      (routeInfo.unsafe_count || 0) > 0
                        ? colors.neonRed
                        : colors.neonEmerald,
                  },
                ]}
              >
                {(routeInfo.unsafe_count || 0) > 0 ? "RESTRICTED" : "CLEAR"}
              </Text>
            </View>
          </View>

          {/* Instruments Grid */}
          <View style={styles.instrumentsGrid}>
            {/* Bearing & Compass Dial */}
            <View
              style={[
                styles.instrumentTile,
                {
                  backgroundColor: isDark ? "rgba(30, 36, 40, 0.7)" : colors.surfaceTertiary,
                  borderColor: isDark ? "rgba(31, 166, 160, 0.2)" : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.compassRose,
                  {
                    borderColor: isDark ? "rgba(31, 166, 160, 0.4)" : colors.borderCyan,
                  },
                ]}
              >
                <Ionicons
                  name="navigate"
                  size={15}
                  color={colors.brand}
                  style={{
                    transform: [{ rotate: `${(routeInfo.bearing_deg || 0) - 45}deg` }],
                  }}
                />
              </View>
              <View>
                <Text style={[styles.instrumentLabel, { color: colors.muted }]}>BEARING</Text>
                <Text style={[styles.instrumentValue, { color: colors.brand }]}>
                  {routeInfo.bearing_deg?.toFixed(1)}° {routeInfo.bearing_cardinal || ""}
                </Text>
              </View>
            </View>

            {/* Distance */}
            <View
              style={[
                styles.instrumentTile,
                {
                  backgroundColor: isDark ? "rgba(30, 36, 40, 0.7)" : colors.surfaceTertiary,
                  borderColor: isDark ? "rgba(31, 166, 160, 0.2)" : colors.border,
                },
              ]}
            >
              <Ionicons name="analytics-outline" size={16} color={colors.brand} />
              <View>
                <Text style={[styles.instrumentLabel, { color: colors.muted }]}>DISTANCE</Text>
                <Text style={[styles.instrumentValue, { color: colors.brand }]}>
                  {routeInfo.distance_nm?.toFixed(1)} NM
                </Text>
                <Text style={[styles.instrumentSub, { color: colors.muted }]}>
                  {routeInfo.distance_km?.toFixed(1)} km
                </Text>
              </View>
            </View>

            {/* Cruising Speed & Dynamic ETA */}
            <View
              style={[
                styles.instrumentTile,
                {
                  backgroundColor: isDark ? "rgba(30, 36, 40, 0.7)" : colors.surfaceTertiary,
                  borderColor: isDark ? "rgba(31, 166, 160, 0.2)" : colors.border,
                },
              ]}
            >
              <Ionicons name="timer-outline" size={16} color={colors.warning} />
              <View>
                <Text style={[styles.instrumentLabel, { color: colors.muted }]}>ETA @ 8 KTS</Text>
                <Text style={[styles.instrumentValue, { color: colors.warning }]}>
                  {routeInfo.eta_str || "--"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 2. Main Map View */}
      {renderMapBody(false)}

      {/* 3. Waypoint Passage Plan Accordion Drawer */}
      {isRoute && waypoints.length > 0 && (
        <View
          style={[
            styles.passagePlanCard,
            {
              backgroundColor: isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF",
              borderColor: isDark ? "rgba(31, 166, 160, 0.25)" : colors.borderStrong,
            },
          ]}
        >
          <Pressable
            onPress={() => setShowWaypoints(!showWaypoints)}
            style={[
              styles.passageHeader,
              {
                backgroundColor: isDark ? "rgba(30, 36, 40, 0.8)" : colors.surfaceTertiary,
              },
            ]}
          >
            <View style={styles.passageTitleRow}>
              <Ionicons name="git-commit-outline" size={16} color={colors.brand} />
              <Text style={[styles.passageTitle, { color: colors.brand }]}>
                PASSAGE PLAN ({waypoints.length} WAYPOINTS)
              </Text>
            </View>
            <Ionicons
              name={showWaypoints ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </Pressable>

          {showWaypoints && (
            <ScrollView
              style={styles.waypointList}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {waypoints.map((wp, idx) => {
                const isSelected = selectedWaypointIndex === idx;
                const isUnsafe = wp.kind === "route_unsafe";
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleFocusWaypoint(wp.lat, wp.lon, idx)}
                    style={[
                      styles.waypointItem,
                      {
                        borderBottomColor: isDark ? "rgba(255, 255, 255, 0.05)" : colors.border,
                      },
                      isSelected && [
                        styles.waypointItemSelected,
                        {
                          backgroundColor: isDark ? "rgba(0, 240, 255, 0.1)" : "rgba(13, 148, 136, 0.12)",
                        },
                      ],
                    ]}
                  >
                    <View
                      style={[
                        styles.wpDot,
                        {
                          backgroundColor: isUnsafe
                            ? colors.error
                            : idx === 0
                            ? colors.brand
                            : idx === waypoints.length - 1
                            ? colors.success
                            : colors.brand,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.wpLabel, { color: colors.onSurface }]} numberOfLines={1}>
                        {idx === 0
                          ? `WP 0 (START): ${wp.label || "Departure"}`
                          : idx === waypoints.length - 1
                          ? `WP ${idx} (DEST): ${wp.label || "Destination"}`
                          : `WP ${idx}: ${wp.label || "Seaward Waypoint"}`}
                      </Text>
                      <Text style={[styles.wpCoords, { color: colors.muted }]}>
                        {wp.lat.toFixed(4)}°N, {wp.lon.toFixed(4)}°E
                      </Text>
                    </View>
                    <Ionicons
                      name="locate-outline"
                      size={14}
                      color={isSelected ? colors.brand : colors.muted}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* 4. Active Fleet Operations Horizontal Radar Drawer */}
      {isFleet && (
        <View
          style={[
            styles.hudCard,
            {
              backgroundColor: isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF",
              borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.4)",
              marginTop: spacing.xs,
            },
          ]}
        >
          <View style={styles.hudHeaderRow}>
            <View
              style={[
                styles.hudLiveBadge,
                {
                  backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
                  borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : "#10B981",
                },
              ]}
            >
              <View style={[styles.pulseDot, { backgroundColor: "#10B981" }]} />
              <Text style={[styles.hudLiveText, { color: "#10B981" }]}>ACTIVE AIS RADAR</Text>
            </View>
            <Text style={[styles.hudTitle, { color: colors.onSurface }]} numberOfLines={1}>
              Fleet Operations • {widget.fleet_info?.sector || "Coastal"} ({fleetMarkers.length} Craft)
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {fleetMarkers.map((v, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleFocusWaypoint(v.lat, v.lon, idx)}
                style={[
                  styles.vesselCard,
                  {
                    backgroundColor: isDark ? "rgba(30, 36, 40, 0.8)" : colors.surfaceTertiary,
                    borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : colors.borderStrong,
                  },
                ]}
              >
                <View style={styles.vesselHeaderRow}>
                  <Text style={[styles.vesselName, { color: colors.onSurface }]} numberOfLines={1}>
                    ⛵ {v.name || v.label}
                  </Text>
                  <View style={[styles.speedBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "800" }}>
                      {v.speed_kn != null ? `${v.speed_kn} kn` : "AIS"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.vesselSub, { color: colors.muted }]} numberOfLines={1}>
                  {v.type || "Fishing Vessel"} • {v.status || "Active"}
                </Text>
                <View style={styles.vesselFooterRow}>
                  <Text style={[styles.vesselRadio, { color: colors.brand }]}>
                    📻 {v.vhf_channel || v.vhf || "Ch 16"}
                  </Text>
                  <View style={styles.locateBtn}>
                    <Ionicons name="locate" size={13} color={colors.brand} />
                    <Text style={{ color: colors.brand, fontSize: 10, fontWeight: "700" }}>Locate</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5. Potential Fishing Zones (PFZ) Advisory Radar Drawer */}
      {isPfz && (
        <View
          style={[
            styles.hudCard,
            {
              backgroundColor: isDark ? "rgba(24, 28, 32, 0.95)" : "#FFFFFF",
              borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.4)",
              marginTop: spacing.xs,
            },
          ]}
        >
          <View style={styles.hudHeaderRow}>
            <View
              style={[
                styles.hudLiveBadge,
                {
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)",
                  borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "#F59E0B",
                },
              ]}
            >
              <View style={[styles.pulseDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={[styles.hudLiveText, { color: "#F59E0B" }]}>PFZ ADVISORY</Text>
            </View>
            <Text style={[styles.hudTitle, { color: colors.onSurface }]} numberOfLines={1}>
              INCOIS Fishing Hotspots ({pfzMarkers.length} Zones)
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {pfzMarkers.map((z, idx) => {
              const isBest = z.kind === "pfz_recommended";
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleFocusWaypoint(z.lat, z.lon, idx)}
                  style={[
                    styles.vesselCard,
                    {
                      backgroundColor: isDark ? "rgba(30, 36, 40, 0.8)" : colors.surfaceTertiary,
                      borderColor: isBest ? "#F59E0B" : (isDark ? "rgba(56, 189, 248, 0.3)" : colors.borderStrong),
                      minWidth: 190,
                    },
                  ]}
                >
                  <View style={styles.vesselHeaderRow}>
                    <Text style={[styles.vesselName, { color: colors.onSurface }]} numberOfLines={1}>
                      {isBest ? "★ " : "🐟 "}{z.name || z.label}
                    </Text>
                    <View style={[styles.speedBadge, { backgroundColor: isBest ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.15)" }]}>
                      <Text style={{ color: isBest ? "#F59E0B" : "#0284C7", fontSize: 9.5, fontWeight: "800" }}>
                        {isBest ? "BEST CATCH" : "HOTSPOT"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.vesselSub, { color: colors.onSurface, fontWeight: "700" }]} numberOfLines={1}>
                    {z.species || "Pelagic species"}
                  </Text>
                  <View style={styles.vesselFooterRow}>
                    <Text style={[styles.vesselRadio, { color: colors.muted, fontSize: 10 }]}>
                      Depth: {z.depth_m ? `${z.depth_m}m` : "35m"} • {z.sst_c ? `${z.sst_c}°C` : "28°C"}
                    </Text>
                    <View style={styles.locateBtn}>
                      <Ionicons name="navigate-circle" size={14} color={isBest ? "#F59E0B" : colors.brand} />
                      <Text style={{ color: isBest ? "#F59E0B" : colors.brand, fontSize: 10, fontWeight: "700" }}>Target</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 6. Fullscreen Modal */}
      <Modal visible={fullscreen} animationType="slide" onRequestClose={() => setFullscreen(false)}>
        <View style={[styles.modalRoot, { backgroundColor: isDark ? "#060A12" : "#F0F4F8" }]}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: isDark ? "#09121F" : "#FFFFFF",
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalTitleRow}>
              <View style={[styles.pulseDot, { backgroundColor: colors.brand }]} />
              <Text style={[styles.modalTitle, { color: colors.brand }]}>ORCA ECDIS TACTICAL PLOTTER</Text>
            </View>
            <Pressable
              onPress={() => setFullscreen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
          {renderMapBody(true)}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: spacing.sm,
  },
  mapCanvasWrap: {
    width: "100%",
    height: 290,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.3)",
    backgroundColor: "#111417",
    position: "relative",
  },
  modalCanvasWrap: {
    flex: 1,
    height: "100%",
    borderRadius: 0,
    borderWidth: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: "#111417",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 20, 23, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "700",
    color: colors.brand,
    letterSpacing: 1,
  },
  toolbarOverlay: {
    position: "absolute",
    right: 10,
    top: 10,
    gap: 6,
    zIndex: 99,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(24, 28, 32, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnActive: {
    backgroundColor: "rgba(0, 240, 255, 0.2)",
    borderColor: colors.neonCyan,
  },
  hudCard: {
    backgroundColor: "rgba(24, 28, 32, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.3)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  hudHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 166, 160, 0.18)",
    paddingBottom: 6,
  },
  hudLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 166, 160, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.35)",
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
  },
  hudLiveText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "800",
    color: colors.neonCyan,
    letterSpacing: 1,
  },
  hudTitle: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
  },
  hudStatusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  hudStatusText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  instrumentsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  instrumentTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 36, 40, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.2)",
    borderRadius: radius.sm,
    padding: 6,
    gap: 6,
  },
  compassRose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  instrumentLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.5,
  },
  instrumentValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "800",
    color: colors.brand,
  },
  instrumentSub: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.onSurfaceTertiary,
  },
  passagePlanCard: {
    backgroundColor: "rgba(24, 28, 32, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(31, 166, 160, 0.25)",
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  passageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    backgroundColor: "rgba(30, 36, 40, 0.8)",
  },
  passageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passageTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: 1,
  },
  waypointList: {
    maxHeight: 180,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  waypointItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  waypointItemSelected: {
    backgroundColor: "rgba(0, 240, 255, 0.1)",
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  wpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wpLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurface,
  },
  wpCoords: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.onSurfaceSecondary,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "#060A12",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "#09121F",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 240, 255, 0.3)",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: "800",
    color: colors.neonCyan,
    letterSpacing: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  vesselCard: {
    width: 210,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
  },
  vesselHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  vesselName: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "800",
    flex: 1,
  },
  speedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vesselSub: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
  },
  vesselFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  vesselRadio: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "700",
  },
  locateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "rgba(31, 166, 160, 0.12)",
  },
});
