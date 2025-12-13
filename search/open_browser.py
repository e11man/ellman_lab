import json
import sys
from pathlib import Path
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

TARGET_URL = "https://www.cineby.gd/movie/798645?play=true"

def main():
    profile_dir = Path.cwd() / ".chrome-lite-profile"
    profile_dir.mkdir(parents=True, exist_ok=True)

    options = webdriver.ChromeOptions()
    options.page_load_strategy = "none"
    options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
    options.add_argument(f"--user-data-dir={profile_dir}")
    options.add_argument("--profile-directory=Default")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-sync")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-default-apps")
    options.add_argument("--headless=new")
    options.add_experimental_option("prefs", {
        "profile.managed_default_content_settings.images": 2
    })

    driver = webdriver.Chrome(options=options)
    driver.get(TARGET_URL)

    # Print status to stderr so stdout remains clean for the result
    print(f"Browser opened. Monitoring URL: {TARGET_URL}", file=sys.stderr)
    print("Monitoring network traffic for M3U8 playlists...", file=sys.stderr)

    has_pressed_play = False
    
    try:
        while True:
            # Check if browser is still open
            try:
                current_url = driver.current_url
                
                # Capture performance logs
                logs = driver.get_log("performance")
                for entry in logs:
                    message_obj = json.loads(entry["message"])
                    message = message_obj.get("message", {})
                    method = message.get("method")
                    
                    if method == "Network.requestWillBeSent":
                        params = message.get("params", {})
                        request_url = params.get("request", {}).get("url", "")
                        
                        if ".m3u8" in request_url:
                            # Print only the URL to stdout
                            print(request_url)
                            return # Exit main(), prompting cleanup
                            
            except Exception:
                break
            
            # blocked redirects often change the url
            if current_url.split('?')[0] != TARGET_URL.split('?')[0]:
                 print(f"URL changed to {current_url}. Redirecting back...", file=sys.stderr)
                 driver.get(TARGET_URL)
                 has_pressed_play = False
                 time.sleep(2) 
            
            elif not has_pressed_play:
                time.sleep(3) 
                try:
                    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.SPACE)
                    print("Simulated Space bar press.", file=sys.stderr)
                    has_pressed_play = True
                except Exception as e:
                    print(f"Attempted to press Space but failed: {e}", file=sys.stderr)
            
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping...", file=sys.stderr)
    finally:
        driver.quit()




if __name__ == "__main__":
    main()
