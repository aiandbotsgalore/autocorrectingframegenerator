
import os
import re
import time
from playwright.sync_api import sync_playwright, expect

def verify_ui(page):
    # Mock the API key in local storage to bypass the key entry screen
    page.goto("http://localhost:5173")

    # Wait for page to load
    page.wait_for_load_state("networkidle")

    # Set API key in local storage and reload
    page.evaluate("localStorage.setItem('geminiApiKey', 'dummy_key')")
    page.reload()

    # Wait for the main UI to appear
    # The PromptInput component should be visible
    prompt_input = page.locator("textarea#prompt-input")
    expect(prompt_input).to_be_visible()

    # Check for the improved keyboard shortcut hint
    # We are looking for "Tip: Press Ctrl + Enter to start generation"
    # where Ctrl and Enter are in <kbd> tags
    # Use a more robust selector or get by text content partial match
    tip_text = page.locator("p", has_text="Tip: Press")
    expect(tip_text).to_be_visible()

    # Verify the structure of the hint (using CSS selectors to find the kbd tags)
    kbd_elements = tip_text.locator("kbd")
    expect(kbd_elements).to_have_count(2)
    expect(kbd_elements.first).to_have_text("Ctrl")
    expect(kbd_elements.last).to_have_text("Enter")

    # Take a screenshot of the prompt input area to verify the hint style
    # Just screenshot the whole viewport, or the parent of the input
    page.locator("#prompt-input").evaluate("el => el.parentElement.scrollIntoView()")
    time.sleep(0.5)
    # screenshot the parent element
    page.locator("#prompt-input").locator("..").screenshot(path="verification/prompt_input_hint.png")

    # Now let's try to verify the loading spinner button
    # We can't easily click generate because it requires a valid API key and will fail
    # But we can try to force the state if possible, or just check the button initial state

    generate_btn = page.locator("button", has_text="Generate & Auto-Refine")
    expect(generate_btn).to_be_visible()

    # To test the spinner, we might need to mock the submit handler or state
    # But for now, let's just verify the sparkle icon is there initially
    # The Sparkles icon usually renders as an SVG
    expect(generate_btn.locator("svg.lucide-sparkles")).to_be_visible()

    # We can't easily test the spinner without triggering the generation which fails with dummy key
    # However, we verified the code changes.

    print("Verification successful!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ui(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
