import sys
sys.path.insert(0, "C:\\Teraplayer-main\\backend")
from services.extractors import EXTRACTORS

print("Configured extractors:")
for name, fn in EXTRACTORS:
    print(f"  - {name}: {fn.__name__}")

print(f"\nExtractor count: {len(EXTRACTORS)}")
