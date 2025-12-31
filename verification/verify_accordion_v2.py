from playwright.sync_api import sync_playwright, expect

def verify_accordion(page):
    page.goto("http://localhost:5173")

    # Wait for the main app to load
    page.wait_for_selector("text=Auto-Correcting Frame Generator")

    # Locate the toggle button
    # The PromptInput component (which contains ExamplePrompts) is only visible if apiKey is set?
    # Checking App.tsx:
    # {apiKey && !finalResult && !currentIteration && ( ... <TypedPromptInput ... /> ... )}
    # But ApiKeyInput is in the header? No, it's passed into header but also seems to be rendered conditionally?
    # Ah, in App.tsx:
    # <TypedApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} /> is in the header.
    # And PromptInput is in the main body IF apiKey is set.
    # Initially apiKey is empty string.
    # So we need to set an API key first to see PromptInput and ExamplePrompts.

    # Fill in a dummy API key
    page.get_by_label("Gemini API Key").fill("dummy_api_key")
    page.get_by_role("button", name="Save Key").click()

    # Now PromptInput should appear
    # Wait for Example Prompts button
    toggle_btn = page.get_by_role("button", name="Example Prompts")
    expect(toggle_btn).to_be_visible()

    # Verify initial state: aria-expanded should be false (or missing if I messed up, but I added it as false in code)
    # Actually in React state `false` usually renders as attribute="false" or nothing depending on implementation?
    # React `aria-expanded={false}` renders `aria-expanded="false"`.
    expect(toggle_btn).to_have_attribute("aria-expanded", "false")

    # Verify content is hidden (it is conditionally rendered, so it shouldn't exist in DOM)
    # If using conditional rendering {isExpanded && ...}, the element #example-prompts-content won't exist.
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
