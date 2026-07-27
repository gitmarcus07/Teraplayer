"""Run cf_worker extractor tests."""
import sys
import subprocess

result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/test_cf_worker_extractor.py", "-v"],
    cwd="C:\\Teraplayer-main\\backend",
    capture_output=True,
    text=True,
    timeout=30
)
print(result.stdout)
print(result.stderr)
print(f"Return code: {result.returncode}")
