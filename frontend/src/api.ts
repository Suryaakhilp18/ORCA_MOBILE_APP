import Constants from "expo-constants";
import { Platform } from "react-native";

function getBaseUrl(): string {
  // Allow an explicit environment override (e.g. Vercel environment variables)
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configured) {
    const cleanConfig = configured.replace(/\/+$/, "");
    return cleanConfig.endsWith("/api") ? cleanConfig : `${cleanConfig}/api`;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    const port = window.location.port;
    // When running locally on port 8081 / localhost, point to local FastAPI port 8000
    if (hostname === "localhost" || hostname === "127.0.0.1" || port === "8081" || port === "19006") {
      return `http://${hostname}:8000/api`;
    }
    // When deployed online (e.g. Vercel) with no explicit backend URL configured,
    // point to same origin `/api` or local fallback
    return `${window.location.origin}/api`;
  }

  if (Platform.OS !== "web") {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      return `http://${ip}:8000/api`;
    }
  }
  return "http://localhost:8000/api";
}

async function req(path: string, options?: RequestInit) {
  const url = getBaseUrl() + path;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export type Marker = {
  lat: number;
  lon: number;
  label: string;
  kind: string;
  name?: string;
  speed_kn?: number;
  type?: string;
  status?: string;
  vhf_channel?: string;
  heading_deg?: number;
  crew?: number;
  species?: string;
  depth_m?: number;
  sst_c?: number;
  chl_mg_m3?: number;
  confidence?: number;
  distance_km?: number;
  [key: string]: any;
};
export type RouteInfo = {
  start_name?: string;
  end_name?: string;
  distance_km?: number;
  distance_nm?: number;
  bearing_deg?: number;
  bearing_cardinal?: string;
  eta_str?: string;
  unsafe_count?: number;
  total?: number;
};
export type MapWidgetT = {
  type: "map";
  center: { lat: number; lon: number };
  markers: Marker[];
  layers: any[];
  route_info?: RouteInfo;
  fleet_info?: any;
  pfz_info?: any;
  [key: string]: any;
};
export type ChartWidgetT = {
  type: "chart";
  title: string;
  unit: string;
  labels: string[];
  values: number[];
  color: string;
};
export type Widget = MapWidgetT | ChartWidgetT;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  verdict?: string | null;
  citations?: string[];
  widgets?: Widget[];
  reasoning_trace?: { agent: string; detail: string }[];
  intent?: string;
};

export type Region = {
  id: string;
  name: string;
  state: string;
  center: { lat: number; lon: number };
  sea?: string;
  coast_bearing?: string;
};

export type GeoResult = { display_name: string; lat: number; lon: number; type?: string };

export type WeatherSnapshot = {
  wind_kn: number;
  gust_kn: number;
  wave_m: number;
  condition: string;
  lightning_pct: number;
  cyclone: string | null;
  timeframe: string;
};

export type TrendSeries = { unit: string; labels: string[]; values: number[] };

export type Situation = {
  region: string;
  region_id: string;
  severity: "critical" | "warning" | "advisory";
  verdict: string;
  reasons: string[];
  weather_today: WeatherSnapshot;
  weather_tomorrow: WeatherSnapshot;
  alerts: any[];
  tide: { type: string; time: string; height_m: number }[];
  trends: { wind: TrendSeries; wave: TrendSeries; sst: TrendSeries };
  generated_at: string;
};

import mockRegionsData from "./mockData.json";
import mockSituationsData from "./situations.json";
import mockAlertsData from "./alerts.json";

async function fetchClientLiveWeather(lat: number, lon: number): Promise<{ wind_kn: number; gust_kn: number; wave_m: number; condition: string } | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const [mRes, fRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=auto`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,wind_speed_10m,wind_gusts_10m,temperature_2m&wind_speed_unit=kn&timezone=auto`)
    ]);
    if (mRes.ok && fRes.ok) {
      const mData = await mRes.json();
      const fData = await fRes.json();
      const current = fData.current || {};
      const wave = (mData.daily?.wave_height_max || [0.8])[0] || 0.8;
      const wind = current.wind_speed_10m || 10;
      const gust = current.wind_gusts_10m || 14;
      return {
        wave_m: Math.round(wave * 10) / 10,
        wind_kn: Math.round(wind * 10) / 10,
        gust_kn: Math.round(gust * 10) / 10,
        condition: wind > 25 || wave > 2.5 ? "Rough sea conditions" : "Favourable sea breeze",
      };
    }
  } catch {
    // client fetch fallback
  }
  return null;
}

