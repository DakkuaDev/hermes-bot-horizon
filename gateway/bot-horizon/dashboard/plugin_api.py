"""BotVille — Bot Mode gamification backend.

Mounted at /api/plugins/bot-horizon/ by the dashboard plugin system.

This is the XP accountant and fleet snapshot service for the BotVille desktop
plugin. It reads REAL gateway state — no guessed APIs:

  - roster + avatar meta:  <profile>/profile.yaml  -> ui_meta.hermes-bots
  - avatar image:          <profile>/assets/avatar.png (returned as data URL)
  - online/offline:        <profile>/gateway_state.json + pid liveness (/proc)
  - busy right now:        <profile>/runtime/active_sessions.json
  - what it's doing:       <profile>/state.db sessions.last_activity_description
  - activity / XP:         <profile>/state.db sessions.message_count + tool_call_count
  - routines / quests:     <profile>/cron/jobs.json
  - canonical chat:        ui_meta.hermes-bots.chat (session id)

The "default" profile lives in the Hermes home (MAIN_HOME); every other bot
profile lives under PROFILES_ROOT/<name>/.

Route summary
-------------
GET /api/plugins/bot-horizon/state
    Full fleet snapshot: user (mayor) level + per-bot state/XP/level/rank/
    badges/routines/avatar. Poll-friendly, ~ms.
GET /api/plugins/bot-horizon/health
    Cheap liveness probe.
"""

from __future__ import annotations

import base64
import glob
import json
import logging
import os
import re
import sqlite3
import time
from typing import Any

from fastapi import APIRouter

log = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Config (mirrors botville.config.json defaults; user-editable later)
# ---------------------------------------------------------------------------

PROFILES_ROOT = os.path.expanduser("~/profiles")
MAIN_HOME = os.path.expanduser("~")


def _resolve_hermes_home() -> tuple[str, str]:
    """Return (main_home, profiles_root) following Hermes' own resolution.

    The main profile lives in the Hermes home; named bot profiles live under
    ``<home>/profiles/``. Hermes resolves the home as:
      - ``HERMES_HOME`` env var if set (Docker/custom → e.g. ``/opt/data``)
      - else the platform-native default: ``~/.hermes`` on POSIX,
        ``%LOCALAPPDATA%\\hermes`` on Windows.

    We mirror ``hermes_constants.get_default_hermes_root()`` so the plugin
    works on ANY instance layout — not just the one it was developed on.
    """
    import sys as _sys

    env_home = os.environ.get("HERMES_HOME", "").strip()
    if env_home:
        root = env_home
    elif _sys.platform == "win32":
        local_appdata = os.environ.get("LOCALAPPDATA", "").strip()
        base = os.path.join(local_appdata, "hermes") if local_appdata else os.path.join(
            os.path.expanduser("~"), "AppData", "Local", "hermes")
        root = base
    else:
        root = os.path.join(os.path.expanduser("~"), ".hermes")
    # If HERMES_HOME points INTO <root>/profiles/<name>, the root is the grandparent.
    if os.path.basename(os.path.dirname(root)) == "profiles":
        root = os.path.dirname(os.path.dirname(root))
    return root, os.path.join(root, "profiles")


MAIN_HOME, PROFILES_ROOT = _resolve_hermes_home()
RANKS = ["Stone", "Copper", "Silver", "Gold", "Platinum",
         "Diamond", "Emerald", "Sapphire", "Ruby", "Mythic"]
RANK_EMOJI = ["🪨", "🟤", "⚪", "🟡", "⚪", "💎", "🟢", "🔵", "🔴", "🌟"]
# Level balance: TWO separate curves. Individual bots use BOT_LEVEL_XP; the
# town/mayor (global) level uses TOWN_LEVEL_XP — much harder, because the
# global level must not be the same as a bot's. Each level needs noticeably
# more than the last; the top levels are meant to be a real grind.
# Cumulative XP needed to REACH each level (editable config)
BOT_LEVEL_XP = [0, 200, 600, 1400, 2800, 5200, 9000, 15000, 24000, 40000]
TOWN_LEVEL_XP = [0, 1000, 3000, 7000, 15000, 30000, 55000, 90000, 140000, 200000]

