import concurrent.futures
import urllib.request
import urllib.error
import argparse
import sys
import os
import time
import random
from urllib.parse import urljoin

# Default headers
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://cineby.gd/"
}

MAX_WORKERS = 20

def get_headers():
    return DEFAULT_HEADERS

def download_data(url, retries=20, timeout=15):
    headers = get_headers()
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as e:
            # Check if it's a 404/403 which might be permanent? 
            # For now, assume we want to retry connection issues aggressively.
            
            # Print only on later attempts to avoid spamming for single hiccups
            if attempt > 1:
                print(f"\nWarning: Segment failed (attempt {attempt+1}/{retries}). Retrying in a moment... Error: {e}")
            
            # Backoff: wait 1s, 2s, 4s... capped at 10s
            sleep_time = min(1.5 ** attempt, 10)
            # Add jitter
            sleep_time += random.uniform(0, 1)
            time.sleep(sleep_time)
            
            if attempt == retries - 1:
                print(f"\nCRITICAL: Failed to download segment after {retries} attempts: {url}")
                return None
            continue
    return None

def main():
    parser = argparse.ArgumentParser(description="Download M3U8 video segments and merge them into a single file.")
    parser.add_argument("url", help="URL of the m3u8 playlist")
    parser.add_argument("-o", "--output", default=None, help="Output filename (default: downloaded_video_<timestamp>.ts)")
    parser.add_argument("-w", "--workers", type=int, default=MAX_WORKERS, help=f"Number of download threads (default: {MAX_WORKERS})")
    
    args = parser.parse_args()
    
    # Clean URL of common shell escape characters that might have been pasted in
    m3u8_url = args.url.replace('\\', '')
    
    if args.output:
        output_file = args.output
    else:
        # Generate a unique filename using timestamp
        import time
        timestamp = int(time.time())
        output_file = f"downloaded_video_{timestamp}.ts"

    max_workers = args.workers

    print(f"Fetching playlist from {m3u8_url}...")
    
    playlist_data = download_data(m3u8_url)
    if not playlist_data:
        print("Failed to fetch playlist. Check the URL or connection.")
        sys.exit(1)
    
    m3u8_content = playlist_data.decode('utf-8')
    lines = m3u8_content.splitlines()
    segments = []
    
    current_duration = 0
    total_duration = 0
    
    # Parse m3u8
    for line in lines:
        line = line.strip()
        if line.startswith("#EXTINF:"):
            try:
                duration_str = line.split(":")[1].split(",")[0]
                current_duration = float(duration_str)
            except ValueError:
                current_duration = 0
        elif line and not line.startswith("#"):
            segment_url = urljoin(m3u8_url, line)
            segments.append((segment_url, current_duration))
            total_duration += current_duration
    
    total_segments = len(segments)
    if total_segments == 0:
        print("No segments found in the playlist.")
        sys.exit(1)

    total_minutes = total_duration / 60
    print(f"Found {total_segments} segments totaling {total_minutes:.2f} minutes.")
    print(f"Output will be saved to: {output_file}")
    
    print(f"Starting download with {max_workers} threads...")
    
    segment_urls = [s[0] for s in segments]
    
    # Check if we can write to file
    try:
        with open(output_file, "wb"):
            pass
    except IOError as e:
        print(f"Cannot write to output file {output_file}: {e}")
        sys.exit(1)

    with open(output_file, "wb") as outfile:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # map returns an iterator that yields results in the order of the calls
            # ensuring consistent order of segments
            results = executor.map(download_data, segment_urls)
            
            success_count = 0
            fail_count = 0
            
            for i, data in enumerate(results):
                if data is None:
                    # Emergency retry in main thread with longer timeout
                    # print(f"\nSegment {i+1} failed ({segment_urls[i]}), retrying...") 
                    data = download_data(segment_urls[i], retries=5, timeout=60)
                
                if data:
                    outfile.write(data)
                    success_count += 1
                else:
                    fail_count += 1
                    print(f"\nFailed to download segment {i+1} after multiple retries.")
                
                # Progress bar
                percent = (i + 1) / total_segments * 100
                bar_length = 40
                filled_length = int(bar_length * (i + 1) // total_segments)
                bar = '=' * filled_length + '-' * (bar_length - filled_length)
                print(f"\r[{bar}] {percent:.1f}% ({i + 1}/{total_segments}) - Failed: {fail_count}", end='')

    print(f"\n\nDownload complete!")
    print(f"Success: {success_count}")
    print(f"Failed: {fail_count}")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main()
