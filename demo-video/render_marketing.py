#!/usr/bin/env python3
"""Render marketing.html to high-res PNG screenshot."""
import subprocess
from playwright.sync_api import sync_playwright

OUT = "/Users/mac/projects/copyforge/demo-video"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"file://{OUT}/marketing.html", wait_until="networkidle", timeout=30000)
    # Wait for fonts + images
    page.wait_for_timeout(3000)
    page.screenshot(path=f"{OUT}/100x_marketing.png", full_page=True)
    print("✅ 100x_marketing.png")
    browser.close()
