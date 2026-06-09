import json

print("Loading...")
with open("generated/cutoffs.json") as f:
    data = json.load(f)

columns = list(data[0].keys())

rows = []
for row in data:
    clean_row = []

    for col in columns:
        value = row.get(col)

        if str(value).lower() == "nan":
            value = None

        clean_row.append(value)

    rows.append(clean_row)



compact = {
    "columns": columns,
    "rows": rows
}

print("Saving...")
with open("cutoffs_all_compact.json", "w") as f:
    
    json.dump(
        compact,
        f,
        separators=(",", ":"),
        allow_nan=False
    )

print("Done.")