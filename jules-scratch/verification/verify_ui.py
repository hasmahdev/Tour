import re
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Verify Login Page
    page.goto("http://localhost:5173/login")
    page.screenshot(path="jules-scratch/verification/login-page.png")

    # Log in as a developer
    page.get_by_label("Username").fill("dev")
    page.get_by_label("Password").fill("devpassword")
    page.get_by_role("button", name=re.compile("login", re.IGNORECASE)).click()

    # Verify User Management Page (after login)
    page.wait_for_url("**/tournaments") # wait for redirect after login
    page.goto("http://localhost:5173/users")
    page.wait_for_selector("text=User Management") # Wait for the page to load
    page.screenshot(path="jules-scratch/verification/user-management-page.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
