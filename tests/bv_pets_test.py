"""Bot-Ville pets backend test (temp ledger)."""
import importlib.util, json, os, tempfile, time

spec = importlib.util.spec_from_file_location(
    "plugin_api", "/opt/data/repos/hermes-bot-horizon/gateway/bot-horizon/dashboard/plugin_api.py")
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

tmp = tempfile.mkdtemp()
api.LEDGER_PATH = os.path.join(tmp, "ledger.json")
now = 1787100000.0
api.time.time = lambda: now

def check(label, got, expect):
    ok = got == expect
    print(("PASS" if ok else "FAIL"), label, "->", got)
    if not ok:
        print("     expected:", expect)
        raise SystemExit(1)

# 1. buy a pet assigns to the chosen bot
r = api.post_buy_pet(bot_name="default", pet_id="chick")
check("buy pet chick", (r["ok"], r["pets"]), (True, {"default": "chick"}))
r = api.post_buy_pet(bot_name="default", pet_id="cat")
check("second pet rejected", (r["ok"], r.get("error")), (False, "bot_has_pet"))

# 2. reassign: same pet moves to another bot (free), old bot freed
r = api.post_buy_pet(bot_name="bot-father", pet_id="chick")
check("reassign pet moves", (r["ok"], r["pets"]),
      (True, {"bot-father": "chick"}))

# 3. accrue: pet periodic gated by 15 min — first tick after >900s, then NOT again until another 900s
api.time.time = lambda: now + 1000
r1 = api.accrue_now()
check("pet +1 on first tick", r1["game"]["bot-father"], 1)
r2 = api.accrue_now()  # same instant -> no new pet XP
check("pet gated (no +1 yet)", r2["game"]["bot-father"], 1)
api.time.time = lambda: now + 2000  # > 15 min after the last tick
r3 = api.accrue_now()
check("pet +1 after 15 min", r3["game"]["bot-father"], 2)

print("ALL PET TESTS PASSED ✅")
