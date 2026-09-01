"""Bot-Ville streak engine test (v1.6.0). Simulates daily-use scenarios
against a TEMP ledger; never touches the real one."""
import importlib.util, json, os, tempfile, time

spec = importlib.util.spec_from_file_location(
    "plugin_api", "/opt/data/repos/hermes-bot-horizon/gateway/bot-horizon/dashboard/plugin_api.py")
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

tmp = tempfile.mkdtemp()
api.LEDGER_PATH = os.path.join(tmp, "ledger.json")
DAY = 86400
now = 1787000000.0  # a fixed "today" (UTC)

def check(label, got, expect):
    ok = got == expect
    print(("PASS" if ok else "FAIL"), label, "->", got)
    if not ok:
        print("     expected:", expect)
        raise SystemExit(1)

# 1. fresh, no activity
s = api._streak_tick(now, {}, None)
check("fresh no activity", (s["count"], s["lives"], s["event"]), (0, 3, None))

# 2. first activity today
s = api._streak_tick(now, s, now - 100)
check("first activity", (s["count"], s["last_day"]), (1, int(now // DAY)))

# 3. same day again
s = api._streak_tick(now + 3600, s, now - 50)
check("same day", s["count"], 1)

# 4. next day activity -> +1
s = api._streak_tick(now + DAY, s, now + DAY - 100)
check("next day", (s["count"], s["event"]), (2, None))

# 5. missed day WITH lives -> protected, count kept, lives-1
s = api._streak_tick(now + 2 * DAY, s, now + DAY - 100)
check("missed w/ lives", (s["count"], s["lives"], s["event"]), (2, 2, "life_used"))

# 6. activity resumes the next day -> count resumes
s = api._streak_tick(now + 3 * DAY, s, now + 3 * DAY - 100)
check("resume after protected", (s["count"], s["event"]), (3, None))

# 7. missed day with 0 lives -> streak lost
s0 = api._streak_tick(now, {}, now - 100)      # fresh, count 1
s0["lives"] = 0
s0 = api._streak_tick(now + DAY, s0, now - 100)
check("missed w/o lives", (s0["count"], s0["lives"], s0["event"]), (0, 0, "streak_lost"))

# 8. multi-day gap with lives -> one life, streak kept
s2 = api._streak_tick(now, {}, now - 100)      # count 1
s2 = api._streak_tick(now + 3 * DAY, s2, now - 100)  # 3-day gap
check("multi-day gap", (s2["count"], s2["lives"], s2["event"]), (1, 2, "life_used"))

# 9. missed day WITH streak_saver pet -> protected, no life spent
s4 = api._streak_tick(now, {}, now - 100)      # fresh, count 1
s4 = api._streak_tick(now + DAY, s4, now - 100, has_streak_saver=True)
check("streak saver protects", (s4["count"], s4["lives"], s4["event"]), (1, 3, "streak_saved"))

# 10. streak_saver protects even at 0 lives (checked before the lives gate)
s5 = api._streak_tick(now, {}, now - 100)
s5["lives"] = 0
s5 = api._streak_tick(now + DAY, s5, now - 100, has_streak_saver=True)
check("streak saver protects at 0 lives", (s5["count"], s5["lives"], s5["event"]), (1, 0, "streak_saved"))

# 11. buy-life caps at MAX_LIVES (simulate by calling the endpoint logic)
s3 = api._streak_tick(now, {}, now - 100)
ledger = {"streak": s3}
with open(api.LEDGER_PATH, "w") as f:
    json.dump(ledger, f)
api.time.time = lambda: now  # keep accrue stable
r1 = api.post_buy_life()
check("buy life", (r1["ok"], r1["lives"]), (True, 4))
r2 = api.post_buy_life()
check("buy life 2", (r2["ok"], r2["lives"]), (True, 5))
r3 = api.post_buy_life()
check("buy capped", (r3["ok"], r3.get("error")), (False, "max_lives"))

print("ALL STREAK TESTS PASSED ✅")
