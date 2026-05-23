from playwright.sync_api import sync_playwright

# iPhone 16 Pro specs
# Viewport: 393 x 852
# Device scale factor: 3

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        device_scale_factor=3,
        is_mobile=True,
        has_touch=True,
        viewport={'width': 393, 'height': 852}
    )
    page = context.new_page()
    
    # Navigate to the app
    page.goto('http://localhost:3003')
    page.wait_for_load_state('networkidle')
    
    # Take screenshot
    screenshot_path = 'C:/Users/derma/OneDrive/Desktop/Planet Animal Hospital super latest app/Planet-Animal-Hospital-App/mobile-preview-iphone16pro.png'
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"Screenshot saved to {screenshot_path}")
    
    browser.close()
