import os
import requests
import time

# ============ CONFIG ============
# Before running, set these env vars:
#   KURATION_API_KEY  — Kuration API key
#   SUPABASE_KEY      — Supabase service-role / secret key

KURATION_PROJECT_ID = "b40dd7cd-ed62-42b5-8723-888a0458e6bf"
KURATION_API_KEY = os.environ.get("KURATION_API_KEY", "")

SUPABASE_URL = "https://vdjlchydvcvubuwqgiiu.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# ============ COLUMN MAPPING ============

COLUMN_MAP = {
    "8e7aa696-9623-4c6c-a31c-249226f6c48a": "full_name",
    "8ee02128-5769-4830-90ee-c2273e5fbcb9": "first_name",
    "ce9b7200-2540-44e9-9a5c-513e42ca0dd4": "last_name",
    "b05e08b0-ac83-4a78-9a40-c4e28556a64f": "title",
    "6fdd6e77-c3fd-43ab-a081-8114f2ac8ed4": "company",
    "fddd388d-22cf-40bc-a248-e74ffb288d59": "company_linkedin",
    "ef09ff1d-56c4-4dcc-a8db-4fe1278cd1a3": "linkedin_url",
    "325ef18f-1876-4bad-ab46-fdbd8288630a": "location",
    "ce656b6f-1918-4ce3-9dd1-d8178e38993e": "profile_picture",
    "72917ec8-ca58-4f62-b072-c97d0f4fc808": "linkedin_profile_url",
    "1dc88174-0ae8-4ed7-b158-3dc247aa398d": "verified",
    "5a9a4019-6b55-4c8c-8ef8-b0fde1a96dce": "current_country",
    "d1efdace-7e22-47f3-a6fb-5d0dc4e904a7": "company_industry",
    "382aa555-0c39-421c-bc88-0a2bc90d25c3": "role_type",
    "3cb79bd9-fd11-43d0-8de4-c78e36db5088": "highest_education",
    "93aef2aa-2b88-4442-bfaf-ac65aaac51ee": "company_size",
    "c65cb97e-c61c-4140-83b3-6dc8c126696e": "company_description",
    "b8c81d61-4270-4870-98cb-a1c0a38d11f9": "company_logo",
}

NULL_VALUES = ["", "Error", "Not Found", "Skipped", "Not Available", None]

# ============ HELPERS ============

def clean_value(value):
    if value in NULL_VALUES:
        return None
    if isinstance(value, str) and value.strip() == "":
        return None
    return value

def transform_kuration_row(kuration_row):
    supabase_row = {"kuration_row_id": kuration_row["id"]}
    company_data = kuration_row.get("company", {})
    for kuration_uuid, supabase_col in COLUMN_MAP.items():
        if kuration_uuid in company_data:
            raw_value = company_data[kuration_uuid].get("value")
            supabase_row[supabase_col] = clean_value(raw_value)
        else:
            supabase_row[supabase_col] = None
    return supabase_row

# ============ MAIN ============

def sync():
    print("Starting sync.")
    
    page = 1
    page_size = 50
    total_synced = 0
    total_failed = 0
    
    while True:
        url = f"https://api.kurationai.com/api/enterprise/projects/{KURATION_PROJECT_ID}/rows?page={page}&page_size={page_size}"
        headers = {
            "accept": "application/json",
            "kur-api-key": KURATION_API_KEY
        }
        
        print(f"Fetching page {page}...")
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"Error fetching page {page}: {response.status_code}")
            print(response.text)
            break
        
        data = response.json()
        rows = data.get("rows", [])
        
        if not rows:
            break
        
        for kuration_row in rows:
            supabase_row = transform_kuration_row(kuration_row)
            
            supabase_url = f"{SUPABASE_URL}/rest/v1/founders"
            supabase_headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            }
            
            sb_response = requests.post(
                supabase_url,
                headers=supabase_headers,
                json=supabase_row,
                params={"on_conflict": "kuration_row_id"}
            )
            
            if sb_response.status_code in (200, 201):
                total_synced += 1
                print(f"  ✓ {supabase_row.get('full_name', 'Unknown')}")
            else:
                total_failed += 1
                print(f"  ✗ {supabase_row.get('full_name', 'Unknown')} — {sb_response.status_code}: {sb_response.text[:200]}")
        
        page += 1
        time.sleep(0.3)
        
        if page > 200:
            print("Page limit reached. Stopping.")
            break
    
    print(f"\nDone. {total_synced} synced, {total_failed} failed.")

if __name__ == "__main__":
    sync()