# Pets config — purchaseable companions that provide passive bonuses
PETS = [
    {"id": "chick", "emoji": "🐤", "name": "Chick", "cost": 100, "type": "periodic", "value": 1},
    {"id": "cat", "emoji": "🐱", "name": "Cat", "cost": 250, "type": "periodic", "value": 3},
    {"id": "dog", "emoji": "🐶", "name": "Dog", "cost": 500, "type": "periodic", "value": 5},
    {"id": "owl", "emoji": "🦉", "name": "Owl", "cost": 200, "type": "boost", "value": 10},
    {"id": "turtle", "emoji": "🐢", "name": "Turtle", "cost": 400, "type": "streak_saver", "value": 1},
    {"id": "dragon", "emoji": "🐉", "name": "Dragon", "cost": 1000, "type": "hybrid", "value": 8, "boost_pct": 15},
]

ACTIVE_WINDOW = 90      # mirror Bot Mode "Active now": wrote within 90s
SLEEP_AFTER = 900       # idle > 15 min -> sleeping
XP_MSG = 1              # XP per assistant message
XP_TOOL = 3             # XP per tool call
AVATAR_MAX_BYTES = 1_500_000

# Streak (daily-use) system
STREAK_WINDOW = 86400        # streak dies after 24h without ANY bot activity
STREAK_DANGER_S = 23 * 3600  # remind when <1h left before the window closes
DEFAULT_LIVES = 3            # every user starts with 3 lives
MAX_LIVES = 5                # hard cap (buy with coins, 100 each)
LIFE_PRICE = 100

# Game ledger (24/7 accrual): lives next to the plugin, not the desktop.
# The 15-min accrue cron + every /state call checkpoint real activity here.
LEDGER_PATH = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ledger.json"))


def _read_json(p: str) -> Any | None:
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _level(xp: int, table: list | None = None) -> int:
    table = table or BOT_LEVEL_XP
    lvl = 1
    for i, need in enumerate(table, start=1):
        if xp >= need:
            lvl = i
    return lvl


def _rank(xp: int) -> tuple[int, str, str]:
    lvl = _level(xp)
    return lvl, RANKS[lvl - 1], RANK_EMOJI[lvl - 1]


def _gateway_state(profile_dir: str) -> tuple[str | None, bool]:
    """('running'|'stopped'|None, pid_alive). PID check filters stale files."""
    gs = _read_json(os.path.join(profile_dir, "gateway_state.json"))
    if not gs:
        return None, False
    state = gs.get("gateway_state") or gs.get("desired_state")
    pid = gs.get("pid")
    alive = bool(pid) and os.path.exists(f"/proc/{pid}")
    return state, alive


def _busy_sessions(profile_dir: str) -> list:
    act = _read_json(os.path.join(profile_dir, "runtime", "active_sessions.json"))
    if not act:
        return []
    entries = act.get("entries", []) or []
    # liveness filter: drop stale leases whose pid is gone (CLI chat exited,
    # app closed) so a dead session can't pin the bot to "working" forever.
    return [e for e in entries
            if e.get("pid") and os.path.exists(f"/proc/{e.get('pid')}")]


