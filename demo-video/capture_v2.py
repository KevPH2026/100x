#!/usr/bin/env python3
"""Capture clean product demo screenshots for launch video."""
import time
from playwright.sync_api import sync_playwright

OUT = "/Users/mac/projects/copyforge/demo-video"

def shot(page, name, wait=2):
    time.sleep(wait)
    page.screenshot(path=f"{OUT}/{name}", full_page=False)
    print(f"✅ {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    page = ctx.new_page()

    # 1. 首页 hero — "你的广告素材，我们包了"
    page.goto("https://100x.pics", wait_until="networkidle", timeout=30000)
    shot(page, "v2_01_hero.png", 3)

    # 2. 首页 scroll 到3步流程
    page.evaluate("window.scrollTo(0, 500)")
    shot(page, "v2_02_steps.png", 2)

    # 3. 登录后进入chat，模拟输入品牌信息
    page.goto("https://100x.pics/login", wait_until="networkidle", timeout=15000)
    inputs = page.query_selector_all('input')
    for inp in inputs:
        t = inp.get_attribute('type') or ''
        if 'email' in t: inp.fill('demo@100x.pics')
        elif 'password' in t: inp.fill('Test1234')
    page.keyboard.press('Enter')
    time.sleep(4)

    # Chat page
    page.goto("https://100x.pics/chat", wait_until="domcontentloaded", timeout=15000)
    shot(page, "v2_03_chat.png", 3)

    # 4. Dashboard with generated assets
    page.goto("https://100x.pics/dashboard", wait_until="domcontentloaded", timeout=15000)
    shot(page, "v2_04_dashboard.png", 3)

    # 5. 首页底部 CTA
    page.goto("https://100x.pics", wait_until="networkidle", timeout=15000)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    shot(page, "v2_05_cta.png", 2)

    browser.close()
    print("\n🎬 Done!")
