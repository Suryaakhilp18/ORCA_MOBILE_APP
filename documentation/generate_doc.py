"""Generates ORCA_Project_Documentation.docx — Mini Project Documentation in Word format."""
import os
import datetime
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

NAVY = RGBColor(0x0A, 0x19, 0x24)
BLUE = RGBColor(0x02, 0x84, 0xC7)
DARK = RGBColor(0x0F, 0x17, 0x2A)
GREY = RGBColor(0x47, 0x55, 0x69)

OUTPUT_PATH_1 = os.path.join(os.path.dirname(__file__), "ORCA_Project_Documentation.docx")
OUTPUT_PATH_2 = os.path.join(os.path.dirname(__file__), "..", "ORCA_Project_Documentation.docx")

doc = Document()

# Base styling
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)
normal.font.color.rgb = DARK

for i in range(1, 4):
    h = doc.styles[f"Heading {i}"]
    h.font.color.rgb = BLUE if i == 1 else NAVY
    h.font.name = "Calibri"
    h.font.bold = True

def set_cell_shading(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)

def h1(text):
    doc.add_heading(text, level=1)

def h2(text):
    doc.add_heading(text, level=2)

def para(text, bold=False, italic=False, size=11, color=None):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = bold
    r.italic = italic
    r.font.size = Pt(size)
    if color:
        r.font.color.rgb = color
    return p

def bullet(text):
    p = doc.add_paragraph(style="List Bullet")
    p.add_run(text)
    return p

def table_with_header(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Light Grid Accent 1"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = t.rows[0].cells
    for i, htext in enumerate(headers):
        hdr_cells[i].text = ""
        p = hdr_cells[i].paragraphs[0]
        r = p.add_run(htext)
        r.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_shading(hdr_cells[i], "0284C7")
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = str(val)
            for p in cells[i].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9.5)
    doc.add_paragraph()
    return t

# ---------------- 1. Cover Page ----------------
for _ in range(2):
    doc.add_paragraph()

p_super = doc.add_paragraph()
p_super.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_super = p_super.add_run("MINI PROJECT DOCUMENTATION REPORT")
r_super.font.size = Pt(14)
r_super.font.bold = True
r_super.font.color.rgb = BLUE

p_title = doc.add_paragraph()
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_title = p_title.add_run("ORCA MOBILE 2.0")
r_title.font.size = Pt(38)
r_title.font.bold = True
r_title.font.color.rgb = NAVY

p_sub = doc.add_paragraph()
p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_sub = p_sub.add_run("Ocean Risk & Coastal Advisory: Agentic AI Marine Intelligence & Seaward Navigation System")
r_sub.font.size = Pt(14)
r_sub.font.color.rgb = DARK

doc.add_paragraph()

cover_rows = [
    ["Project Title", "ORCA MOBILE 2.0 — Agentic AI Marine Intelligence & Seaward Fairway Routing"],
    ["Project Category", "Mini Project / Capstone Engineering Project (Individual)"],
    ["Student Name", "P. Surya Akhil"],
    ["Roll Number / Student ID", "25B11CS717"],
    ["Academic Department", "Department of Computer Science & Engineering / Information Technology"],
    ["Team Identification", "Team ORCA (Individual Project)"],
    ["GitHub Repository", "https://github.com/Suryaakhilp18/ORCA_MOBILE_APP.git"],
    ["Academic Year", "2025 – 2026"],
    ["Submission Date", datetime.datetime.now().strftime("%B %d, %Y")],
]
table_with_header(["Cover Detail", "Particulars"], cover_rows)

doc.add_page_break()

# ---------------- 2. Project Overview & Objectives ----------------
h1("2. Project Overview & Objectives")