def _avatar_data_url(profile_dir: str) -> str | None:
    path = os.path.join(profile_dir, "assets", "avatar.png")
    if not os.path.exists(path):
        return None
    try:
        size = os.path.getsize(path)
        if size > AVATAR_MAX_BYTES or size == 0:
            return None
        with open(path, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode()
    except Exception:
        return None


def _db(profile_dir: str):
    db = os.path.join(profile_dir, "state.db")
    if not os.path.exists(db):
        return None
    return sqlite3.connect(f"file:{db}?mode=ro", uri=True)


def _total_real_xp(profile_dir: str) -> int:
    """Real all-time XP for a profile: Σ message_count * XP_MSG + Σ tool_call_count * XP_TOOL."""
    con = _db(profile_dir)
    if con is None:
        return 0
    try:
        row = con.execute(
            "select coalesce(sum(message_count),0), coalesce(sum(tool_call_count),0) "
            "from sessions").fetchone()
        return int(row[0]) * XP_MSG + int(row[1]) * XP_TOOL
    except Exception:
        return 0
    finally:
        con.close()


def _profiles():
    out = [("default", MAIN_HOME)]
    for p in sorted(glob.glob(os.path.join(PROFILES_ROOT, "*"))):
        if os.path.isdir(p):
            out.append((os.path.basename(p), p))
    return out


def _max_last_activity() -> float | None:
    """Latest activity across ALL profiles (any bot working = the user is
    using Hermes — that's what feeds the daily streak)."""
    best = None
    for _name, d in _profiles():
        con = _db(d)
        if con is None:
            continue
        try:
            row = con.execute(
                "select max(last_activity_at) from sessions").fetchone()
            if row and row[0]:
                best = max(best or 0.0, float(row[0]))
        except Exception:
            pass
        finally:
            con.close()
    return best


def _streak_tick(tnow: float, streak: dict, last_activity: float | None) -> dict:
    """Advance the daily-use streak (calendar-day UTC based).

    - Activity today keeps/increments the streak (fresh day = +1).
    - A missed day (24h+ without any activity) consumes ONE life if the user
      has any — the streak is PROTECTED (event 'life_used'); with 0 lives the
      streak resets (event 'streak_lost').
    - Lives are a premium resource (default 3, max 5, buyable with coins).
    - Reset town does NOT touch the streak (it's about the user's daily habit,
      not town progress).
    """
    s = dict(streak)
    today = int(tnow // 86400)
    last_day = int(s.get("last_day") or 0)
    lives = int(s.get("lives", DEFAULT_LIVES))
    count = int(s.get("count", 0))
    s.setdefault("max_lives", MAX_LIVES)
    s.setdefault("event", None)
    s.setdefault("event_extra", None)
    if last_activity:
        act_day = int(last_activity // 86400)
        if act_day >= today:                       # fresh activity today
            s["event"] = None                      # user is back — clear old event
            s["event_extra"] = None
            if last_day == 0:
                count = 1
            elif act_day > last_day:
                count = 1 if act_day > last_day + 1 else count + 1
            last_day = act_day
        elif last_day < today:                     # stale: at least one missed day
            if lives > 0:
                lives -= 1
                s["event"] = "life_used"
                s["event_extra"] = f"lives left: {lives}"
            else:
                count = 0
                s["event"] = "streak_lost"
            last_day = today
    s.update(count=count, lives=lives, last_day=last_day,
             last_activity_ts=last_activity, event_ts=tnow)
    return s


def accrue_now() -> dict:
    """Checkpoint real activity into the game ledger (monotonic).

    The source of truth (SUM over the sessions table) is NOT monotonic:
    Hermes compacts/finalizes sessions, so real XP can shrink between
    checkpoints. To keep the game honest, `totals` stores the per-bot
    CEILING (max real XP ever observed). XP is granted only when real XP
    grows past the ceiling — it can never be lost to compaction. If the
    source DB drops below 50% of the ceiling (cleared/reset), the ceiling
    re-baselines so the game never stalls forever.
    First observation of a bot is a baseline (no retroactive XP). Safe to
    call from a cron or from every /state poll — idempotent, ~ms.
    """
    tnow = time.time()
    totals = {name: _total_real_xp(d) for name, d in _profiles()}
    ledger = {"ts": 0, "totals": {}, "game": {}}
    if os.path.exists(LEDGER_PATH):
        try:
            with open(LEDGER_PATH, encoding="utf-8") as f:
                ledger = json.load(f)
        except Exception:
            ledger = {"ts": 0, "totals": {}, "game": {}}
    game = dict(ledger.get("game", {}))
    prev = ledger.get("totals", {})
    new_totals = {}
    for name, real in totals.items():
        cur_game = int(game.get(name, 0))
        ceiling = int(prev.get(name, 0))
        if name not in prev or ceiling == 0:
            new_totals[name] = real          # first sighting: baseline
            game[name] = cur_game
        elif real < ceiling * 0.5:
            new_totals[name] = real          # source DB was cleared: re-baseline
            game[name] = cur_game
        else:
            delta = max(0, real - ceiling)
            game[name] = cur_game + delta
            new_totals[name] = max(ceiling, real)
    # --- Pets: passive XP from periodic/hybrid pets (capped every 15 min) ---
    pets = dict(ledger.get("pets", {}))
    pets_updated = False
    pet_tick_ts = float(ledger.get("pet_tick_ts") or 0)
    if pets and tnow - pet_tick_ts >= 900:     # "every 15 min" — not per poll
        for name, pet_id in list(pets.items()):
            pet_def = next((p for p in PETS if p["id"] == pet_id), None)
            if not pet_def:
                continue
            if pet_def["type"] not in ("periodic", "hybrid"):
                continue
            val = int(pet_def.get("value", 0))
            if val > 0:
                game[name] = int(game.get(name, 0)) + val
                if name not in new_totals:
                    new_totals[name] = 0
        pet_tick_ts = tnow
        pets_updated = True

    streak = _streak_tick(tnow, ledger.get("streak", {}), _max_last_activity())
    coin_bank = int(ledger.get("coin_bank", 0)) or 0
    try:
        with open(LEDGER_PATH, "w", encoding="utf-8") as f:
            json.dump({"ts": tnow, "totals": new_totals, "game": game,
                       "streak": streak, "pets": pets,
                       "pet_tick_ts": pet_tick_ts,
                       "coin_bank": coin_bank}, f, indent=2)
    except Exception:
        pass
    return {"ts": tnow, "totals": new_totals, "game": game, "streak": streak,
            "pets": pets, "pet_tick_ts": pet_tick_ts, "coin_bank": coin_bank}


def reset_ledger() -> dict:
    """True fresh start: baseline current totals, zero the game, keep accruing from here."""
    accrue_now()
    try:
        with open(LEDGER_PATH, encoding="utf-8") as f:
            ledger = json.load(f)
        ledger["game"] = {k: 0 for k in ledger.get("game", {})}
        ledger["pets"] = {}                         # clear pets
        ledger["coin_bank"] = 0                      # clear test coins
        ledger["ts"] = time.time()
        with open(LEDGER_PATH, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2)
        return {"ok": True, "game": ledger["game"]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _latest_session(con):
    try:
        row = con.execute(
            "select id, title, started_at, last_activity_at, message_count, "
            "tool_call_count, last_activity_description "
            "from sessions order by last_activity_at desc limit 1"
        ).fetchone()
    except Exception:
        return None
    if not row:
        return None
    return {
        "id": row[0], "title": row[1], "started_at": row[2],
        "last_activity_at": row[3], "message_count": row[4],
        "tool_call_count": row[5],
        "last_activity_description": (row[6] or "") if row[6] else "",
    }


def _xp_stats(con) -> dict:
    day = time.time() - 86400
    try:
        today = con.execute(
            "select coalesce(sum(message_count),0), coalesce(sum(tool_call_count),0) "
            "from sessions where last_activity_at > ?", (day,)).fetchone()
        total = con.execute(
            "select coalesce(sum(message_count),0), coalesce(sum(tool_call_count),0) "
            "from sessions").fetchone()
    except Exception:
        return {"today_msgs": 0, "today_tools": 0, "total_msgs": 0,
                "total_tools": 0, "xp": 0, "total_xp": 0}
    today_msgs, today_tools = int(today[0]), int(today[1])
    total_msgs, total_tools = int(total[0]), int(total[1])
    return {"today_msgs": today_msgs, "today_tools": today_tools,
            "total_msgs": total_msgs, "total_tools": total_tools,
            "xp": today_msgs * XP_MSG + today_tools * XP_TOOL,
            "total_xp": total_msgs * XP_MSG + total_tools * XP_TOOL}


def _badges(con, routines: list, profile_dir: str) -> list[str]:
    """Achievements computed live from the DB. Thresholds editable in config."""
    badges: list[str] = []
    if con is None:
        return badges
    try:
        xp = _xp_stats(con)
        if xp["total_msgs"] >= 1:
            badges.append("first-steps")
        if routines:
            badges.append("quest-accepted")
        if xp["total_msgs"] >= 100:
            badges.append("chatterbox")
        if xp["total_msgs"] >= 1000:
            badges.append("marathoner")
        # night owl: any session started 23:00–05:00 local-ish (UTC-based v1)
        owl = con.execute(
            "select count(*) from sessions where started_at is not null and "
            "((cast(started_at as int) % 86400) >= 23*3600 or "
            "(cast(started_at as int) % 86400) < 5*3600)").fetchone()[0]
        if owl:
            badges.append("night-owl")
        # speedster: finished a session with messages in under 60s
        fast = con.execute(
            "select count(*) from sessions where message_count > 0 and "
            "ended_at is not null and started_at is not null and "
            "(ended_at - started_at) < 60").fetchone()[0]
        if fast:
            badges.append("speedster")
        # collaborator: took part in a group chat
        grp = con.execute(
            "select count(*) from sessions where title like 'Group:%'").fetchone()[0]
        if grp:
            badges.append("collaborator")
        # messenger: sent a bot-to-bot DM
        dm = con.execute(
            "select count(*) from messages where content like 'Message from %'"
        ).fetchone()[0]
        if dm:
            badges.append("messenger")
        # streak: >=5 consecutive days with activity (ending today or yesterday)
        if _streak_days(con) >= 5:
            badges.append("streak")
    except Exception:
        pass
    return badges


def _streak_days(con) -> int:
    try:
        rows = con.execute(
            "select distinct cast(last_activity_at as int) / 86400 from sessions "
            "where last_activity_at is not null order by 1 desc").fetchall()
    except Exception:
        return 0
    if not rows:
        return 0
    days = {r[0] for r in rows}
    today = int(time.time() // 86400)
    start = today if today in days else today - 1
    if start not in days:
        return 0
    n = 0
    d = start
    while d in days:
        n += 1
        d -= 1
    return n


def _routines(profile_dir: str) -> list[dict]:
    data = _read_json(os.path.join(profile_dir, "cron", "jobs.json")) or {}
    jobs = data.get("jobs", []) if isinstance(data, dict) else []
    out = []
    for j in jobs[:12]:
        out.append({
            "name": j.get("name"),
            "schedule": j.get("schedule"),
            "next_run": j.get("next_run"),
            "last_run": j.get("last_run"),
            "active": j.get("active", True),
        })
    return out


def _derive_state(online: bool, busy: bool, last: dict | None, tnow: float) -> str:
    if not online:
        return "offline"
    if busy:
        desc = (last.get("last_activity_description", "") if last else "").lower()
        if "receiving stream" in desc or "stream" in desc:
            return "talking"
        if "starting api call" in desc or "thinking" in desc:
            return "thinking"
        return "working"
    if not last or not last.get("last_activity_at"):
        return "idle"
    age = tnow - (last["last_activity_at"] or 0)
    if age <= ACTIVE_WINDOW:
        desc = (last.get("last_activity_description", "") or "").lower()
        if "receiving stream" in desc or "stream" in desc:
            return "talking"
        if "starting api call" in desc or "thinking" in desc:
            return "thinking"
        return "working"
    if age > SLEEP_AFTER:
        return "sleeping"
    return "idle"


def _collect_profile(name: str, profile_dir: str, tnow: float,
                     include_avatars: bool = True) -> dict:
    ui = {}
    description = ""
    meta_path = os.path.join(profile_dir, "profile.yaml")
    if os.path.exists(meta_path):
        text = open(meta_path, encoding="utf-8").read()
        # targeted regex parse (stdlib only) — pull the hermes-bots ui block
        m = re.search(
            r"ui_meta:\s*\n(\s+hermes-bots:\s*\n(?:\s+\S[^\n]*\n?)*)", text)
        if m:
            for k, v in re.findall(r"^\s+(\w+):\s*(.*)$", m.group(1), re.M):
                ui[k] = v.strip().strip("'\"")
        dm = re.search(r"^description:\s*(.*)$", text, re.M)
        if dm:
            description = dm.group(1).strip().strip("'\"")
    last = None
    con = _db(profile_dir)
    if con:
        try:
            last = _latest_session(con)
        finally:
            con.close()
    busy = _busy_sessions(profile_dir)
    online, pid_alive = _gateway_state(profile_dir)
    # A profile counts as online if its gateway says running (pid alive), it
    # has a live session lease, OR it has RECENT activity. The desktop app
    # drives bot sessions without a gateway process or lease file, so
    # last_activity_at is the reliable "this bot is being used" signal —
    # without it the town shows a busy bot as offline while XP accrues.
    busy_alive = any(e.get("pid") and os.path.exists(f"/proc/{e.get('pid')}")
                     for e in busy)
    recent = bool(last and last.get("last_activity_at")
                  and tnow - (last["last_activity_at"] or 0) <= SLEEP_AFTER)
    online_bool = (online == "running" and pid_alive) or busy_alive or recent

    con2 = _db(profile_dir)
    xp = {"today_msgs": 0, "today_tools": 0, "total_msgs": 0,
          "total_tools": 0, "xp": 0, "total_xp": 0}
    badges: list[str] = []
    if con2:
        try:
            xp = _xp_stats(con2)
            routines = _routines(profile_dir)
            badges = _badges(con2, routines, profile_dir)
        finally:
            con2.close()
    else:
        routines = _routines(profile_dir)
    routines = _routines(profile_dir)

    lvl, rank, emoji = _rank(xp["total_xp"])
    avatar = {
        "imageKind": ui.get("imageKind"),
        "shape": ui.get("shape"),
        "color": ui.get("color"),
    }
    avatar["hasImage"] = False
    if include_avatars:
        data_url = _avatar_data_url(profile_dir)
        avatar["hasImage"] = data_url is not None
        avatar["dataUrl"] = data_url
    return {
        "name": name,
        "title": ui.get("title") or "",
        "description": description,
        "avatar": avatar,
        "canonicalChat": ui.get("chat"),
        "gateway": online,
        "state": _derive_state(online_bool, bool(busy), last, tnow),
        "lastActivityAt": last["last_activity_at"] if last else None,
        "lastDescription": (last.get("last_activity_description") or "") if last else "",
        "lastSession": last["title"] if last else None,
        "xp": xp,
        "level": lvl,
        "rank": rank,
        "rankEmoji": emoji,
        "badges": badges,
        "routines": routines,
    }


def _mayor_name() -> str:
    """Portable mayor name: the display title of the 'default' profile, or a
    generic fallback — never a hardcoded personal name."""
    ui = _read_json(os.path.join(MAIN_HOME, "ui.json")) or {}
    return (ui.get("title") or ui.get("name") or "Mayor").strip() or "Mayor"


def _build_snapshot(include_avatars: bool = True) -> dict:
    tnow = time.time()
    bots = [_collect_profile("default", MAIN_HOME, tnow, include_avatars)]
    for p in sorted(glob.glob(os.path.join(PROFILES_ROOT, "*"))):
        if os.path.isdir(p):
            bots.append(_collect_profile(os.path.basename(p), p, tnow,
                                         include_avatars))

    user_xp = sum(b["xp"]["total_xp"] for b in bots)
    ulvl = _level(user_xp, TOWN_LEVEL_XP)
    urank = RANKS[ulvl - 1]
    uemoji = RANK_EMOJI[ulvl - 1]
    next_xp = TOWN_LEVEL_XP[ulvl] if ulvl < 10 else TOWN_LEVEL_XP[-1]
    prev_xp = TOWN_LEVEL_XP[ulvl - 1]
    progress = 0.0
    if next_xp > prev_xp:
        progress = min(1.0, (user_xp - prev_xp) / (next_xp - prev_xp))

    return {
        "updatedAt": tnow,
        "user": {
            "name": _mayor_name(),
            "xp": user_xp,
            "level": ulvl,
            "rank": urank,
            "rankEmoji": uemoji,
            "nextLevelXp": next_xp,
            "progress": round(progress, 4),
        },
        "bots": bots,
    }


@router.get("/state")
def get_state(avatars: bool = True) -> dict:
    try:
        snap = _build_snapshot(include_avatars=avatars)
        r = accrue_now()
        snap["game"] = r.get("game", {})
        snap["streak"] = r.get("streak", {})
        snap["pets"] = r.get("pets", {})
        snap["coin_bank"] = r.get("coin_bank", 0)
        return snap
    except Exception as e:  # never 500 the widget
        log.exception("bot-horizon /state failed")
        return {"ok": False, "error": str(e)}


@router.post("/buy-pet")
def post_buy_pet(bot_name: str, pet_id: str) -> dict:
    # Assign a pet to a bot; one pet per bot. If this pet is already owned by
    # another bot, it MOVES to the newly chosen bot (free reassign).
    try:
        accrue_now()
        pet_def = next((p for p in PETS if p["id"] == pet_id), None)
        if not pet_def:
            return {"ok": False, "error": "unknown_pet"}
        with open(LEDGER_PATH, encoding="utf-8") as f:
            ledger = json.load(f)
        pets = ledger.setdefault("pets", {})
        # move: pet currently on another bot -> free it
        for owner, pid in list(pets.items()):
            if pid == pet_id and owner != bot_name:
                del pets[owner]
        if bot_name in pets:
            return {"ok": False, "error": "bot_has_pet",
                    "pets": pets, "owner": bot_name}
        pets[bot_name] = pet_id
        with open(LEDGER_PATH, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2)
        return {"ok": True, "pets": pets}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/buy-life")
def post_buy_life() -> dict:
    """Spend LIFE_PRICE coins for +1 life (max MAX_LIVES). Coins are tracked
    client-side (same as hats/decos); the server only enforces the cap."""
    try:
        accrue_now()  # refresh ledger state first
        with open(LEDGER_PATH, encoding="utf-8") as f:
            ledger = json.load(f)
        s = ledger.setdefault("streak", {})
        lives = int(s.get("lives", DEFAULT_LIVES))
        max_lives = int(s.get("max_lives", MAX_LIVES))
        if lives >= max_lives:
            return {"ok": False, "error": "max_lives", "lives": lives,
                    "max_lives": max_lives}
        s["lives"] = lives + 1
        s["event"] = "life_bought"
        s["event_extra"] = f"lives: {s['lives']}/{max_lives}"
        s["event_ts"] = time.time()
        with open(LEDGER_PATH, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2)
        return {"ok": True, "lives": s["lives"], "max_lives": max_lives}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/grant-coins")
def post_grant_coins(amount: int = 1000) -> dict:
    """Add coins to the server-side coin bank (test/dev tool — lets anyone
    try the store without grinding). Amount is client-side, so no exploit
    concern in a local single-player game."""
    try:
        accrue_now()
        with open(LEDGER_PATH, encoding="utf-8") as f:
            ledger = json.load(f)
        bank = int(ledger.get("coin_bank", 0)) or 0
        bank = max(0, bank + max(0, int(amount)))
        ledger["coin_bank"] = bank
        with open(LEDGER_PATH, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2)
        return {"ok": True, "coin_bank": bank}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/reset")
def post_reset() -> dict:
    """True fresh start (used by the desktop Reset town button)."""
    try:
        return reset_ledger()
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/health")
def health() -> dict:
    return {"ok": True}
