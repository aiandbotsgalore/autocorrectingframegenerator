from playwright.sync_api import sync_playwright, expect

def verify_accordion(page):
    # Mock the Google Generative AI API call
    def handle_gemini_api(route):
        # Respond with a success JSON structure expected by the SDK
        # This is a guess at the structure, but usually 200 OK is enough for simple checks if SDK doesn't parse deeply?
        # Actually SDK expects a specific response format.
        # Minimal response:
        response_body = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Test response"}
                        ]
                    }
                }
            ]
        }
        route.fulfill(status=200, body=str(response_body).replace("'", '"')) # Simple JSON stringify

    # Intercept requests to Google AI API
    page.route("**/generativelanguage.googleapis.com/**", handle_gemini_api)

    page.goto("http://localhost:5173")

    # Wait for the main app to load
    page.wait_for_selector("text=Auto-Correcting Frame Generator")

    # Fill in a dummy API key
    page.get_by_label("Gemini API Key").fill("dummy_api_key")
    page.get_by_role("button", name="Save Key").click()

    # Now PromptInput should appear
    # Wait for Example Prompts button
    toggle_btn = page.get_by_role("button", name="Example Prompts")
    expect(toggle_btn).to_be_visible(timeout=10000)

    # Verify initial state: aria-expanded should be false
    expect(toggle_btn).to_have_attribute("aria-expanded", "false")

    # Verify content is hidden
    expect(page.locator("#example-prompts-content")).not_to_be_visible()

    # Click to expand
    toggle_btn.click()

    # Verify expanded state
    expect(toggle_btn).to_have_attribute("aria-expanded", "true")
    expect(page.locator("#example-prompts-content")).to_be_visible()

    # Verify ARIA controls relation
    expect(toggle_btn).to_have_attribute("aria-controls", "example-prompts-content")

    # Verify region role
    region = page.get_by_role("region", name="Example prompts list")
    expect(region).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/accordion_verified.png")
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
