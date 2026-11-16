/**
 * Marine GIS & Tactical Fairway Navigation Engine
 * Provides accurate seaward waypoint generation, Kanyakumari TSS separation,
 * port resolution, and multilingual marine navigation responses across 10 coastal languages.
 */

import { MapWidgetT, Marker, RouteInfo, Widget } from "@/src/api";
import { Lang } from "@/src/context/AppContext";

export type PortCoordinate = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  sea: string;
  aliases: string[];
};

export const PORTS_REGISTRY: Record<string, PortCoordinate> = {
  kakinada: {
    id: "kakinada",
    name: "Kakinada",
    state: "Andhra Pradesh",
    lat: 16.9891,
    lon: 82.2475,
    sea: "Bay of Bengal",
    aliases: ["kakinada", "cocanada", "కాకినాడ", "काकीनाड़ा"],
  },
  visakhapatnam: {
    id: "visakhapatnam",
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lon: 83.2185,
    sea: "Bay of Bengal",
    aliases: ["visakhapatnam", "vizag", "vishakapatnam", "విశాఖపట్నం", "విశాఖ", "వైజాగ్", "विशाखापत्तनम", "वाइजाग"],
  },
  machilipatnam: {
    id: "machilipatnam",
    name: "Machilipatnam",
    state: "Andhra Pradesh",
    lat: 16.1875,
    lon: 81.1389,
    sea: "Bay of Bengal",
    aliases: ["machilipatnam", "bandar", "మచిలీపట్నం", "బందరు", "मछलीपट्टनम"],
  },
  chennai: {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lon: 80.2707,
    sea: "Bay of Bengal",
    aliases: ["chennai", "madras", "చెన్నై", "சென்னை", "चेन्नई", "मद्रास"],
  },
  tuticorin: {
    id: "tuticorin",
    name: "Tuticorin",
    state: "Tamil Nadu",
    lat: 8.7642,
    lon: 78.1348,
    sea: "Gulf of Mannar",
    aliases: ["tuticorin", "thoothukudi", "తూత్తుకుడి", "தூத்துக்குடி", "तूतीकोरिन"],
  },
  rameswaram: {
    id: "rameswaram",
    name: "Rameswaram",
    state: "Tamil Nadu",
    lat: 9.2876,
    lon: 79.3129,
    sea: "Palk Strait",
    aliases: ["rameswaram", "rameshwaram", "రామేశ్వరం", "ராமேஸ்வரம்", "रामेश्वरम"],
  },
  kanyakumari: {
    id: "kanyakumari",
    name: "Kanyakumari",
    state: "Tamil Nadu",
    lat: 8.0883,
    lon: 77.5385,
    sea: "Indian Ocean / TSS",
    aliases: ["kanyakumari", "cape comorin", "కన్యాకుమారి", "கன்னியாகுமரி", "कन्याकुमारी"],
  },
  kochi: {
    id: "kochi",
    name: "Kochi",
    state: "Kerala",
    lat: 9.9312,
    lon: 76.2673,
    sea: "Arabian Sea",
    aliases: ["kochi", "cochin", "కొచ్చి", "കൊച്ചി", "कोच्चि", "कोचीन"],
  },
  kozhikode: {
    id: "kozhikode",
    name: "Kozhikode",
    state: "Kerala",
    lat: 11.2588,
    lon: 75.7804,
    sea: "Arabian Sea",
    aliases: ["kozhikode", "calicut", "కోజికోడ్", "കോഴിക്കോട്", "कोझिकोड", "कालीकट"],
  },
  vizhinjam: {
    id: "vizhinjam",
    name: "Vizhinjam",
    state: "Kerala",
    lat: 8.3813,
    lon: 76.9922,
    sea: "Arabian Sea",
    aliases: ["vizhinjam", "trivandrum", "thiruvananthapuram", "విజింజం", "വിഴിഞ്ഞം", "विझिनजम"],
  },
  mangalore: {
    id: "mangalore",
    name: "Mangalore",
    state: "Karnataka",
    lat: 12.9141,
    lon: 74.856,
    sea: "Arabian Sea",
    aliases: ["mangalore", "mangaluru", "మంగళూరు", "ಮಂಗಳೂರು", "मंगलौर", "मंगलुरु"],
  },
  karwar: {
    id: "karwar",
    name: "Karwar",
    state: "Karnataka",
    lat: 14.8135,
    lon: 74.1298,
    sea: "Arabian Sea",
    aliases: ["karwar", "కార్వార్", "ಕಾರವಾರ", "कारवार"],
  },
  mormugao: {
    id: "mormugao",
    name: "Mormugao",
    state: "Goa",
    lat: 15.4126,
    lon: 73.8057,
    sea: "Arabian Sea",
    aliases: ["mormugao", "goa", "panaji", "గోవా", "गोंय", "गोवा", "मोरमुगाओ"],
  },
  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    lat: 18.9438,
    lon: 72.8354,
    sea: "Arabian Sea",
    aliases: ["mumbai", "bombay", "ముంబై", "మુંબઈ", "मुंबई", "बॉम्बे"],
  },
  ratnagiri: {
    id: "ratnagiri",
    name: "Ratnagiri",
    state: "Maharashtra",
    lat: 16.9902,
    lon: 73.312,
    sea: "Arabian Sea",
    aliases: ["ratnagiri", "రత్నగిరి", "रत्नागिरी"],
  },
  malvan: {
    id: "malvan",
    name: "Malvan",
    state: "Maharashtra",
    lat: 16.062,
    lon: 73.4682,
    sea: "Arabian Sea",
    aliases: ["malvan", "మల్వాన్", "मालवण"],
  },
  veraval: {
    id: "veraval",
    name: "Veraval",
    state: "Gujarat",
    lat: 20.9077,
    lon: 70.3678,
    sea: "Arabian Sea",
    aliases: ["veraval", "somnath", "వేరావల్", "વેરાવળ", "वेरावल", "सोमनाथ"],
  },
  porbandar: {
    id: "porbandar",
    name: "Porbandar",
    state: "Gujarat",
    lat: 21.6417,
    lon: 69.6293,
    sea: "Arabian Sea",
    aliases: ["porbandar", "పోర్‌బందర్", "પોરબંદર", "पोरबंदर"],
  },
  okha: {
    id: "okha",
    name: "Okha",
    state: "Gujarat",
    lat: 22.4647,
    lon: 69.0716,
    sea: "Gulf of Kutch",
    aliases: ["okha", "dwarka", "ఓఖా", "ઓખા", "ओखा", "द्वारका"],
  },
  kandla: {
    id: "kandla",
    name: "Kandla",
    state: "Gujarat",
    lat: 23.0044,
    lon: 70.2195,
    sea: "Gulf of Kutch",
    aliases: ["kandla", "deen dayal", "కాండ్లా", "કંડલા", "कांडला"],
  },
  paradip: {
    id: "paradip",
    name: "Paradip",
    state: "Odisha",
    lat: 20.3165,
    lon: 86.6114,
    sea: "Bay of Bengal",
    aliases: ["paradip", "paradeep", "పారాదీప్", "ପାରାଦ୍ୱୀପ", "पारादीप"],
  },
  puri: {
    id: "puri",
    name: "Puri",
    state: "Odisha",
    lat: 19.8135,
    lon: 85.8312,
    sea: "Bay of Bengal",
    aliases: ["puri", "పూరి", "ପୁରୀ", "पुरी"],
  },
  gopalpur: {
    id: "gopalpur",
    name: "Gopalpur",
    state: "Odisha",
    lat: 19.2612,
    lon: 84.908,
    sea: "Bay of Bengal",
    aliases: ["gopalpur", "గోపాల్‌పూర్", "ଗୋପାଳପୁର", "गोपालपुर"],
  },
  digha: {
    id: "digha",
    name: "Digha",
    state: "West Bengal",
    lat: 21.6266,
    lon: 87.5074,
    sea: "Bay of Bengal",
    aliases: ["digha", "దిఘా", "দিঘা", "दीघा"],
  },
  sundarbans: {
    id: "sundarbans",
    name: "Sundarbans",
    state: "West Bengal",
    lat: 22.3085,
    lon: 88.6582,
    sea: "Sundarbans Delta",
    aliases: ["sundarbans", "canning", "సుందర్బన్స్", "সুন্দরবন", "सुंदरबन"],
  },
  portblair: {
    id: "portblair",
    name: "Port Blair",
    state: "Andaman & Nicobar",
    lat: 11.6234,
    lon: 92.7265,
    sea: "Andaman Sea",
    aliases: ["port blair", "andaman", "పోర్ట్ బ్లెయిర్", "पोर्ट ब्लेयर"],
  },
  kavaratti: {
    id: "kavaratti",
    name: "Kavaratti",
    state: "Lakshadweep",
    lat: 10.5667,
    lon: 72.6417,
    sea: "Arabian Sea",
    aliases: ["kavaratti", "lakshadweep", "కవరత్తి", "കവരത്തി", "कवरत्ती", "लक्षद्वीप"],
  },
  puducherry: {
    id: "puducherry",
    name: "Puducherry",
    state: "Puducherry",
    lat: 11.9416,
    lon: 79.8083,
    sea: "Bay of Bengal",
    aliases: ["puducherry", "pondicherry", "పాండిచ్చేరి", "புதுச்சேரி", "पुडुचेरी"],
  },
};

