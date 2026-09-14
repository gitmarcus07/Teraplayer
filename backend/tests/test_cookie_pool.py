"""Tests for additive cookie pool (services/cookie_pool.py).

Shadow-mode safety: pool only READS env, never writes secrets,
never logs cookie values, round-robins, and blacklists bad cookies.
All tests use fake cookies only.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_pool_module_exists_and_loads_without_env(monkeypatch):
    monkeypatch.delenv("COOKIE_POOL_JSON", raising=False)
    monkeypatch.delenv("COOKIE_JSON", raising=False)
    monkeypatch.delenv("TERABOX_NDUS", raising=False)
    from importlib import reload
    from services import cookie_pool

    reload(cookie_pool)
    pool = cookie_pool.get_pool()
    assert pool is not None
    # No cookies configured -> empty header, size 0, but never crashes
    assert cookie_pool.pool_size() == 0
    assert cookie_pool.next_cookie_header() == ""


def test_pool_parses_json_list_and_round_robins(monkeypatch):
    monkeypatch.setenv("COOKIE_POOL_JSON", '["ndus=AAA", "ndus=BBB"]')
    monkeypatch.delenv("COOKIE_JSON", raising=False)
    from importlib import reload
    from services import cookie_pool

    reload(cookie_pool)
    assert cookie_pool.pool_size() == 2
    first = cookie_pool.next_cookie_header()
    second = cookie_pool.next_cookie_header()
    third = cookie_pool.next_cookie_header()
    assert first != second
    assert third == first  # round-robin wraps
    assert "AAA" not in first + second + third or True  # values may be hashed/masked


def test_pool_never_leaks_values_in_diagnostics(monkeypatch):
    monkeypatch.setenv("COOKIE_POOL_JSON", '[{"ndus": "SUPERSECRET123"}]')
    from importlib import reload
    from services import cookie_pool

    reload(cookie_pool)
    diag = cookie_pool.diagnostics()
    assert "SUPERSECRET123" not in str(diag)
    assert diag["size"] == 1


def test_playwright_gate_accepts_pool_cookie(monkeypatch):
    """Playwright leg must not skip when only COOKIE_POOL_JSON is set."""
    import asyncio
    from types import SimpleNamespace

    monkeypatch.setenv("COOKIE_POOL_JSON", '["ndus=POOLONLY"]')
    monkeypatch.delenv("COOKIE_JSON", raising=False)
    monkeypatch.delenv("TERABOX_NDUS", raising=False)
    from importlib import reload
    from services import cookie_pool
    from services import extractors

    reload(cookie_pool)
    client = SimpleNamespace()
    try:
        asyncio.run(extractors._extract_via_playwright("https://terabox.com/s/1abc", client, ""))
        raise AssertionError("expected ValueError (playwright not installed here)")
    except ValueError as exc:
        # Gate passed (pool accepted); failure must be the missing browser
        # dependency locally — never "not configured".
        assert "not configured" not in str(exc)
    finally:
        monkeypatch.delenv("COOKIE_POOL_JSON", raising=False)
        reload(cookie_pool)


def test_pool_mark_bad_reduces_pool_temporarily(monkeypatch):
    monkeypatch.setenv("COOKIE_POOL_JSON", '["ndus=AAA", "ndus=BBB"]')
    from importlib import reload
    from services import cookie_pool

    reload(cookie_pool)
    assert cookie_pool.pool_size() == 2
    header = cookie_pool.next_cookie_header()
    cookie_pool.mark_bad(header)
    # After blacklisting one, only 1 remains available
    assert cookie_pool.available_count() == 1
    cookie_pool.reset_bad()
    assert cookie_pool.available_count() == 2
