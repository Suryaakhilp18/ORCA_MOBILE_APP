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

start = {'name': 'Kakinada Port', 'lat': 16.9891, 'lon': 82.2475}
end = {'name': 'Mumbai Port', 'lat': 18.9220, 'lon': 72.8347}

i_start, d_s = find_nearest_idx(start['lat'], start['lon'])
i_end, d_e = find_nearest_idx(end['lat'], end['lon'])
print(f"Start nearest: {COASTAL_SEA_CORRIDOR[i_start]['name']} ({d_s:.1f} km)")
print(f"End nearest: {COASTAL_SEA_CORRIDOR[i_end]['name']} ({d_e:.1f} km)")

step = 1 if i_end >= i_start else -1
corridor = [COASTAL_SEA_CORRIDOR[i] for i in range(i_start, i_end + step, step)]
print(f"Corridor waypoints count: {len(corridor)}")

# Subsample or include all
pts = [(start['lat'], start['lon'], start['name'])]
for c in corridor:
    pts.append((c['lat'], c['lon'], c['name']))
pts.append((end['lat'], end['lon'], end['name']))

total_dist = 0
for i in range(len(pts)-1):
    total_dist += haversine(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1])

print(f"Total Sea Route Distance: {total_dist:.1f} km / {total_dist*0.539957:.1f} NM")
print("Waypoints:")
for p in pts:
    print(f"  {p[2]}: {p[0]:.4f}N, {p[1]:.4f}E")
