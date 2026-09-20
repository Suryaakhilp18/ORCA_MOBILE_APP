import math

COASTAL_SEA_CORRIDOR = [
    {"name": "Digha Deep Offshore", "lat": 21.2500, "lon": 87.8500},
    {"name": "Dhamra / Paradip North Fairway", "lat": 20.6500, "lon": 87.3500},
    {"name": "Paradip Outer Fairway", "lat": 20.1500, "lon": 86.9500},
    {"name": "Gopalpur Deep Sea Corridor", "lat": 19.1000, "lon": 85.1500},
    {"name": "Kalingapatnam Offshore", "lat": 18.2000, "lon": 84.3000},
    {"name": "Visakhapatnam Deep Fairway", "lat": 17.6000, "lon": 83.4500},
    {"name": "Kakinada Offshore Fairway", "lat": 16.9000, "lon": 82.5000},
    {"name": "Machilipatnam Deep Fairway", "lat": 16.0500, "lon": 81.4500},
    {"name": "Nizampatnam / Ongole Offshore", "lat": 15.4000, "lon": 80.6000},
    {"name": "Krishnapatnam Offshore", "lat": 14.2500, "lon": 80.3500},
    {"name": "Pulicat Outer Fairway", "lat": 13.4000, "lon": 80.4500},
    {"name": "Chennai Outer Fairway", "lat": 13.1000, "lon": 80.4500},
    {"name": "Puducherry Offshore Corridor", "lat": 11.9000, "lon": 80.0500},
    {"name": "Cuddalore / Nagapattinam Fairway", "lat": 10.7500, "lon": 80.0500},
    {"name": "Point Calimere Deep Fairway", "lat": 10.2500, "lon": 80.2000},
    {"name": "Palk Strait Outer Deep Fairway", "lat": 9.2000, "lon": 80.2500},
    {"name": "Gulf of Mannar Deep Passage", "lat": 8.4000, "lon": 79.2000},
    {"name": "Tuticorin Outer Fairway", "lat": 8.6500, "lon": 78.4000},
    {"name": "Kanyakumari Southern TSS Fairway", "lat": 7.6500, "lon": 77.6000},
    {"name": "Vizhinjam Deep Fairway", "lat": 8.3000, "lon": 76.7500},
    {"name": "Kollam Offshore Corridor", "lat": 8.8500, "lon": 76.3500},
    {"name": "Kochi Deep Fairway", "lat": 9.9000, "lon": 75.9000},
    {"name": "Ponnani Offshore", "lat": 10.7500, "lon": 75.6500},
    {"name": "Kozhikode (Calicut) Offshore", "lat": 11.2000, "lon": 75.4500},
    {"name": "Kannur Offshore Corridor", "lat": 11.8500, "lon": 75.1000},
    {"name": "Mangalore Deep Fairway", "lat": 12.8500, "lon": 74.5500},
    {"name": "Malpe / Udupi Offshore", "lat": 13.3500, "lon": 74.3500},
    {"name": "Bhatkal Offshore", "lat": 13.9500, "lon": 74.2000},
    {"name": "Karwar Offshore Corridor", "lat": 14.7500, "lon": 73.8500},
    {"name": "Goa (Mormugao) Outer Fairway", "lat": 15.3500, "lon": 73.5000},
    {"name": "Malvan Deep Offshore", "lat": 16.0500, "lon": 73.2000},
    {"name": "Ratnagiri Deep Fairway", "lat": 16.9000, "lon": 73.0000},
    {"name": "Jaigad Offshore Corridor", "lat": 17.3500, "lon": 72.8500},
    {"name": "Dighi / Janjira Offshore", "lat": 18.2500, "lon": 72.7000},
    {"name": "Mumbai Deep Approach Fairway", "lat": 18.8500, "lon": 72.5500},
    {"name": "Daman / Surat Outer Corridor", "lat": 20.6500, "lon": 71.9000},
    {"name": "Veraval / Somnath Deep Fairway", "lat": 20.7500, "lon": 70.2000},
    {"name": "Porbandar Offshore Corridor", "lat": 21.5500, "lon": 69.4000},
    {"name": "Okha / Dwarka Deep Fairway", "lat": 22.4500, "lon": 68.8500},
    {"name": "Kandla / Gulf of Kutch Fairway", "lat": 22.7000, "lon": 69.6000},
]

