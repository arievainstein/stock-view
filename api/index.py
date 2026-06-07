import sys
import os

# Make the backend package importable from this serverless function
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: F401, E402 — Vercel discovers the ASGI `app` variable
