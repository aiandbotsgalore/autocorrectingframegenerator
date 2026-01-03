from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_lazy_loading(page: Page):
    # 1. Arrange: Go to the app.
    page.goto("http://localhost:5173")

    # 2. Act: Click on the "History" tab.
    # The History tab is the button with text "HISTORY".
    history_tab = page.get_by_text("HISTORY")
    history_tab.click()

    # 3. Assert: Verify that images in the history list have loading="lazy" and decoding="async".
    # Wait for images to be present
    page.wait_for_selector("img[alt^='Iteration']")

    # Let's filter for history images specifically.
    history_images = page.locator("div.space-y-2 img")
    history_count = history_images.count()
    print(f"Found {history_count} history images")

    for i in range(history_count):
        img = history_images.nth(i)
        loading_attr = img.get_attribute("loading")
        decoding_attr = img.get_attribute("decoding")
        print(f"Image {i}: loading={loading_attr}, decoding={decoding_attr}")

        if loading_attr != "lazy":
            raise AssertionError(f"Image {i} missing loading='lazy'")
        if decoding_attr != "async":
            raise AssertionError(f"Image {i} missing decoding='async'")

    # 4. Screenshot
    # Ensure directory exists
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/verification.png")
    print("Screenshot saved to /home/jules/verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_lazy_loading(page)
        finally:
            browser.close()