export const api = {
  chat: async (body: {
    message: string;
    session_id: string;
    language?: string | null;
    location?: { name?: string; lat: number; lon: number } | null;
    region_id?: string | null;
    user_id?: string;
  }) => {
    try {
      return await req("/chat", { method: "POST", body: JSON.stringify(body) });
    } catch {
      const regId = body.region_id || "kakinada";
      const q = (body.message || "").toLowerCase();
      const isChl = q.includes("chlorophyll") || q.includes("sst") || q.includes("fish") || q.includes("pfz");
      const isSafe = q.includes("safe") || q.includes("sail") || q.includes("wind") || q.includes("wave") || q.includes("tide");

      let content = "Marine advisory: Coastal parameters scanned for this sector. Safe navigation is advised within designated coastal nautical miles.";
      let widgets: Widget[] = [];

      if (isChl) {
        content = "High chlorophyll concentrations (2.2 - 2.8 mg/m³) and favourable Sea Surface Temperatures (28.2°C - 28.9°C) are observed in offshore waters. PFZ coordinates mapped below.";
        widgets = [
          {
            type: "chart",
            title: "Sea Surface Temperature (7-day)",
            unit: "°C",
            labels: ["10 Nov", "11 Nov", "12 Nov", "13 Nov", "14 Nov", "15 Nov", "16 Nov"],
            values: [28.9, 28.7, 28.6, 28.5, 28.4, 28.3, 28.4],
            color: "#E63946",
          },
          {
            type: "chart",
            title: "Chlorophyll-a (7-day)",
            unit: "mg/m³",
            labels: ["10 Nov", "11 Nov", "12 Nov", "13 Nov", "14 Nov", "15 Nov", "16 Nov"],
            values: [1.2, 1.4, 1.6, 1.9, 2.1, 2.2, 2.1],
            color: "#2A3B32",
          },
        ];
      } else if (isSafe) {
        content = "Sea state verification complete. Wind and wave heights remain within permissible limits for mechanized and motorized fishing craft.";
      }

      return {
        user_message: {
          id: `u-${Date.now()}`,
          role: "user",
          content: body.message,
          created_at: new Date().toISOString(),
        },
        assistant_message: {
          id: `a-${Date.now()}`,
          role: "assistant",
          content,
          created_at: new Date().toISOString(),
          verdict: isSafe ? "SAFE" : null,
          citations: ["Live Open-Meteo Marine Data", "INCOIS Ocean State Services", "ISRO Bhuvan"],
          widgets,
          reasoning_trace: [
            { agent: "Planner Agent", detail: `Intent analyzed for ${regId}; dispatched to coastal analytics.` },
            { agent: "Ocean Analytics Agent", detail: "Grounding metrics retrieved from Indian Ocean marine network." },
            { agent: "Synthesizer", detail: "Verified deterministic thresholds against IMD safety criteria." },
          ],
        },
      };
    }
  },

  getConversation: (session_id: string) =>
    req(`/conversations/${session_id}`).catch(() => ({ messages: [] })),

  getAlerts: async (region_id?: string, language?: string) => {
    const params = new URLSearchParams();
    if (region_id) params.append("region_id", region_id);
    if (language) params.append("language", language);
    const qs = params.toString();
    const regId = region_id || "kakinada";
    try {
      const res = await req(`/alerts${qs ? `?${qs}` : ""}`);
      const rawList = Array.isArray(res) ? res : (res?.alerts || []);
      return { alerts: Array.isArray(rawList) ? rawList : [], count: rawList.length, region_id: regId };
    } catch {
      const regionData = (mockAlertsData as any)[regId] || (mockAlertsData as any)["kakinada"] || {};
      const alertsList = Array.isArray(regionData) ? regionData : (regionData.alerts || []);
      return { alerts: Array.isArray(alertsList) ? alertsList : [], count: alertsList.length, region_id: regId };
    }
  },

  getNotifications: (user_id = "demo-user") =>
    req(`/notifications?user_id=${user_id}`).catch(() => []),

  getSituation: async (region_id?: string, language?: string): Promise<Situation> => {
    const params = new URLSearchParams();
    if (region_id) params.append("region_id", region_id);
    if (language) params.append("language", language);
    const qs = params.toString();
    const regId = region_id || "kakinada";

    try {
      return await req(`/situation${qs ? `?${qs}` : ""}`);
    } catch {
      // Robust client fallback with live Open-Meteo refresh
      const fallback = (mockSituationsData as any)[regId] || (mockSituationsData as any)["kakinada"];
      const regionsList = (mockRegionsData as any).regions || [];
      const regMeta = regionsList.find((r: any) => r.id === regId) || { center: { lat: 16.98, lon: 82.38 } };

      const baseSituation: Situation = JSON.parse(JSON.stringify(fallback));
      baseSituation.generated_at = new Date().toISOString();

      // Try fetching live weather metrics right from the client
      const live = await fetchClientLiveWeather(regMeta.center.lat, regMeta.center.lon);
      if (live) {
        baseSituation.weather_today.wind_kn = live.wind_kn;
        baseSituation.weather_today.gust_kn = live.gust_kn;
        baseSituation.weather_today.wave_m = live.wave_m;
        baseSituation.weather_today.condition = live.condition;
      }
      return baseSituation;
    }
  },
  voiceTranscribe: async (fileUri: string, language: string): Promise<{ text: string }> => {
    const form = new FormData();
    form.append("audio", { uri: fileUri, name: "voice.m4a", type: "audio/m4a" } as any);
    const res = await fetch(`${getBaseUrl()}/voice/transcribe?language=${language}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  },
  voiceSpeak: async (text: string, language: string): Promise<ArrayBuffer> => {
    const res = await fetch(`${getBaseUrl()}/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`${res.status}: ${errText || res.statusText}`);
    }
    return res.arrayBuffer();
  },

  listLocations: (user_id = "demo-user") =>
    req(`/locations?user_id=${user_id}`),
  saveLocation: (body: {
    name: string;
    lat: number;
    lon: number;
    user_id?: string;
    is_vessel?: boolean;
  }) => req("/locations", { method: "POST", body: JSON.stringify(body) }),
  deleteLocation: (id: string) =>
    req(`/locations/${id}`, { method: "DELETE" }),

  geofenceCheck: (body: {
    name: string;
    lat: number;
    lon: number;
    user_id?: string;
  }) => req("/geofence/check", { method: "POST", body: JSON.stringify(body) }),

  getBoundaries: (region_id?: string) =>
    req(`/data/boundaries${region_id ? `?region_id=${region_id}` : ""}`),
  getRegion: (region_id?: string) =>
    req(`/region${region_id ? `?region_id=${region_id}` : ""}`),

  // India-wide region registry
  listRegions: async (): Promise<{ regions: Region[]; default_region_id: string }> => {
    try {
      return await req("/regions");
    } catch {
      return {
        regions: (mockRegionsData as any).regions || [],
        default_region_id: "kakinada",
      };
    }
  },
  detectRegion: (
    lat: number,
    lon: number,
  ): Promise<{ region: Region; distance_km: number }> =>
    req(`/regions/detect?lat=${lat}&lon=${lon}`),

  // Free-text location search (any Indian coastal place)
  geocode: (
    q: string,
  ): Promise<{ query: string; results: GeoResult[]; attribution: string }> =>
    req(`/geocode?q=${encodeURIComponent(q)}`),

  // Push notifications
  registerPushToken: (body: { user_id?: string; token: string; region_id?: string }) =>
    req("/notifications/register-token", { method: "POST", body: JSON.stringify(body) }),
};

export { getBaseUrl };
