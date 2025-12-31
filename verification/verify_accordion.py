from playwright.sync_api import sync_playwright, expect

def verify_accordion(page):
    page.goto("http://localhost:5173")

    # Locate the toggle button
    toggle_btn = page.get_by_role("button", name="Example Prompts")

    # Verify initial state: aria-expanded should be false
    expect(toggle_btn).to_have_attribute("aria-expanded", "false")

    # Verify content is hidden
    content = page.locator("#example-prompts-content")
    expect(content).not_to_be_visible()

    # Click to expand
    toggle_btn.click()

    # Verify expanded state: aria-expanded should be true
    expect(toggle_btn).to_have_attribute("aria-expanded", "true")
    expect(content).to_be_visible()

    # Verify ARIA controls relation
    expect(toggle_btn).to_have_attribute("aria-controls", "example-prompts-content")

    # Verify region role and label
    region = page.get_by_role("region", name="Example prompts list")
    expect(region).to_be_visible()

    # Verify Copy button aria-label
    # Find the first copy button inside the region
    copy_btn = region.get_by_label("Copy prompt for Martian Astronaut at Golden Hour")
    expect(copy_btn).to_be_visible()

    # Take screenshot of expanded state
    page.screenshot(path="verification/accordion_expanded.png")
    print("Verification successful!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_accordion(page)
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
