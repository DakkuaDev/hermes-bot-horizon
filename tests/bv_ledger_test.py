"""Bot-Ville ledger engine test (monotonic accrual + streak + pets shape).

Simulates scenarios against a TEMP ledger by monkeypatching LEDGER_PATH and
_total_real_xp. Never touches the real ledger.
"""
import importlib.util, json, os, tempfile

spec = importlib.util.spec_from_file_location(
    "plugin_api", "/opt/data/repos/hermes-bot-horizon/gateway/bot-horizon/dashboard/plugin_api.py")
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

tmp = tempfile.mkdtemp()
api.LEDGER_PATH = os.path.join(tmp, "ledger.json")
real = {"default": 1000, "bot-father": 614, "bot-finance": 0, "bot-jobs-xr": 0}
api._total_real_xp = lambda d: real.get("default" if d == api.MAIN_HOME else os.path.basename(d), 0)

def check(label, got, expect):
    ok = got == expect
    print(("PASS" if ok else "FAIL"), label, "->", got)
    if not ok:
        print("     expected:", expect)
        raise SystemExit(1)

# 1. fresh install: baseline, no retro XP
r = api.accrue_now()
check("fresh baseline", r["game"], {"default": 0, "bot-father": 0, "bot-finance": 0, "bot-jobs-xr": 0})
check("fresh streak count", r["streak"]["count"], 1)

# 2. growth: +50 real -> +50 game
real["default"] = 1050
r = api.accrue_now()
check("growth +50", r["game"]["default"], 50)

# 3. compaction drop: real -100 -> game unchanged, ceiling held
real["default"] = 950
r = api.accrue_now()
check("drop held", r["game"]["default"], 50)
check("ceiling held", r["totals"]["default"], 1050)

# 4. growth past ceiling: +200 -> game +200
real["default"] = 1250
r = api.accrue_now()
check("growth past ceiling", r["game"]["default"], 250)

# 5. catastrophic drop (<50% of ceiling): re-baseline, game kept
real["default"] = 400
r = api.accrue_now()
check("catastrophic re-baseline", r["totals"]["default"], 400)
check("game kept", r["game"]["default"], 250)

# 6. growth after re-baseline works
real["default"] = 420
r = api.accrue_now()
check("growth after re-baseline", r["game"]["default"], 270)

# 7. reset_ledger: game zeroed, ceilings kept, accrual resumes
real["default"] = 450
r = api.reset_ledger()
check("reset zeroes game", r["game"]["default"], 0)
real["default"] = 460
r = api.accrue_now()
check("accrual after reset", r["game"]["default"], 10)

print("ALL TESTS PASSED ✅")
