"""
AdmitWise — JoSAA Data Preprocessing Script
============================================
Input:  data/raw/RankMitra_Master_Cutoffs.csv  (~420K rows)
Output: data/processed/cutoffs.json            (full clean dataset)
        data/processed/meta.json               (unique values for UI dropdowns)

Run:    python data/scripts/preprocess.py
"""

import pandas as pd
import json
import re
import os
from pathlib import Path

ROOT = Path(__file__).parent

RAW_CSV = "/Users/safatasneemfatima/Documents/RankMitra/JOSA_PROJECT_ZIP/RankMitra_Master_Cutoffs.csv"

OUT_DIR = ROOT / "generated"
OUT_JSON = OUT_DIR / "cutoffs.json"
META_JSON = OUT_DIR / "meta.json"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────
# 1. LOAD
# ─────────────────────────────────────────────
print("Loading CSV…")
df = pd.read_csv(RAW_CSV, dtype=str)
df["year"]  = df["year"].astype(int)
df["round"] = df["round"].astype(int)
print(f"  Loaded {len(df):,} rows")

# ─────────────────────────────────────────────
# 2. DROP NULLS
# ─────────────────────────────────────────────
before = len(df)
df = df.dropna(subset=["Institute", "Academic Program Name", "Opening Rank", "Closing Rank"])
print(f"  Dropped {before - len(df)} fully-null rows → {len(df):,} remaining")

# ─────────────────────────────────────────────
# 3. CLEAN WHITESPACE
# ─────────────────────────────────────────────
str_cols = ["Institute", "Academic Program Name", "Quota", "Seat Type", "Gender",
            "Opening Rank", "Closing Rank"]
for col in str_cols:
    df[col] = df[col].str.strip()
    df[col] = df[col].str.replace(r"\s{2,}", " ", regex=True)

print("  Cleaned whitespace (collapsed double spaces)")

# ─────────────────────────────────────────────
# 4. HANDLE PwD RANK SUFFIX ("119P" → 119, is_pwd_rank=True)
# ─────────────────────────────────────────────
def parse_rank(val):
    """Returns (int_rank, is_pwd_rank). Non-numeric → None."""
    val = str(val).strip()
    if val.endswith("P"):
        try:
            return int(val[:-1]), True
        except ValueError:
            return None, True
    try:
        return int(val), False
    except ValueError:
        return None, False

df[["opening_rank_int", "opening_is_pwd"]] = df["Opening Rank"].apply(
    lambda v: pd.Series(parse_rank(v))
)
df[["closing_rank_int", "closing_is_pwd"]] = df["Closing Rank"].apply(
    lambda v: pd.Series(parse_rank(v))
)

pwd_rows = df["opening_is_pwd"].sum()
print(f"  Parsed rank integers; {pwd_rows:,} rows have PwD-list ranks (P suffix)")

# ─────────────────────────────────────────────
# 5. DERIVE INSTITUTE TYPE
# ─────────────────────────────────────────────
# Order matters: check IIT before the generic "Indian Institute" catch-all

IIT_NAMES = {
    "Indian Institute of Technology Bhubaneswar",
    "Indian Institute of Technology Bombay",
    "Indian Institute of Technology Delhi",
    "Indian Institute of Technology Gandhinagar",
    "Indian Institute of Technology Guwahati",
    "Indian Institute of Technology Hyderabad",
    "Indian Institute of Technology Indore",
    "Indian Institute of Technology Jodhpur",
    "Indian Institute of Technology Kanpur",
    "Indian Institute of Technology Kharagpur",
    "Indian Institute of Technology Madras",
    "Indian Institute of Technology Mandi",
    "Indian Institute of Technology Palakkad",
    "Indian Institute of Technology Patna",
    "Indian Institute of Technology Roorkee",
    "Indian Institute of Technology Ropar",
    "Indian Institute of Technology Tirupati",
    "Indian Institute of Technology Bhilai",
    "Indian Institute of Technology Dharwad",
    "Indian Institute of Technology Goa",
    "Indian Institute of Technology Jammu",
    "Indian Institute of Technology (BHU) Varanasi",
    "Indian Institute of Technology (ISM) Dhanbad",
    # Older spellings that appear post-whitespace-fix:
    "Indian Institute of Technology (ISM) Dhanbad",
}

def get_institute_type(name):
    name = str(name)
    # Explicit IIT set check (most reliable after cleaning)
    if name in IIT_NAMES:
        return "IIT"
    # Fallback pattern — catches any "Indian Institute of Technology X" not in set
    if re.search(r"Indian Institute of Technology", name, re.IGNORECASE) and \
       not re.search(r"Information", name, re.IGNORECASE):
        return "IIT"
    if re.search(r"National Institute of Technology|Malaviya National|Maulana Azad National|"
                 r"Motilal Nehru National|Sardar Vallabhbhai National|Visvesvaraya National|"
                 r"Dr\. B R Ambedkar National", name, re.IGNORECASE):
        return "NIT"
    if re.search(r"Indian Institute of Information Technology|INDIAN INSTITUTE OF INFORMATION TECHNOLOGY|"
                 r"Atal Bihari Vajpayee|Pt\. Dwarka", name, re.IGNORECASE):
        return "IIIT"
    return "GFTI"