h2("2.1 Project Description (100–150 Words)")
para(
    "ORCA Mobile 2.0 (Ocean Risk & Coastal Advisory) is an agentic AI-powered marine intelligence "
    "platform and navigational copilot engineered specifically for India's artisanal and mechanized fishing communities, "
    "commercial coastal vessel operators, maritime researchers, and disaster response authorities. Built with an Expo "
    "React Native frontend and a FastAPI backend, ORCA integrates real-time oceanographic and meteorological telemetry "
    "from IMD and INCOIS. The system combines a sub-second 7-agent LLM pipeline with a 100% deterministic safety engine "
    "that calculates sea-readiness verdicts (SAFE, CAUTION, UNSAFE). ORCA features zero-land-crossing parabolic fairway "
    "routing (including cross-coast Cape Comorin Kanyakumari TSS navigation), an interactive ECDIS map with live nautical HUD, "
    "comprehensive coverage of 28 Indian coastal ports across all 9 coastal states and 3 Union Territories, and full hands-free "
    "voice interaction synchronized across 10 coastal Indian languages in both pure light and deep oceanic dark modes."
)

h2("2.2 Problem It Solves")
bullet("Dangerous Inland Chords: Straight-line navigation intersects coastal bends and promontories, causing ship groundings.")
bullet("AI Hallucinations in Marine Safety: Standard chat models invent weather advice; ORCA enforces deterministic thresholds.")
bullet("Language & Accessibility Barriers: Artisanal fishers need native spoken voice guidance in rough sea conditions.")
bullet("Marine Protected Area Breaches: Accidental incursions into wildlife sanctuaries (Coringa, Gahirmatha) cause vessel seizures.")
bullet("Fuel Inefficiency: Fishermen search blindly without integrated SST and Chlorophyll-a Potential Fishing Zone guidance.")
bullet("Offline Disconnections: App maintains complete in-memory uptime when remote databases or cellular towers drop.")

h2("2.3 Main Objectives")
bullet("Implement an immutable, deterministic safety engine based on IMD and INCOIS thresholds.")
bullet("Guarantee zero-land-crossing maritime routes via parabolic seaward offset math and Kanyakumari TSS.")
bullet("Catalog 28 strategic ports with verified deep-water fairways across all 9 coastal states and 3 Union Territories.")
bullet("Provide full 10-language synchronization across all 4 app tabs with pre-warmed voice synthesis.")
bullet("Deliver real-time ECDIS navigational cartography with live Heading, Distance (NM/km), and 8-knot cruising ETA.")
bullet("Maintain 100% Theme Purity (Pure Light Mode and Oceanic Dark Mode) with zero color clashes.")

# ---------------- 3. Technology Stack ----------------
h1("3. Technology Stack")
tech_rows = [
    ["Python 3.14 & TypeScript 5.9", "Core Backend and Frontend Programming Languages"],
    ["Expo 54 & React Native 0.81", "Cross-Platform Mobile Application Engine (Web, Android, iOS)"],
    ["FastAPI 0.110 & Uvicorn", "Asynchronous High-Throughput REST API Microframework"],
    ["Leaflet & MapLibre GL", "Interactive Nautical ECDIS Cartography & GeoJSON Layer Engine"],
    ["MongoDB 7.0 & Motor", "Geospatial 2dsphere Database with Automated In-Memory Fallback"],
    ["Google Gemini 3.5 Flash", "Multi-Agent Intent Recognition & Regional Dialect Synthesis"],
    ["Web Speech API & ElevenLabs", "Acoustic Speech-to-Text & Native Locale Spoken Audio"],
    ["IMD & INCOIS Telemetry", "Live Sustained Wind, Wave Height, Swell, SST & Chlorophyll-a Feeds"],
]
table_with_header(["Technology Component", "Function in ORCA Mobile 2.0"], tech_rows)

# ---------------- 4. Features & Implementation ----------------
h1("4. Features & Implementation")
h2("4.1 7-Agent Marine Intelligence Pipeline")
bullet("Planner Agent: Intent extraction, port recognition, script categorization, and inland city rejection.")
bullet("Data Discovery Agent: Maps entities to the 28-region maritime registry and activates spatial layers.")
bullet("Weather Intelligence Agent: Ingests IMD sustained wind, gust velocities, wave heights, and cyclonic storm bulletins.")
bullet("Ocean Analytics Agent: Ingests INCOIS SST (27-29°C) and Chlorophyll-a (>1.5 mg/m³) for PFZ targeting.")
bullet("Geospatial / Risk Agent: Calculates Haversine distances, parabolic seaward fairways, and polygon geofences.")
bullet("Fleet Operations Specialist: Monitors simulated live AIS craft positions, vessel classes, speeds, and VHF channels (Ch 16/68).")
bullet("Synthesizer Agent: Formulates concise, natural spoken regional guidance strictly preserving deterministic verdicts.")

