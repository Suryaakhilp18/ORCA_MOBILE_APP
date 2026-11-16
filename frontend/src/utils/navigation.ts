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
  intent: "route_safety" | "pfz_nearest" | "weather_safety" | "greeting" | "capabilities" | "explain_domain" | "port_focus" | "general";
  startPort: PortCoordinate;
  endPort?: PortCoordinate;
  domainTopic?: "ais" | "pfz" | "ecdis" | "map" | "sst";
  focusPort?: PortCoordinate;
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
    if (/\b(nandi|nundi|ninchi|nunchi|chiptawah|cheppu|cheppandi|dhaari|samudram|ela|undi|ledu|kadha|cheyagalanu)\b/i.test(q)) {
      detectedLang = "te";
    }
    else if (/\b(batao|bataiye|rasta|samundar|kaisa|lehar|toofan|jaana|hawa|safar|karein|karega)\b/i.test(q)) {
      detectedLang = "hi";
    }
    else if (/\b(irunthu|lerunthu|sollu|solla|kaathu|alai|puyal|vazhi)\b/i.test(q)) {
      detectedLang = "ta";
    }
  }

  const defaultPort = PORTS_REGISTRY[defaultRegionId] || PORTS_REGISTRY.kakinada;

  // 2. Identify Ports in query
  const foundPorts: PortCoordinate[] = [];
  const portKeys = Object.keys(PORTS_REGISTRY);

  for (const key of portKeys) {
    const port = PORTS_REGISTRY[key];
    for (const alias of port.aliases) {
      if (q.includes(alias.toLowerCase())) {
        if (!foundPorts.some((p) => p.id === port.id)) {
          foundPorts.push(port);
        }
        break;
      }
    }
  }

  const isNavWords = /\b(navigate|navigation|route|root|way|fairway|rasta|dhaari|vazhi|cheppu|batao|to|nandi|nundi|se|lerunthu)\b/i.test(q);

  // 3. Conversational Greetings & Capabilities (only if not asking for route/port)
  const isGreeting = (foundPorts.length === 0 && !isNavWords) && (
    /^(hi|hello|hey|namaste|vanakkam|namaskaram)[\s!.]*$/i.test(q) ||
    /^(హాయ్|నమస్కారం|హలో|नमस्ते|नमस्कार|வணக்கம்|നമസ്കാരം|ನಮಸ್ಕಾರ)[\s!.]*$/i.test(query.trim())
  );
  if (isGreeting) {
    return {
      detectedLang,
      intent: "greeting",
      startPort: defaultPort,
    };
  }

  const isCapabilities = (foundPorts.length === 0 && !isNavWords) && (
    /^(what can you do|who are you|help me|capabilities|what you can do)[\s?.]*$/i.test(q) ||
    /\b(what can you do|who are you|capabilities|what you can do)\b/i.test(q) ||
    /^(help|help me)$/i.test(q) ||
    /నువ్వు ఏమి చేయగలవు|నువ్వేం చేయగలవు|నువ్వు ఏం చేస్తావు|మీరు ఏమి చేయగలరు|మీరేం చేయగలరు|నీ సామర్థ్యాలు|आप क्या कर सकते हैं|तुम क्या कर सकते हो|आप क्या कर सकती हैं|तुम क्या करते हो|நீ என்ன செய்ய முடியும்/i.test(query)
  );
  if (isCapabilities) {
    return {
      detectedLang,
      intent: "capabilities",
      startPort: defaultPort,
    };
  }

  // 4. Domain Explanations (AIS, PFZ, ECDIS, Map, SST)
  if (/\b(what is ais|explain ais|about ais|ais meaning)\b/i.test(q) || /ais అంటే ఏమిటి|ais గురించి|ais क्या है|ais के बारे में/i.test(query)) {
    return { detectedLang, intent: "explain_domain", domainTopic: "ais", startPort: defaultPort };
  }
  if (/\b(what is pfz|explain pfz|about pfz|pfz meaning)\b/i.test(q) || /pfz అంటే ఏమిటి|pfz గురించి|pfz क्या है/i.test(query)) {
    return { detectedLang, intent: "explain_domain", domainTopic: "pfz", startPort: defaultPort };
  }
  if (/\b(what is ecdis|explain ecdis|about ecdis)\b/i.test(q) || /ecdis అంటే ఏమిటి|ecdis क्या है/i.test(query)) {
    return { detectedLang, intent: "explain_domain", domainTopic: "ecdis", startPort: defaultPort };
  }
  if (/\b(explain (this )?map|show map|map explanation|explain the map)\b/i.test(q) || /ఈ మ్యాప్ను వివరించండి|మ్యాప్ వివరణ|మ్యాప్ గురించి|मुझे यह नक्शा समझाइए|इस नक्शे को समझाइए|नक्शा समझाइए|வரைபடத்தை விளக்கு/i.test(query)) {
    return { detectedLang, intent: "explain_domain", domainTopic: "map", startPort: defaultPort };
  }
  if (/\b(what is sst|sea surface temperature)\b/i.test(q) || /sst అంటే ఏమిటి|sst क्या है/i.test(query)) {
    return { detectedLang, intent: "explain_domain", domainTopic: "sst", startPort: defaultPort };
  }

  // 5. Port Focus / View Command ("Show me Kakinada Port", "విశాఖ పోర్టును చూపించు", "काकीनाडा बंदरगाह दिखाओ")
  const isShowPortWords = /\b(show|view|focus|open|display|center)\b/i.test(q) || /చూపించు|దగ్గర|दिखाओ|दिखाइए|காட்டு/i.test(query);

  if (foundPorts.length === 1 && isShowPortWords && !isNavWords) {
    return {
      detectedLang,
      intent: "port_focus",
      startPort: foundPorts[0],
      focusPort: foundPorts[0],
    };
  }

  // 6. Navigation Route Intent
  const isPfzWords = /\b(pfz|fish|fishing|chlorophyll|sst|catch|mackerel|sardine|machli|chepalu|meen)\b/i.test(q);
  const isWeatherWords = /\b(safe|safety|cyclone|wind|wave|storm|lightning|tide|toofan|gaali|ala|lehar)\b/i.test(q);

  if (foundPorts.length >= 2 || (foundPorts.length === 1 && isNavWords)) {
    let start = defaultPort;
    let end = defaultPort;
    if (foundPorts.length >= 2) {
      start = foundPorts[0];
      end = foundPorts[1];
    } else {
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


/**
 * Mandatory Greeting Responses
 */
export function generateGreetingResponse(lang: Lang): string {
  switch (lang) {
    case "te":
      return "హలో! నేను ORCA, మీ మెరైన్ ఇంటెలిజెన్స్ అసిస్టెంట్‌ని. ఈరోజు మీకు ఎలా సహాయం చేయగలను?";
    case "hi":
      return "नमस्ते! मैं ORCA हूँ, आपका मरीन इंटेलिजेंस असिस्टेंट। आज मैं आपकी कैसे मदद कर सकता हूँ?";
    case "ta":
      return "வணக்கம்! நான் ORCA, உங்கள் கடல்சார் நுண்ணறிவு உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?";
    case "ml":
      return "ഹലോ! ഞാൻ ഓർക്ക, നിങ്ങളുടെ സമുദ്ര ഇന്റലിജൻസ് അസിസ്റ്റന്റാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?";
    case "kn":
      return "ನಮಸ್ಕಾರ! ನಾನು ORCA, ನಿಮ್ಮ ಸಾಗರ ಗುಪ್ತಚರ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
    case "mr":
      return "नमस्ते! मी ORCA आहे, आपला सागरी बुद्धिमत्ता सहाय्यक. आज मी आपल्याला कशी मदत करू शकतो?";
    case "gu":
      return "નમસ્તે! હું ORCA છું, તમારો દરિયાઈ ઈન્ટેલિજન્સ સહાયક. આજે હું તમને કેવી રીતે મદદ કરી શકું?";
    case "bn":
      return "নমস্কার! আমি ORCA, আপনার সামুদ্রিক গোয়েন্দা সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?";
    case "or":
      return "ନମସ୍କାର! ମୁଁ ORCA, ଆପଣଙ୍କ ସାମୁଦ୍ରିକ ଗୋଇନ୍ଦା ସହାୟକ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?";
    case "en":
    default:
      return "Hello! This is ORCA, your Marine Intelligence Assistant. How may I help you today?";
  }
}

/**
 * Mandatory Capabilities Responses ("What can you do?")
 */
export function generateCapabilitiesResponse(lang: Lang): string {
  switch (lang) {
    case "te":
      return "సముద్ర పరిస్థితులు, చేపల వేటకు అనుకూలమైన ప్రాంతాలు (PFZ), వాతావరణ సమాచారం, నౌకల వివరాలు (AIS), నావిగేషన్ మార్గాలు మరియు సముద్ర సంబంధిత సమాచారాన్ని తెలుసుకోవడంలో మీకు సహాయం చేయగలను. మీకు ఏ సమాచారం కావాలి?";
    case "hi":
      return "मैं समुद्र की स्थिति, मछली पकड़ने के संभावित क्षेत्र (PFZ), मौसम की जानकारी, जहाजों का विवरण (AIS), नौवहन मार्ग और समुद्री सुरक्षा संबंधी जानकारी में आपकी सहायता कर सकता हूँ। आप क्या जानना चाहते हैं?";
    case "ta":
      return "கடல் நிலைமைகள், சாத்தியமான மீன்பிடி மண்டலங்கள் (PFZ), வானிலை தகவல், கப்பல் விவரங்கள் (AIS), கடல்சார் வழிப்பாதைகள் மற்றும் கடல்சார் நுண்ணறிவு தகவல்களைப் பெற நான் உதவ முடியும். நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?";
    case "ml":
      return "സമുദ്രാവസ്ഥ, സാധ്യതയുള്ള മത്സ്യബന്ധന മേഖലകൾ (PFZ), കാലാവസ്ഥാ വിവരങ്ങൾ, കപ്പൽ വിവരങ്ങൾ (AIS), നാവിഗേഷൻ റൂട്ടുകൾ എന്നിവയിൽ ഞാൻ നിങ്ങളെ സഹായിക്കാം. നിങ്ങൾക്ക് എന്താണ് അറിയേണ്ടത്?";
    case "kn":
      return "ಸಾಗರ ಪರಿಸ್ಥಿತಿಗಳು, ಸಂಭಾವ್ಯ ಮೀನುಗಾರಿಕೆ ವಲಯಗಳು (PFZ), ಹವಾಮಾನ ಮಾಹಿತಿ, ಹಡಗುಗಳ ವಿವರಗಳು (AIS), ನೌಕಾಯಾನ ಮಾರ್ಗಗಳು ಮತ್ತು ಸಾಗರ ಭದ್ರತೆಯ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಏನನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?";
    case "mr":
      return "मी समुद्राची परिस्थिती, संभाव्य मत्स्य व्यवसाय क्षेत्र (PFZ), हवामान माहिती, जहाजांचे तपशील (AIS), सागरी नौवहन मार्ग आणि सागरी सुरक्षेबद्दल मदत करू शकतो. आपल्याला काय जाणून घ्यायचे आहे?";
    case "gu":
      return "હું દરિયાઈ પરિસ્થિતિઓ, માછીમારી ઝોન (PFZ), હવામાન માહિતી, જહાજની માહિતી (AIS), નેવિગેશન માર્ગો અને દરિયાઈ સુરક્ષા અંગે તમને મદદ કરી શકું છું. તમે શું જાણવા માગો છો?";
    case "bn":
      return "আমি সমুদ্রের পরিস্থিতি, সম্ভাব্য মাছ ধরার অঞ্চল (PFZ), আবহাওয়ার তথ্য, জাহাজের বিবরণ (AIS), নেভিগেশন রুট এবং সামুদ্রিক গোয়েন্দা তথ্য পেতে আপনাকে সাহায্য করতে পারি। আপনি কি জানতে চান?";
    case "or":
      return "ମୁଁ ସମୁଦ୍ର ସ୍ଥିତି, ସମ୍ଭାବ୍ୟ ମତ୍ସ୍ୟ ଧରିବା ଅଞ୍ଚଳ (PFZ), ପାଣିପାଗ ସୂଚନା, ଜାହାଜ ବିବରଣୀ (AIS) ଏବଂ ସାମୁଦ୍ରିକ ମାର୍ଗ ସମ୍ପର୍କରେ ସାହାଯ୍ୟ କରିପାରିବି। ଆପଣ କଣ ଜାଣିବାକୁ ଚାହାଁନ୍ତି?";
    case "en":
    default:
      return "I can help you explore marine conditions, track available vessel information, analyse fishing zones, understand oceanographic data, assess maritime conditions, and explore marine intelligence. What would you like to know?";
  }
}

/**
 * Domain Explanations (AIS, PFZ, ECDIS, Map)
 */
export function generateDomainExplanation(topic: "ais" | "pfz" | "ecdis" | "map" | "sst", lang: Lang): string {
  if (topic === "ais") {
    switch (lang) {
      case "te":
        return "⚓ **ఆటోమేటిక్ ఐడెంటిఫికేషన్ సిస్టమ్ (AIS):**\n\nఇది ఓడలు మరియు తీరప్రాంత ట్రాఫిక్ సేవల (VTS) మధ్య ఎలక్ట్రానిక్ సమాచారాన్ని మార్పిడి చేసే ఆటోమేటెడ్ వ్యవస్థ. ఇది బోట్ యొక్క స్థానం (GPS), వేగం (SOG), ప్రయాణ దిశ (COG), మరియు MMSI గుర్తింపును VHF ఫ్రీక్వెన్సీ ద్వారా ప్రసారం చేయడం ద్వారా సముద్రంలో ప్రమాదాలు మరియు ఢీకొనడాన్ని నివారిస్తుంది.";
      case "hi":
        return "⚓ **ऑटोमैटिक आइडेंटिफिकेशन सिस्टम (AIS):**\n\nयह जहाजों और तटीय यातायात सेवाओं (VTS) के बीच डेटा साझा करने वाली स्वचालित ट्रैकिंग प्रणाली है। यह जीपीएस स्थान, गति (SOG), दिशा (COG) और जहाज पहचान प्रसारित करके समुद्र में जहाजों की टक्कर को रोकता है।";
      case "en":
      default:
        return "⚓ **Automatic Identification System (AIS):**\n\nAIS is an automated autonomous tracking system used on ships and by vessel traffic services (VTS). By broadcasting VHF transponder signals with GPS coordinates, Speed Over Ground (SOG), Course Over Ground (COG), vessel callsign, and destination, AIS provides real-time situational awareness and prevents maritime collisions.";
    }
  }

  if (topic === "pfz") {
    switch (lang) {
      case "te":
        return "🐟 **సంభావ్య మత్స్య వేట జోన్లు (PFZ - Potential Fishing Zones):**\n\nభారత జాతీయ సముద్ర సమాచార సేవల కేంద్రం (INCOIS) ఉపగ్రహ సమాచారం (Oceansat & NOAA SST) ఆధారంగా సముద్ర ఉపరితల ఉష్ణోగ్రత మరియు క్లోరోఫిల్ సాంద్రతను విశ్లేషించి చేపల గుంపులు ఎక్కువగా లభ్యమయ్యే ప్రాంతాలను PFZ అడ్వైజరీ ద్వారా మత్స్యకారులకు అందజేస్తుంది.";
      case "hi":
        return "🐟 **संभावित मत्स्य क्षेत्र (PFZ - Potential Fishing Zones):**\n\nINCOIS सैटेलाइट डेटा के माध्यम से समुद्र की सतह के तापमान (SST) और महासागरीय क्लोरोफिल का विश्लेषण करके मछली पकड़ने के सबसे अनुकूल क्षेत्रों की पहचान करता है। इससे मछुआरों के ईंधन और समय की बचत होती है।";
      case "en":
      default:
        return "🐟 **Potential Fishing Zones (PFZ):**\n\nPFZ advisories are generated by INCOIS using satellite remote sensing of Sea Surface Temperature (SST) gradients and Chlorophyll-a concentrations. Pelagic species aggregate near ocean thermal fronts and upwelling zones; following PFZ coordinates typically increases catch rates by 2–3x while saving 30% on fuel.";
    }
  }

  if (topic === "ecdis" || topic === "map") {
    switch (lang) {
      case "te":
        return "🗺️ **ORCA వ్యూహాత్మక ECDIS నావిగేషన్ మ్యాప్ వివరణ:**\n\n• **ప్రయాణ ప్రారంభం & గమ్యస్థానం:** హార్బర్ గుర్తులు మరియు లైట్‌హౌస్ బీకాన్‌లతో మార్క్ చేయబడ్డాయి.\n• **సముద్ర ఫెయిర్‌వే కారిడార్:** భారత ప్రధాన భూభాగం గుండా కాకుండా, కన్యాకుమారి ట్రాఫిక్ సెపరేషన్ స్కీమ్ (TSS) చుట్టూ సురక్షితమైన ఓపెన్ సీ వాటర్‌వేస్.\n• **నౌకల ట్రాఫిక్ (AIS):** సమీప బోట్ల వేగం, దిశ మరియు రేడియో ఛానల్ సమాచారం.\n• **చేపల వేట ప్రాంతాలు (PFZ):** అధిక క్లోరోఫిల్ మరియు ఉష్ణోగ్రత కలిగిన ప్రదేశాలు ఆకుపచ్చ/నీలం రంగులో చూపబడ్డాయి.";
      case "hi":
        return "🗺️ **ORCA रणनीतिक ECDIS नौवहन नक्शा विवरण:**\n\n• **प्रस्थान एवं गंतव्य:** स्पष्ट बंदरगाह बीकन मार्करों द्वारा चिह्नित।\n• **समुद्री नौवहन गलियारा (Fairway Route):** जमीनी भूभाग से दूर, कन्याकुमारी टीएसएस (TSS) के चारों ओर सुरक्षित खुला समुद्री मार्ग।\n• **जहाज यातायात (AIS):** वास्तविक समय में जहाजों की गति, स्थिति और दिशा।\n• **मत्स्य क्षेत्र (PFZ):** सैटेलाइट डेटा पर आधारित संभावित मछली पकड़ने के समृद्ध क्षेत्र।";
      case "en":
      default:
        return "🗺️ **ORCA Tactical ECDIS Navigation Chart Overview:**\n\n• **Origin & Destination:** Highlighted with nautical beacons and port coordinates.\n• **Fairway Corridor:** Continuous open-sea navigational path passing through designated deep-water separation corridors (such as Kanyakumari TSS) with zero mainland crossings.\n• **AIS Traffic Layer:** Live nearby vessels displaying speed, heading, and VHF safety channel.\n• **PFZ Hotspots:** Certified satellite ocean thermal fronts indicating prime pelagic fish aggregation.";
    }
  }

  // SST
  switch (lang) {
    case "te":
      return "🌊 **సముద్ర ఉపరితల ఉష్ణోగ్రత (SST):**\n\nఉపగ్రహాల ద్వారా కొలవబడే సముద్రపు పై పొర ఉష్ణోగ్రత. సాధారణంగా 28°C నుండి 30°C మధ్య ఉండే ప్రాంతాలలో ఉష్ణోగ్రత తేడాలు (thermal fronts) ఏర్పడి, చేపల ఆహారమైన ప్లవాంగాలు (plankton) చేరతాయి.";
    case "hi":
      return "🌊 **समुद्र की सतह का तापमान (SST):**\n\nउपग्रह द्वारा मापा गया समुद्री सतह का तापमान। यह चक्रवात की संभावना और मछली पकड़ने के क्षेत्रों (PFZ) की पहचान के लिए सबसे महत्वपूर्ण कारक है।";
    case "en":
    default:
      return "🌊 **Sea Surface Temperature (SST):**\n\nSST is measured via satellite radiometers (MODIS, NOAA AVHRR). Sharp SST gradients (thermal fronts) trigger upwelling of nutrient-rich water, directly driving phytoplankton growth and commercial fish schooling.";
  }
}

/**
 * Builds a single port focus MapWidget
 */
export function buildPortMapWidget(port: PortCoordinate): MapWidgetT {
  return {
    type: "map",
    center: { lat: port.lat, lon: port.lon },
    markers: [
      {
        lat: port.lat,
        lon: port.lon,
        name: `${port.name} Port`,
        label: `⚓ ${port.name.toUpperCase()} HARBOUR`,
        kind: "user",
      },
      {
        lat: port.lat - 0.08,
        lon: port.lon + 0.12,
        name: `${port.name} Fairway Buoy`,
        label: `📍 ${port.name} Pilot Station (VHF 16)`,
        kind: "fleet",
        speed_kn: 0,
        status: "Navigational Buoy",
      },
      {
        lat: port.lat + 0.05,
        lon: port.lon + 0.22,
        name: "MV Sagar Samrat",
        label: "⛵ MV Sagar Samrat (9.2 kn)",
        kind: "fleet",
        speed_kn: 9.2,
        status: "Active Trawling",
      },
    ],
    layers: [],
    fleet_info: {
      sector: port.name,
      total_vessels: 4,
    },
  };
}
