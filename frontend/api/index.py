import sys
import os

# During the Vercel build, `cp -r ../backend ./api/backend_src` copies the
# entire backend directory here so the serverless function can import it.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend_src"))

from main import app  # noqa: F401, E402 — Vercel discovers the ASGI `app`