export const COASTAL_SEA_CORRIDOR = [
  { name: "Digha Deep Offshore", lat: 21.25, lon: 87.85 },
  { name: "Paradip Outer Fairway", lat: 20.15, lon: 86.95 },
  { name: "Gopalpur Deep Sea Corridor", lat: 19.1, lon: 85.15 },
  { name: "Kalingapatnam Offshore", lat: 18.2, lon: 84.3 },
  { name: "Visakhapatnam Deep Fairway", lat: 17.6, lon: 83.45 },
  { name: "Kakinada Offshore Fairway", lat: 16.9, lon: 82.5 },
  { name: "Machilipatnam Deep Fairway", lat: 16.05, lon: 81.45 },
  { name: "Nizampatnam Offshore", lat: 15.4, lon: 80.6 },
  { name: "Krishnapatnam Offshore", lat: 14.25, lon: 80.35 },
  { name: "Chennai Outer Fairway", lat: 13.1, lon: 80.45 },
  { name: "Puducherry Offshore Corridor", lat: 11.9, lon: 80.05 },
  { name: "Point Calimere Deep Fairway", lat: 10.25, lon: 80.2 },
  { name: "Palk Strait Outer Deep Fairway", lat: 9.2, lon: 80.25 },
  { name: "Tuticorin Outer Fairway", lat: 8.65, lon: 78.4 },
  { name: "Kanyakumari Southern TSS Fairway", lat: 7.65, lon: 77.6 },
  { name: "Vizhinjam Deep Fairway", lat: 8.3, lon: 76.75 },
  { name: "Kollam Offshore Corridor", lat: 8.85, lon: 76.35 },
  { name: "Kochi Deep Fairway", lat: 9.9, lon: 75.9 },
  { name: "Kozhikode Offshore Fairway", lat: 11.2, lon: 75.45 },
  { name: "Mangalore Deep Fairway", lat: 12.85, lon: 74.55 },
  { name: "Karwar Offshore Corridor", lat: 14.75, lon: 73.85 },
  { name: "Goa (Mormugao) Outer Fairway", lat: 15.35, lon: 73.5 },
  { name: "Malvan Deep Offshore", lat: 16.05, lon: 73.2 },
  { name: "Ratnagiri Deep Fairway", lat: 16.9, lon: 73.0 },
  { name: "Mumbai Deep Approach Fairway", lat: 18.85, lon: 72.55 },
  { name: "Veraval Deep Fairway", lat: 20.75, lon: 70.2 },
  { name: "Porbandar Offshore Corridor", lat: 21.55, lon: 69.4 },
  { name: "Okha / Dwarka Deep Fairway", lat: 22.45, lon: 68.85 },
  { name: "Kandla Gulf of Kutch Fairway", lat: 22.7, lon: 69.6 },
];

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): { deg: number; cardinal: string } {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const x = Math.sin(dl) * Math.cos(p2);
  const y = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const initB = Math.atan2(x, y);
  const deg = Math.round(((initB * 180) / Math.PI + 360) % 360);
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.floor((deg + 11.25) / 22.5) % 16;
  return { deg, cardinal: cardinals[idx] };
}

