from playwright.sync_api import sync_playwright

def verify_app(page):
    # Go to the local dev server
    page.goto('http://localhost:5173')

    # Wait for the app content to load (checking for the API Key input which is TypedApiKeyInput)
    # The API Key input is likely an input field, maybe type="password" or "text"
    # Looking at App.tsx, ApiKeyInput is rendered in the header.
    # Let's wait for the header text instead.
    page.wait_for_selector('text=Auto-Correcting Frame Generator')

    # Take a screenshot
    page.screenshot(path='verification/app_start.png')
    print("Screenshot taken at verification/app_start.png")

if __name__ == '__main__':
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_app(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
