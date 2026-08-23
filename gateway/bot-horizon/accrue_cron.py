#!/usr/bin/env python3
"""Bot-Ville accrue checkpoint — the town's 24/7 clock.

Scheduled by Hermes cron every 15 minutes (no_agent, silent on success).
Reads the real session DBs, adds any new activity to the game ledger, so XP
keeps counting even when the desktop app is closed. When you open the town,
/state returns the up-to-date ledger.

Install: run with the Hermes python (the one that has fastapi):
    /opt/hermes/.venv/bin/python accrue_cron.py
"""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_DASH = os.path.join(_HERE, "dashboard")

try:
    sys.path.insert(0, _DASH)
    import plugin_api  # noqa: E402
except Exception:
    # The interpreter running us may lack fastapi — re-exec with a Hermes python.
    import subprocess
    cands = ["/opt/hermes/.venv/bin/python", sys.executable]
    for cand in cands:
        if cand and os.path.exists(cand) and os.path.abspath(cand) != os.path.abspath(sys.executable):
            sys.exit(subprocess.call([cand, os.path.abspath(__file__)]))
    raise

plugin_api.accrue_now()
# silent on success — no_agent cron with empty stdout delivers nothing
