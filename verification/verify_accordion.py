from playwright.sync_api import sync_playwright

def verify_accordion():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Mock API key
            page.evaluate("localStorage.setItem('geminiApiKey', 'dummy-key')")
            page.reload()

            # Locate the button properly
            button = page.get_by_role("button", name="Example Prompts")
            button.wait_for()

            # Check initial state (should be false)
            # Note: boolean attributes might return 'true'/'false' string or None if missing.
            # In React aria-expanded={false} renders as aria-expanded="false".
            expanded_attr = button.get_attribute("aria-expanded")
            print(f"Initial aria-expanded: {expanded_attr}")

            # Click to expand
            button.click()

            # Check expanded state (should be true)
            expanded_attr_after = button.get_attribute("aria-expanded")
            print(f"After click aria-expanded: {expanded_attr_after}")

            # Take screenshot
            page.screenshot(path="verification/accordion.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_accordion()