h2("4.2 Deterministic Safety Engine (rules.py)")
rule_rows = [
    ["Active Cyclone / Deep Depression", "Present in sector", "UNSAFE (Crimson Red Banner)"],
    ["Sustained Wind Speed", "> 25 knots (> 46.3 km/h)", "UNSAFE (Crimson Red Banner)"],
    ["Sustained Wind Speed", "18 – 25 knots (33.3 – 46.3 km/h)", "CAUTION (Amber Alert Card)"],
    ["Significant Wave Height", "> 2.5 meters", "UNSAFE (Crimson Red Banner)"],
    ["Significant Wave Height", "1.8 – 2.5 meters", "CAUTION (Amber Alert Card)"],
    ["Thunderstorm / Lightning", ">= 70% probability", "UNSAFE (Crimson Red Banner)"],
    ["Thunderstorm / Lightning", "40% – 69% probability", "CAUTION (Amber Alert Card)"],
    ["Normal Coastal Conditions", "Wind < 18 kn, Wave < 1.8 m, Light < 40%", "SAFE (Emerald Green Card)"],
]
table_with_header(["Weather Parameter", "Threshold Condition", "Safety Verdict"], rule_rows)

# ---------------- 5. Screenshots & Results ----------------
h1("5. Screenshots & Results")
para("Screen 1: Marine Copilot Chat & Seaward ECDIS Map Route View (index.tsx)")
para("Screen 2: Sector Marine Dashboard & Potential Fishing Zone Radar (home.tsx)")
para("Screen 3: Real-Time IMD Cyclone & Lightning Hazard Feeds (alerts.tsx)")
para("Screen 4: Saved Marine Fairways & 28-Region Roadstead Selector (saved.tsx)")

test_rows = [
    ["test_unit_rules_and_spatial.py", "Safety verdicts, parabolic curves, Kanyakumari TSS, geofencing", "10 / 10 PASSED"],
    ["test_api_integration.py", "FastAPI endpoints: /api/chat, /situation, /alerts, /regions, /health", "7 / 7 PASSED"],
    ["test_unit_live_marine.py", "IMD/INCOIS telemetry ingestion, SST/Chlorophyll, in-memory fallback", "3 / 3 PASSED"],
    ["TypeScript Static Typecheck", "npx tsc --noEmit across all frontend components and hooks", "0 ERRORS"],
]
table_with_header(["Test Suite", "Coverage Scope", "Result"], test_rows)
para("Overall Automated Test Status: 20 / 20 Tests Passing (100% Pass Rate).", bold=True)

# ---------------- 6. AI Usage & Individual Contributions ----------------
h1("6. AI Usage & Individual Contributions")
h2("6.1 Ethical AI Usage")
para("Google Gemini 3.5 Flash is used for language parsing and regional synthesis, but NEVER computes navigational coordinates or safety verdicts. All safety determinations are made mathematically by deterministic code.")

h2("6.2 Individual Contributions")
author_rows = [
    ["Student Name", "P. Surya Akhil"],
    ["Roll Number", "25B11CS717"],
    ["Project Ownership", "Individual Mini Project / Capstone Engineering Project"],
    ["Key Contributions", "System Architecture, Deterministic Rules Engine, Seaward Parabolic Fairway Geometry, Kanyakumari TSS Crossover, 28-Port Registry, Expo Mobile Client, Voice Marine Copilot, and 20-Test Automated Suite"],
]
table_with_header(["Author Attribute", "Details"], author_rows)

doc.save(OUTPUT_PATH_1)
import shutil
shutil.copyfile(OUTPUT_PATH_1, OUTPUT_PATH_2)
print("Successfully generated Word documentation.")
