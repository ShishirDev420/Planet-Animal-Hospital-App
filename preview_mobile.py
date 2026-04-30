from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # Mobile device - iPhone 12 Pro
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        device_scale_factor=3,
        is_mobile=True,
        has_touch=True,
        viewport={'width': 390, 'height': 844}
    )
    page = context.new_page()
    
    # Navigate to AI Vet page
    page.goto('http://localhost:3003/ai-vet')
    page.wait_for_load_state('networkidle')
    
    # Take screenshot
    page.screenshot(path='C:/Users/derma/OneDrive/Documents/Planet Animal Hospital App Latest/mobile_preview.png', full_page=True)
    print("Screenshot saved to mobile_preview.png")
    
    browser.close()