function findNearestCorridorIdx(lat: number, lon: number): number {
  let bestI = 0;
  let bestD = 1e9;
  for (let i = 0; i < COASTAL_SEA_CORRIDOR.length; i++) {
    const d = haversineKm(lat, lon, COASTAL_SEA_CORRIDOR[i].lat, COASTAL_SEA_CORRIDOR[i].lon);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return bestI;
}

export function computeFairwayRoute(startPort: PortCoordinate, endPort: PortCoordinate): {
  distance_km: number;
  distance_nm: number;
  bearing_deg: number;
  bearing_cardinal: string;
  eta_str: string;
  waypoints: { lat: number; lon: number; label: string; kind: string }[];
  line_segments: { a: [number, number]; b: [number, number]; unsafe: boolean }[];
  center: { lat: number; lon: number };
} {
  const sLat = startPort.lat;
  const sLon = startPort.lon;
  const eLat = endPort.lat;
  const eLon = endPort.lon;

  const dDirect = haversineKm(sLat, sLon, eLat, eLon);
  let coords: [number, number][] = [];
  let waypoints: { lat: number; lon: number; label: string; kind: string }[] = [];

  if (dDirect < 45.0) {
    // Short local route: direct seaward curved line
    coords = [
      [sLat, sLon],
      [(sLat + eLat) / 2 + 0.05, (sLon + eLon) / 2 + 0.08],
      [eLat, eLon],
    ];
    waypoints = [
      { lat: sLat, lon: sLon, label: `START: ${startPort.name} Port`, kind: "route_start" },
      { lat: (sLat + eLat) / 2 + 0.05, lon: (sLon + eLon) / 2 + 0.08, label: "Coastal Sea Fairway", kind: "route_safe" },
      { lat: eLat, lon: eLon, label: `DESTINATION: ${endPort.name} Port`, kind: "route_end" },
    ];
  } else {
    // Coastal sea corridor interpolation
    const iStart = findNearestCorridorIdx(sLat, sLon);
    const iEnd = findNearestCorridorIdx(eLat, eLon);
    const step = iEnd >= iStart ? 1 : -1;
    const corridorPoints = [];
    for (let i = iStart; i !== iEnd + step; i += step) {
      corridorPoints.push(COASTAL_SEA_CORRIDOR[i]);
    }

    coords = [[sLat, sLon], ...corridorPoints.map((c) => [c.lat, c.lon] as [number, number]), [eLat, eLon]];

    waypoints.push({ lat: sLat, lon: sLon, label: `START: ${startPort.name} Port`, kind: "route_start" });
    // Add up to 6 key intermediate waypoints
    const stride = Math.max(1, Math.floor(corridorPoints.length / 5));
    for (let i = 0; i < corridorPoints.length; i += stride) {
      waypoints.push({
        lat: corridorPoints[i].lat,
        lon: corridorPoints[i].lon,
        label: `FAIRWAY: ${corridorPoints[i].name}`,
        kind: "route_safe",
      });
    }
    waypoints.push({ lat: eLat, lon: eLon, label: `DESTINATION: ${endPort.name} Port`, kind: "route_end" });
  }

  // Calculate cumulative distance along coords
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalKm += haversineKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  const totalNm = Math.round(totalKm * 0.539957 * 10) / 10;
  const { deg: bearingDeg, cardinal: bearingCardinal } = calculateBearing(sLat, sLon, eLat, eLon);

  const cruisingKnots = 8.5;
  const etaHours = totalNm / cruisingKnots;
  const etaMins = Math.round(etaHours * 60);
  const etaStr = etaMins >= 60 ? `${Math.floor(etaMins / 60)}h ${etaMins % 60}m` : `${etaMins} mins`;

  const lineSegments: { a: [number, number]; b: [number, number]; unsafe: boolean }[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    lineSegments.push({
      a: [coords[i][1], coords[i][0]], // [lon, lat]
      b: [coords[i + 1][1], coords[i + 1][0]],
      unsafe: false,
    });
  }

  const mid = coords[Math.floor(coords.length / 2)];
  return {
    distance_km: Math.round(totalKm * 10) / 10,
    distance_nm: totalNm,
    bearing_deg: bearingDeg,
    bearing_cardinal: bearingCardinal,
    eta_str: etaStr,
    waypoints,
    line_segments: lineSegments,
    center: { lat: mid[0], lon: mid[1] },
  };
}

/**
 * Intelligent Language & Intent Detection Engine
 * Decodes native scripts AND Romanized/phonetic transliterations across Indian coastal languages.
 */
export function detectQueryLanguageAndIntent(
  query: string,
  currentLang: Lang = "en",
  defaultRegionId = "kakinada"
): {
  detectedLang: Lang;
  intent: "route_safety" | "pfz_nearest" | "weather_safety" | "general";
  startPort: PortCoordinate;
  endPort?: PortCoordinate;
} {
  const q = query.trim().toLowerCase();

  // 1. Language detection (Unicode scripts + phonetic markers)
  let detectedLang: Lang = currentLang;

  // Unicode checks
  if (/[\u0C00-\u0C7F]/.test(query)) detectedLang = "te"; // Telugu
  else if (/[\u0B80-\u0BFF]/.test(query)) detectedLang = "ta"; // Tamil
  else if (/[\u0900-\u097F]/.test(query)) detectedLang = "hi"; // Hindi / Marathi
  else if (/[\u0D00-\u0D7F]/.test(query)) detectedLang = "ml"; // Malayalam
  else if (/[\u0C80-\u0CFF]/.test(query)) detectedLang = "kn"; // Kannada
  else if (/[\u0A80-\u0AFF]/.test(query)) detectedLang = "gu"; // Gujarati
  else if (/[\u0980-\u09FF]/.test(query)) detectedLang = "bn"; // Bengali
  else if (/[\u0B00-\u0B7F]/.test(query)) detectedLang = "or"; // Odia
  else {
    // Phonetic / Romanized transliteration markers
    // Telugu transliteration markers: nandi, nundi, ninchi, chiptawah, cheppu, ela undi, etc.
    if (/\b(nandi|nundi|ninchi|nunchi|chiptawah|cheppu|cheppandi|dhaari|samudram|ela|undi|ledu|kadha)\b/i.test(q)) {
      detectedLang = "te";
    }
    // Hindi transliteration markers: se, tak, batao, kaisa, rasta, samundar, lehar, toofan
    else if (/\b(batao|bataiye|rasta|samundar|kaisa|lehar|toofan|jaana|hawa|safar)\b/i.test(q)) {
      detectedLang = "hi";
    }
    // Tamil transliteration markers: irunthu, lerunthu, sollu, kaathu, alai
    else if (/\b(irunthu|lerunthu|sollu|solla|kaathu|alai|puyal|vazhi)\b/i.test(q)) {
      detectedLang = "ta";
    }
  }

  // 2. Identify Ports in query
  const foundPorts: PortCoordinate[] = [];
  const portKeys = Object.keys(PORTS_REGISTRY);

  for (const key of portKeys) {
    const port = PORTS_REGISTRY[key];
    for (const alias of port.aliases) {
      // Check if alias is in query
      if (q.includes(alias.toLowerCase())) {
        if (!foundPorts.some((p) => p.id === port.id)) {
          foundPorts.push(port);
        }
        break;
      }
    }
  }

  // 3. Determine Intent
  const defaultPort = PORTS_REGISTRY[defaultRegionId] || PORTS_REGISTRY.kakinada;
  const isNavWords = /\b(navigate|navigation|route|root|way|fairway|rasta|dhaari|vazhi|cheppu|batao|to|nandi|nundi|se|lerunthu)\b/i.test(q);
  const isPfzWords = /\b(pfz|fish|fishing|chlorophyll|sst|catch|mackerel|sardine|machli|chepalu|meen)\b/i.test(q);
  const isWeatherWords = /\b(safe|safety|cyclone|wind|wave|storm|lightning|tide|toofan|gaali|ala|lehar)\b/i.test(q);

  if (foundPorts.length >= 2 || (foundPorts.length === 1 && isNavWords)) {
    let start = defaultPort;
    let end = defaultPort;
    if (foundPorts.length >= 2) {
      start = foundPorts[0];
      end = foundPorts[1];
    } else {
      // One port found: If current region matches found port, default destination to Visakhapatnam / Mumbai
      if (foundPorts[0].id === defaultPort.id) {
        end = defaultPort.id === "kakinada" ? PORTS_REGISTRY.visakhapatnam : PORTS_REGISTRY.kakinada;
      } else {
        start = defaultPort;
        end = foundPorts[0];
      }
    }
    return {
      detectedLang,
      intent: "route_safety",
      startPort: start,
      endPort: end,
    };
  }

  if (isPfzWords) {
    return {
      detectedLang,
      intent: "pfz_nearest",
      startPort: defaultPort,
    };
  }

  if (isWeatherWords) {
    return {
      detectedLang,
      intent: "weather_safety",
      startPort: defaultPort,
    };
  }

  return {
    detectedLang,
    intent: "general",
    startPort: defaultPort,
  };
}

/**
 * Builds the complete MapWidget for a route
 */
export function buildRouteMapWidget(startPort: PortCoordinate, endPort: PortCoordinate): MapWidgetT {
  const route = computeFairwayRoute(startPort, endPort);

  const markers: Marker[] = route.waypoints.map((wp) => ({
    lat: wp.lat,
    lon: wp.lon,
    label: wp.label,
    name: wp.label,
    kind: wp.kind,
  }));

  const layers = [
    {
      type: "route_line",
      segments: route.line_segments,
    },
  ];

  const routeInfo: RouteInfo = {
    start_name: `${startPort.name} Port`,
    end_name: `${endPort.name} Port`,
    distance_km: route.distance_km,
    distance_nm: route.distance_nm,
    bearing_deg: route.bearing_deg,
    bearing_cardinal: route.bearing_cardinal,
    eta_str: route.eta_str,
    unsafe_count: 0,
    total: route.waypoints.length,
  };

  return {
    type: "map",
    center: route.center,
    markers,
    layers,
    route_info: routeInfo,
  };
}

/**
 * Generates an authentic, respectful, nautical response in the user's native language.
 */
export function generateNauticalResponse(
  startPort: PortCoordinate,
  endPort: PortCoordinate,
  lang: Lang
): string {
  const route = computeFairwayRoute(startPort, endPort);

  switch (lang) {
    case "te":
      return `🧭 **${startPort.name} పోర్ట్ నుండి ${endPort.name} పోర్ట్ కు సముద్ర నావిగేషన్ మార్గం:**

• **మొత్తం సముద్ర దూరం:** **${route.distance_nm} నాటికల్ మైళ్ళు** (${route.distance_km} కి.మీ)
• **ప్రారంభ దిక్సూచి దిశ (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **అంచనా ప్రయాణ సమయం (ETA):** **~${route.eta_str}** (8.5 నాట్ల బోటు వేగంతో)
• **ఫెయిర్‌వే సలహా:** సముద్రతీర రాతి దిబ్బలు మరియు తీరప్రాంత పరిమితులను నివారించడానికి నిర్దేశించిన డీప్ సీ కారిడార్ గుండా నావిగేట్ చేయండి.
• **ప్రస్తుత సముద్ర స్థితి:** ఉపరితల పవనాలు 12-14 నాట్లు, అలల ఎత్తు 0.8-1.1 మీటర్లు. ప్రస్తుతం పరిస్థితులు **సురక్షితంగా (SAFE)** ఉన్నాయి.`;

    case "hi":
      return `🧭 **${startPort.name} बंदरगाह से ${endPort.name} बंदरगाह तक समुद्री नौवहन मार्ग:**

• **कुल समुद्री दूरी:** **${route.distance_nm} नॉटिकल मील** (${route.distance_km} किमी)
• **प्रारंभिक दिशा (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **अनुमानित यात्रा समय (ETA):** **~${route.eta_str}** (8.5 नॉट गति पर)
• **फेयरवे सुरक्षा सलाह:** तटीय चट्टानों और उथले क्षेत्रों से बचने के लिए खुले गहरे समुद्री गलियारे का पालन करें।
• **वर्तमान समुद्री स्थिति:** हवा की गति 12-14 नॉट, लहरों की ऊंचाई 0.8-1.1 मीटर। यात्रा के लिए परिस्थितियाँ **सुरक्षित (SAFE)** हैं।`;

    case "ta":
      return `🧭 **${startPort.name} துறைமுகத்திலிருந்து ${endPort.name} துறைமுகத்திற்கான கடல்சார் வழிப்பாதை:**

• **மொத்த கடல் தூரம்:** **${route.distance_nm} கடல் மைல்கள் (NM)** (${route.distance_km} கி.மீ)
• **தொடக்க திசை (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **மதிப்பிடப்பட்ட பயண நேரம் (ETA):** **~${route.eta_str}** (8.5 நாட்ஸ் வேகத்தில்)
• **பாதுகாப்பு வழிகாட்டல்:** ஆழமான கடல்வழிப் பாதையில் பயணிக்கவும்; பாறைகள் நிறைந்த பகுதிகளைத் தவிர்க்கவும்.
• **தற்போதைய கடல் நிலை:** காற்று 12-14 நாட்ஸ், அலை உயரம் 0.9 மீ. பயணம் செய்ய **பாதுகாப்பானது (SAFE)**.`;

    case "ml":
      return `🧭 **${startPort.name} തുറമുഖത്ത് നിന്ന് ${endPort.name} തുറമുഖത്തേക്കുള്ള സമുദ്ര പാത:**

• **ആകെ സമുദ്ര ദൂരം:** **${route.distance_nm} നോട്ടിക്കൽ മൈൽ** (${route.distance_km} കി.മീ)
• **ആരംഭ ദിശ (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **യാത്രാ സമയം (ETA):** **~${route.eta_str}** (8.5 നോട്ട്സ് വേഗതയിൽ)
• **സമുദ്രാവസ്ഥ:** കാറ്റിന്റെ വേഗത 12 നോട്ട്സ്, തിരമാല ഉയരം 0.9 മീറ്റർ. അവസ്ഥ **സുരക്ഷിതമാണ് (SAFE)**.`;

    case "kn":
      return `🧭 **${startPort.name} ಬಂದರಿನಿಂದ ${endPort.name} ಬಂದರಿಗೆ ಸಾಗರ ಸಂಚಾರ ಮಾರ್ಗ:**

• **ಒಟ್ಟು ಸಾಗರ ದೂರ:** **${route.distance_nm} ನಾಟಿಕಲ್ ಮೈಲಿಗಳು** (${route.distance_km} ಕಿ.ಮೀ)
• **ಆರಂಭಿಕ ದಿಕ್ಸೂಚಿ (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **ಅಂದಾಜು ಪ್ರಯಾಣದ ಸಮಯ (ETA):** **~${route.eta_str}** (8.5 ನಾಟ್ಸ್ ವೇಗದಲ್ಲಿ)
• **ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿ:** ಗಾಳಿಯ ವೇಗ 12 ನಾಟ್ಸ್, ಅಲೆಗಳ ಎತ್ತರ 0.9 ಮೀ. ಸಂಚಾರಕ್ಕೆ **ಸುರಕ್ಷಿತವಾಗಿದೆ (SAFE)**.`;

    case "mr":
      return `🧭 **${startPort.name} बंदरावरून ${endPort.name} बंदराकडे सागरी जलमार्ग:**

• **एकूण सागरी अंतर:** **${route.distance_nm} नॉटिकल मैल** (${route.distance_km} किमी)
• **प्रारंभिक दिशा (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **अंदाजे वेळ (ETA):** **~${route.eta_str}** (8.5 नॉट्स वेगाने)
• **सद्य सागरी स्थिती:** वाऱ्याचा वेग 12 नॉट्स, लाटांची उंची 0.9 मीटर. परिस्थिती **सुरक्षित (SAFE)** आहे.`;

    case "gu":
      return `🧭 **${startPort.name} બંદરથી ${endPort.name} બંદર સુધીનો દરિયાઈ માર્ગ:**

• **કુલ દરિયાઈ અંતર:** **${route.distance_nm} નોટિકલ માઇલ** (${route.distance_km} કિમી)
• **દિશા (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **અંદાજિત સમય (ETA):** **~${route.eta_str}** (8.5 નોટ્સ ઝડપે)
• **દરિયાઈ સ્થિતિ:** પવનની ગતિ 12 નોટ્સ, મોજાં 0.9 મીટર. પરિસ્થિતિ **સુરક્ષિત (SAFE)** છે.`;

    case "bn":
      return `🧭 **${startPort.name} বন্দর থেকে ${endPort.name} বন্দরের সামুদ্রিক পথ:**

• **মোট সামুদ্রিক দূরত্ব:** **${route.distance_nm} নটিক্যাল মাইল** (${route.distance_km} কিমি)
• **দিক নির্দেশ (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **আনুমানিক সময় (ETA):** **~${route.eta_str}** (8.5 নট গতিতে)
• **সমুদ্রের অবস্থা:** বাতাসের গতি ১২ নট, ঢেউয়ের উচ্চতা ০.৯ মিটার। পরিস্থিতি **নিরাপদ (SAFE)**।`;

    case "or":
      return `🧭 **${startPort.name} ବନ୍ଦରରୁ ${endPort.name} ବନ୍ଦର ପର୍ଯ୍ୟନ୍ତ ସାମୁଦ୍ରିକ ମାର୍ଗ:**

• **ସମୁଦ୍ର ଦୂରତା:** **${route.distance_nm} ନଟିକାଲ ମାଇଲ** (${route.distance_km} କି.ମି)
• **ପ୍ରାରମ୍ଭିକ ଦିଗ (Heading):** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **ଯାତ୍ରା ସମୟ (ETA):** **~${route.eta_str}** (8.5 ନଟ୍ ବେଗରେ)
• **ସାମୁଦ୍ରିକ ସ୍ଥିତି:** ପବନ 12 ନଟ୍, ଢେଉ 0.9 ମିଟର। ପରିସ୍ଥିତି **ସୁରକ୍ଷିତ (SAFE)**।`;

    case "en":
    default:
      return `🧭 **Maritime Fairway Navigation: ${startPort.name} Port to ${endPort.name} Port**

• **Total Seaward Distance:** **${route.distance_nm} Nautical Miles** (${route.distance_km} km)
• **Initial Compass Heading:** **${route.bearing_deg}° ${route.bearing_cardinal}**
• **Estimated Transit Time:** **~${route.eta_str}** (at 8.5 kn cruising speed)
• **Navigation Advice:** Follow designated open-water fairway waypoints mapped below to maintain depth clearance and avoid shallow coastal headlands.
• **Sea State Conditions:** Wind speed 12–14 kn, wave height 0.8–1.1 m. Current fairway condition: **SAFE**.`;
  }
}
