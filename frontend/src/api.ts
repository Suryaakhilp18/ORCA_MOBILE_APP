import Constants from "expo-constants";
import { Platform } from "react-native";

function getBaseUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:8000/api`;
  }
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configured) {
    if (Platform.OS !== "web" && configured.includes("localhost")) {
      const hostUri = Constants.expoConfig?.hostUri;
      if (hostUri) {
        const ip = hostUri.split(":")[0];
        return `http://${ip}:8000/api`;
      }
    }
    return configured.endsWith("/api") ? configured : `${configured}/api`;
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

export const api = {
  chat: (body: {
    message: string;
    session_id: string;
    language?: string | null;
    location?: { name?: string; lat: number; lon: number } | null;
    region_id?: string | null;
    user_id?: string;
  }) => req("/chat", { method: "POST", body: JSON.stringify(body) }),

  getConversation: (session_id: string) =>
    req(`/conversations/${session_id}`),

  getAlerts: (region_id?: string, language?: string) => {
    const params = new URLSearchParams();
    if (region_id) params.append("region_id", region_id);
    if (language) params.append("language", language);
    const qs = params.toString();
    return req(`/alerts${qs ? `?${qs}` : ""}`);
  },
  getNotifications: (user_id = "demo-user") =>
    req(`/notifications?user_id=${user_id}`),
  getSituation: (region_id?: string, language?: string): Promise<Situation> => {
    const params = new URLSearchParams();
    if (region_id) params.append("region_id", region_id);
    if (language) params.append("language", language);
    const qs = params.toString();
    return req(`/situation${qs ? `?${qs}` : ""}`);
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
  listRegions: (): Promise<{ regions: Region[]; default_region_id: string }> =>
    req("/regions"),
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