df["institute_type"] = df["Institute"].apply(get_institute_type)

type_counts = df["institute_type"].value_counts()
print(f"  Institute types: { {k: f'{v:,}' for k, v in type_counts.items()} }")

# ─────────────────────────────────────────────
# 6. INSTITUTE → STATE MAPPING
# ─────────────────────────────────────────────
# Used for HS/OS quota guidance in the UI
INSTITUTE_STATE = {
    # IITs (state = location state, AI quota only but useful for display)
    "Indian Institute of Technology Bhubaneswar": "Odisha",
    "Indian Institute of Technology Bombay": "Maharashtra",
    "Indian Institute of Technology Delhi": "Delhi",
    "Indian Institute of Technology Gandhinagar": "Gujarat",
    "Indian Institute of Technology Guwahati": "Assam",
    "Indian Institute of Technology Hyderabad": "Telangana",
    "Indian Institute of Technology Indore": "Madhya Pradesh",
    "Indian Institute of Technology Jodhpur": "Rajasthan",
    "Indian Institute of Technology Kanpur": "Uttar Pradesh",
    "Indian Institute of Technology Kharagpur": "West Bengal",
    "Indian Institute of Technology Madras": "Tamil Nadu",
    "Indian Institute of Technology Mandi": "Himachal Pradesh",
    "Indian Institute of Technology Palakkad": "Kerala",
    "Indian Institute of Technology Patna": "Bihar",
    "Indian Institute of Technology Roorkee": "Uttarakhand",
    "Indian Institute of Technology Ropar": "Punjab",
    "Indian Institute of Technology Tirupati": "Andhra Pradesh",
    "Indian Institute of Technology Bhilai": "Chhattisgarh",
    "Indian Institute of Technology Dharwad": "Karnataka",
    "Indian Institute of Technology Goa": "Goa",
    "Indian Institute of Technology Jammu": "Jammu & Kashmir",
    "Indian Institute of Technology (BHU) Varanasi": "Uttar Pradesh",
    "Indian Institute of Technology (ISM) Dhanbad": "Jharkhand",
    # NITs
    "National Institute of Technology Agartala": "Tripura",
    "National Institute of Technology Arunachal Pradesh": "Arunachal Pradesh",
    "National Institute of Technology Calicut": "Kerala",
    "National Institute of Technology Delhi": "Delhi",
    "National Institute of Technology Durgapur": "West Bengal",
    "National Institute of Technology Goa": "Goa",
    "National Institute of Technology Hamirpur": "Himachal Pradesh",
    "National Institute of Technology Karnataka, Surathkal": "Karnataka",
    "National Institute of Technology Meghalaya": "Meghalaya",
    "National Institute of Technology Nagaland": "Nagaland",
    "National Institute of Technology Patna": "Bihar",
    "National Institute of Technology Puducherry": "Puducherry",
    "National Institute of Technology Raipur": "Chhattisgarh",
    "National Institute of Technology Sikkim": "Sikkim",
    "National Institute of Technology, Andhra Pradesh": "Andhra Pradesh",
    "National Institute of Technology, Jamshedpur": "Jharkhand",
    "National Institute of Technology, Kurukshetra": "Haryana",
    "National Institute of Technology, Manipur": "Manipur",
    "National Institute of Technology, Mizoram": "Mizoram",
    "National Institute of Technology, Rourkela": "Odisha",
    "National Institute of Technology, Silchar": "Assam",
    "National Institute of Technology, Srinagar": "Jammu & Kashmir",
    "National Institute of Technology, Tiruchirappalli": "Tamil Nadu",
    "National Institute of Technology, Uttarakhand": "Uttarakhand",
    "National Institute of Technology, Warangal": "Telangana",
    "Malaviya National Institute of Technology Jaipur": "Rajasthan",
    "Maulana Azad National Institute of Technology Bhopal": "Madhya Pradesh",
    "Motilal Nehru National Institute of Technology Allahabad": "Uttar Pradesh",
    "Sardar Vallabhbhai National Institute of Technology, Surat": "Gujarat",
    "Visvesvaraya National Institute of Technology, Nagpur": "Maharashtra",
    "Dr. B R Ambedkar National Institute of Technology, Jalandhar": "Punjab",
}

df["institute_state"] = df["Institute"].map(INSTITUTE_STATE).fillna("")

# ─────────────────────────────────────────────
# 7. NORMALISE COLUMN NAMES (snake_case)
# ─────────────────────────────────────────────
df = df.rename(columns={
    "Institute":              "institute",
    "Academic Program Name":  "program",
    "Quota":                  "quota",
    "Seat Type":              "category",
    "Gender":                 "gender",
    "Opening Rank":           "opening_rank_raw",
    "Closing Rank":           "closing_rank_raw",
    "year":                   "year",
    "round":                  "round",
})

