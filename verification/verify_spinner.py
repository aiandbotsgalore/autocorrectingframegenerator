
import time
from playwright.sync_api import sync_playwright

def verify_spinner():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the app
        # Wait for dev server to be ready
        time.sleep(5)
        page.goto("http://localhost:5173")

        # Wait for the API Key Input component to be visible
        page.wait_for_selector('h3:has-text("Enter Your Gemini API Key")')

        # Fill in the input with a dummy key to enable the button
        page.fill('input[type="password"]', "dummy-api-key")

        # Mock the validateApiKey function? No, we can't easily mock module internals from E2E.
        # But we can verify the loading state visual by clicking the button.
        # The button text should change to "Validating..." and show a spinner.
        # Since `validateApiKey` is async, we should see it briefly.
        # However, `validateApiKey` implementation imports `GoogleGenerativeAI`.
        # If we provide a dummy key, it will likely fail validation.
        # But the state `isValidating` will be true during the check.

        # We need to capture the state while it is validating.
        # To make it observable, we might need to intercept the network request or slow it down?
        # The `validateApiKey` function calls `genAI.getGenerativeModel` and `model.generateContent`.
        # We can intercept network requests to `generativelanguage.googleapis.com` and delay them.

        # Intercept and delay the API request
        def handle_route(route):
            time.sleep(2) # Delay by 2 seconds
            route.abort() # Fail it, we just want to see the spinner

        page.route("**/*generativelanguage.googleapis.com*", handle_route)

        # Click the Save Key button
        page.click('button:has-text("Save Key")')

        # Immediately check for the spinner and text
        # The spinner is a Loader2 icon with animate-spin class
        # We can look for the svg with animate-spin class

        # Take a screenshot while it's validating
        # We wait a tiny bit to ensure React has re-rendered
        time.sleep(0.5)

        page.screenshot(path="/home/jules/verification/spinner_verification.png")

        # Check if "Validating..." text is present
        # And check if the spinner is present
        content = page.content()
        if "Validating..." in content and "animate-spin" in content:
            print("Spinner and Validating text found!")
        else:
            print("Spinner or Validating text NOT found!")
            print(content)

        browser.close()

if __name__ == "__main__":
    verify_spinner()
