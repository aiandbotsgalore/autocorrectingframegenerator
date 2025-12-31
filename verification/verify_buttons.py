from playwright.sync_api import sync_playwright

def verify_mode_buttons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming Vite default port 5173)
        page.goto("http://localhost:5173")

        # We need to bypass the API key check to see the PromptInput
        # LocalStorage needs to be set before the app checks it
        # However, the app checks on mount. We can try setting it and reloading
        # or setting it before navigation if possible, but here we can just set it and reload.

        page.evaluate("localStorage.setItem('geminiApiKey', 'dummy-key')")
        page.reload()

        # Wait for the prompt input to appear
        page.wait_for_selector("#prompt-input")

        # Check if Simple button exists and get its aria-pressed state
        # Use exact=True to avoid matching "Example Prompts" with "Pro"
        simple_btn = page.get_by_role("button", name="Simple", exact=True)
        pro_btn = page.get_by_role("button", name="Pro", exact=True)

        print(f"Simple button aria-pressed: {simple_btn.get_attribute('aria-pressed')}")
        print(f"Pro button aria-pressed: {pro_btn.get_attribute('aria-pressed')}")

        # Screenshot initial state
        page.screenshot(path="verification/mode_buttons_initial.png")

        # Click Pro button
        pro_btn.click()

        print(f"Simple button aria-pressed after click: {simple_btn.get_attribute('aria-pressed')}")
        print(f"Pro button aria-pressed after click: {pro_btn.get_attribute('aria-pressed')}")

        # Screenshot after click
        page.screenshot(path="verification/mode_buttons_pro.png")

        browser.close()

if __name__ == "__main__":
    verify_mode_buttons()