# ─────────────────────────────────────────────
# 8. COMPUTE MAX ROUND PER (institute, program, quota, category, gender, year)
#    → flag rows that are the "final round" for that combination
# ─────────────────────────────────────────────
group_keys = ["institute", "program", "quota", "category", "gender", "year"]
df["max_round"] = df.groupby(group_keys)["round"].transform("max")
df["is_final_round"] = df["round"] == df["max_round"]

final_only = df["is_final_round"].sum()
print(f"  Final-round rows flagged: {final_only:,} of {len(df):,}")

# ─────────────────────────────────────────────
# 9. SELECT OUTPUT COLUMNS & SERIALISE
# ─────────────────────────────────────────────
out_cols = [
    "institute", "program", "quota", "category", "gender",
    "opening_rank_raw", "closing_rank_raw",
    "opening_rank_int", "closing_rank_int",
    "opening_is_pwd", "closing_is_pwd",
    "year", "round", "is_final_round",
    "institute_type", "institute_state",
]
df_out = df[out_cols].copy()

# Convert bool columns to plain Python bool for JSON
df_out["opening_is_pwd"]  = df_out["opening_is_pwd"].astype(bool)
df_out["closing_is_pwd"]  = df_out["closing_is_pwd"].astype(bool)
df_out["is_final_round"]  = df_out["is_final_round"].astype(bool)

# opening/closing_rank_int may be NaN (if rank was truly non-parseable); use None
df_out["opening_rank_int"] = df_out["opening_rank_int"].where(
    df_out["opening_rank_int"].notna(), other=None
)
df_out["closing_rank_int"] = df_out["closing_rank_int"].where(
    df_out["closing_rank_int"].notna(), other=None
)

print(f"\nSaving {len(df_out):,} rows to {OUT_JSON}…")
records = df_out.to_dict(orient="records")
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, separators=(",", ":"))
size_mb = os.path.getsize(OUT_JSON) / 1_048_576
print(f"  Saved → {size_mb:.1f} MB")

# ─────────────────────────────────────────────
# 10. META.JSON — dropdown values for the UI
# ─────────────────────────────────────────────
print("\nBuilding meta.json…")

years  = sorted(df_out["year"].unique().tolist())
rounds_by_year = {
    str(y): sorted(df_out[df_out["year"] == y]["round"].unique().tolist())
    for y in years
}
max_round_by_year = {
    str(y): int(df_out[df_out["year"] == y]["round"].max())
    for y in years
}

institutes = sorted(df_out["institute"].dropna().unique().tolist())
programs   = sorted(df_out["program"].dropna().unique().tolist())
quotas     = sorted(df_out["quota"].dropna().unique().tolist())
categories = sorted(df_out["category"].dropna().unique().tolist())
genders    = sorted(df_out["gender"].dropna().unique().tolist())
inst_types = ["IIT", "NIT", "IIIT", "GFTI"]

# Institute → type map
inst_type_map = df_out.groupby("institute")["institute_type"].first().to_dict()
inst_state_map = df_out.groupby("institute")["institute_state"].first().to_dict()

# Branch short names (strip duration suffix for display)
def short_branch(name):
    return re.sub(r"\s*\(.*?\)\s*$", "", name).strip()

branch_display = {p: short_branch(p) for p in programs}

meta = {
    "years": years,
    "rounds_by_year": rounds_by_year,
    "max_round_by_year": max_round_by_year,
    "institutes": institutes,
    "programs": programs,
    "quotas": quotas,
    "categories": categories,
    "genders": genders,
    "institute_types": inst_types,
    "inst_type_map": inst_type_map,
    "inst_state_map": inst_state_map,
    "branch_display": branch_display,
    "quota_descriptions": {
        "AI": "All India — open to students from any state",
        "HS": "Home State — students from the institute's state",
        "OS": "Other State — students from outside the institute's state",
        "JK": "Jammu & Kashmir domicile quota",
        "GO": "Goa domicile quota",
        "LA": "Ladakh domicile quota",
        "AP": "Andhra Pradesh special quota",
    },
    "category_descriptions": {
        "OPEN":          "General / Unreserved",
        "OBC-NCL":       "Other Backward Classes (Non-Creamy Layer)",
        "SC":            "Scheduled Caste",
        "ST":            "Scheduled Tribe",
        "EWS":           "Economically Weaker Section",
        "OPEN (PwD)":    "General — Persons with Disability",
        "OBC-NCL (PwD)": "OBC-NCL — Persons with Disability",
        "SC (PwD)":      "SC — Persons with Disability",
        "ST (PwD)":      "ST — Persons with Disability",
        "EWS (PwD)":     "EWS — Persons with Disability",
    },
}

with open(META_JSON, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print(f"  meta.json saved → {os.path.getsize(META_JSON) / 1024:.0f} KB")
print("\n✅ Preprocessing complete.")
print(f"   cutoffs.json : {os.path.getsize(OUT_JSON) / 1_048_576:.1f} MB  ({len(records):,} rows)")
print(f"   meta.json    : {os.path.getsize(META_JSON) / 1024:.0f} KB")
EOF