def haversine(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def find_nearest_idx(lat, lon):
    best_i = 0
    best_d = 1e9
    for i, w in enumerate(COASTAL_SEA_CORRIDOR):
        d = haversine(lat, lon, w['lat'], w['lon'])
        if d < best_d:
            best_d = d
            best_i = i
    return best_i, best_d

def build_sea_route(start, end, target_samples=11):
    s_lat, s_lon = start['lat'], start['lon']
    e_lat, e_lon = end['lat'], end['lon']
    d_direct = haversine(s_lat, s_lon, e_lat, e_lon)
    if d_direct < 35:
        pts = [(s_lat, s_lon, f"START: {start.get('name', 'Origin')}")]
        for i in range(1, target_samples):
            t = i / target_samples
            lat = s_lat + (e_lat - s_lat)*t
            lon = s_lon + (e_lon - s_lon)*t
            pts.append((lat, lon, f"Checkpoint {i}"))
        pts.append((e_lat, e_lon, f"DESTINATION: {end.get('name', 'Destination')}"))
        return pts

    i_start, _ = find_nearest_idx(s_lat, s_lon)
    i_end, _ = find_nearest_idx(e_lat, e_lon)

    if i_start == i_end:
        full_corridor = [COASTAL_SEA_CORRIDOR[i_start]]
    else:
        step = 1 if i_end > i_start else -1
        full_corridor = [COASTAL_SEA_CORRIDOR[i] for i in range(i_start, i_end + step, step)]

    # Check if voyage goes around Kanyakumari TSS (index 18)
    # If corridor crosses index 18, we MUST ensure Kanyakumari TSS is an explicit waypoint!
    k_idx = 18
    cape_in_corridor = any(wp['name'] == 'Kanyakumari Southern TSS Fairway' for wp in full_corridor)

    if len(full_corridor) <= target_samples - 2:
        selected_mid = full_corridor
    elif cape_in_corridor:
        # Split into Leg 1 (up to Cape) and Leg 2 (from Cape onwards)
        c_pos = next(idx for idx, wp in enumerate(full_corridor) if wp['name'] == 'Kanyakumari Southern TSS Fairway')
        leg1 = full_corridor[:c_pos]
        cape_wp = full_corridor[c_pos]
        leg2 = full_corridor[c_pos+1:]

        # Allocate mid points: e.g. target_samples = 11 -> 9 mid points (4 in leg1, 1 cape, 4 in leg2)
        half = (target_samples - 3) // 2
        rem = (target_samples - 3) - half

        sel1 = [leg1[int(round(i * (len(leg1)-1) / max(half-1, 1)))] for i in range(half)] if leg1 else []
        sel2 = [leg2[int(round(i * (len(leg2)-1) / max(rem-1, 1)))] for i in range(rem)] if leg2 else []
        selected_mid = sel1 + [cape_wp] + sel2
    else:
        max_mid = target_samples - 2
        selected_mid = [full_corridor[int(round(j * (len(full_corridor)-1) / (max_mid-1)))] for j in range(max_mid)]

    pts = [(s_lat, s_lon, f"START: {start.get('name', 'Origin')}")]
    for wp in selected_mid:
        pts.append((wp['lat'], wp['lon'], wp['name']))
    pts.append((e_lat, e_lon, f"DESTINATION: {end.get('name', 'Destination')}"))
    return pts, full_corridor

start = {'name': 'Kakinada Port', 'lat': 16.9891, 'lon': 82.2475}
end = {'name': 'Mumbai Port', 'lat': 18.9220, 'lon': 72.8347}
route, full_c = build_sea_route(start, end, 11)
print(f"Waypoints count: {len(route)}")
for idx, (lat, lon, name) in enumerate(route):
    print(f"WP {idx}: {name} ({lat:.4f}N, {lon:.4f}E)")
