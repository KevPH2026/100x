#!/usr/bin/env python3
"""Capture 100x.pics product screenshots for demo video."""
import time, json
from playwright.sync_api import sync_playwright

OUT = "/Users/mac/projects/copyforge/demo-video"

def shot(page, name, wait=2):
    time.sleep(wait)
    path = f"{OUT}/{name}"
    page.screenshot(path=path, full_page=False)
    print(f"✅ {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900},
        device_scale_factor=2,
    )
    page = ctx.new_page()

    # 1. Landing page
    print("📸 Landing page...")
    page.goto("https://100x.pics", wait_until="networkidle", timeout=30000)
    shot(page, "01_landing.png", 3)

    # 2. Features section
    page.evaluate("window.scrollTo(0, 600)")
    shot(page, "02_features.png", 2)

    # 3. CTA section
    page.evaluate("window.scrollTo(0, 1200)")
    shot(page, "03_cta.png", 2)

    # 4. Login page
    print("📸 Login...")
    page.goto("https://100x.pics/login", wait_until="networkidle", timeout=15000)
    shot(page, "04_login.png", 2)

    # 5. Login and capture chat
    print("📸 Logging in...")
    inputs = page.query_selector_all('input')
    for inp in inputs:
        t = inp.get_attribute('type') or ''
        if 'email' in t:
            inp.fill('demo@100x.pics')
        elif 'password' in t:
            inp.fill('Test1234')
    page.keyboard.press('Enter')
    time.sleep(5)
    
    # Try chat page
    print("📸 Chat/Agent...")
    page.goto("https://100x.pics/chat", wait_until="domcontentloaded", timeout=15000)
    shot(page, "05_chat.png", 3)

    # 6. Dashboard
    print("📸 Dashboard...")
    page.goto("https://100x.pics/dashboard", wait_until="domcontentloaded", timeout=15000)
    shot(page, "06_dashboard.png", 2)

    # 7. Admin
    print("📸 Admin...")
    page.context.add_cookies([{
        "name": "admin_token",
        "value": "100xAdmin2026",
        "domain": "100x.pics",
        "path": "/"
    }])
    page.goto("https://100x.pics/admin", wait_until="domcontentloaded", timeout=15000)
    shot(page, "07_admin_overview.png", 3)
    
    page.click('button:has-text("用户")')
    shot(page, "08_admin_users.png", 2)
    
    page.click('button:has-text("素材库")')
    shot(page, "09_admin_assets.png", 3)

    browser.close()
    print("\n🎬 Done!")
