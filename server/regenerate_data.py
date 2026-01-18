import processor
from pathlib import Path
import os

# Define paths
base_dir = Path(r"d:\CIIS\server")
input_csv = base_dir / "storage" / "latest" / "scraped_input.csv"
output_dir = base_dir / "storage" / "latest"

if input_csv.exists():
    print(f"Regenerating report from {input_csv}...")
    processor.generate_reports_from_csv(str(input_csv), str(output_dir))
    print("Regeneration complete.")
else:
    print(f"Input file not found: {input_csv}")
