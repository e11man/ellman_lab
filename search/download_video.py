import concurrent.futures
import urllib.request
import urllib.error
import argparse
import sys
import os
import time
import random
import json as json_module
from urllib.parse import urljoin

# Default headers
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://cineby.gd/"
}

MAX_WORKERS = 10

# Global variable for custom headers (set from args)
CUSTOM_HEADERS = {}
CUSTOM_COOKIES = ""

def get_headers():
    headers = DEFAULT_HEADERS.copy()
    headers.update(CUSTOM_HEADERS)
    if CUSTOM_COOKIES:
        headers["Cookie"] = CUSTOM_COOKIES
    return headers

def download_data(url, retries=20, timeout=30):
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
                print(f"\nWarning: Segment failed (attempt {attempt+1}/{retries}). Retrying in a moment... Error: {e}", file=sys.stderr)
            
            # Backoff: wait 1s, 2s, 4s... capped at 10s
            sleep_time = min(1.5 ** attempt, 10)
            # Add jitter
            sleep_time += random.uniform(0, 1)
            time.sleep(sleep_time)
            
            if attempt == retries - 1:
                print(f"\nCRITICAL: Failed to download segment after {retries} attempts: {url}", file=sys.stderr)
                return None
            continue
    return None


def emit_progress(json_mode, event_type, data):
    """Output progress as JSON if json_mode is enabled"""
    if json_mode:
        output = {"event": event_type, **data}
        print(json_module.dumps(output), flush=True)
    else:
        # Regular text output for CLI usage
        if event_type == "info":
            print(data.get("message", ""))
        elif event_type == "progress":
            percent = data.get("percent", 0)
            current = data.get("current", 0)
            total = data.get("total", 0)
            failed = data.get("failed", 0)
            bar_length = 40
            filled_length = int(bar_length * current // total) if total > 0 else 0
            bar = '=' * filled_length + '-' * (bar_length - filled_length)
            print(f"\r[{bar}] {percent:.1f}% ({current}/{total}) - Failed: {failed}", end='', flush=True)
        elif event_type == "complete":
            print(f"\n\nDownload complete!")
            print(f"Success: {data.get('success', 0)}")
            print(f"Failed: {data.get('failed', 0)}")
            print(f"Saved to {data.get('output', 'unknown')}")
        elif event_type == "error":
            print(f"\nError: {data.get('message', 'Unknown error')}", file=sys.stderr)

def main():
    global CUSTOM_HEADERS, CUSTOM_COOKIES
    
    parser = argparse.ArgumentParser(description="Download M3U8 video segments and merge them into a single file.")
    parser.add_argument("url", help="URL of the m3u8 playlist")
    parser.add_argument("-o", "--output", default=None, help="Output filename (default: downloaded_video_<timestamp>.ts)")
    parser.add_argument("-w", "--workers", type=int, default=MAX_WORKERS, help=f"Number of download threads (default: {MAX_WORKERS})")
    parser.add_argument("--json", action="store_true", help="Output progress as JSON (for programmatic use)")
    parser.add_argument("--cookies", default="", help="Cookie string to use for requests")
    parser.add_argument("--referer", default="", help="Referer header to use")
    parser.add_argument("--user-agent", default="", help="User-Agent header to use")
    parser.add_argument("--origin", default="", help="Origin header to use")
    
    args = parser.parse_args()
    json_mode = args.json
    
    # Set custom headers from arguments
    CUSTOM_COOKIES = args.cookies
    if args.referer:
        CUSTOM_HEADERS["Referer"] = args.referer
    if args.user_agent:
        CUSTOM_HEADERS["User-Agent"] = args.user_agent
    if args.origin:
        CUSTOM_HEADERS["Origin"] = args.origin
    
    # Clean URL of common shell escape characters that might have been pasted in
    m3u8_url = args.url.replace('\\', '')
    
    if args.output:
        output_file = args.output
    else:
        # Generate a unique filename using timestamp
        timestamp = int(time.time())
        output_file = f"downloaded_video_{timestamp}.ts"

    max_workers = args.workers

    emit_progress(json_mode, "info", {"message": f"Fetching playlist from {m3u8_url}...", "stage": "fetching_playlist"})
    
    playlist_data = download_data(m3u8_url)
    if not playlist_data:
        emit_progress(json_mode, "error", {"message": "Failed to fetch playlist. Check the URL or connection."})
        sys.exit(1)
    
    m3u8_content = playlist_data.decode('utf-8')
    lines = m3u8_content.splitlines()
    
    # Check if this is a master playlist (contains variant streams)
    is_master_playlist = any('#EXT-X-STREAM-INF' in line for line in lines)
    
    if is_master_playlist:
        emit_progress(json_mode, "info", {"message": "Detected master playlist, selecting highest quality variant...", "stage": "selecting_quality"})
        
        # Parse variant streams and select highest bandwidth
        variants = []
        current_bandwidth = 0
        
        for i, line in enumerate(lines):
            line = line.strip()
            if line.startswith('#EXT-X-STREAM-INF'):
                # Extract bandwidth
                if 'BANDWIDTH=' in line:
                    try:
                        bw_str = line.split('BANDWIDTH=')[1].split(',')[0]
                        current_bandwidth = int(bw_str)
                    except (ValueError, IndexError):
                        current_bandwidth = 0
            elif line and not line.startswith('#') and current_bandwidth > 0:
                variant_url = urljoin(m3u8_url, line)
                variants.append((current_bandwidth, variant_url))
                current_bandwidth = 0
        
        if not variants:
            emit_progress(json_mode, "error", {"message": "No variant streams found in master playlist."})
            sys.exit(1)
        
        # Select highest bandwidth variant
        variants.sort(key=lambda x: x[0], reverse=True)
        best_bandwidth, media_playlist_url = variants[0]
        
        emit_progress(json_mode, "info", {
            "message": f"Selected variant with bandwidth {best_bandwidth} bps",
            "stage": "fetching_media_playlist",
            "bandwidth": best_bandwidth,
            "url": media_playlist_url
        })
        
        # Fetch the actual media playlist
        media_playlist_data = download_data(media_playlist_url)
        if not media_playlist_data:
            emit_progress(json_mode, "error", {"message": "Failed to fetch media playlist."})
            sys.exit(1)
        
        m3u8_content = media_playlist_data.decode('utf-8')
        lines = m3u8_content.splitlines()
        m3u8_url = media_playlist_url  # Update base URL for segment resolution
    
    segments = []
    current_duration = 0
    total_duration = 0
    
    # Parse m3u8 media playlist
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
            current_duration = 0  # Reset for next segment
    
    total_segments = len(segments)
    if total_segments == 0:
        emit_progress(json_mode, "error", {"message": "No segments found in the playlist."})
        sys.exit(1)

    total_minutes = total_duration / 60
    emit_progress(json_mode, "info", {
        "message": f"Found {total_segments} segments totaling {total_minutes:.2f} minutes.",
        "stage": "parsed_playlist",
        "total_segments": total_segments,
        "total_minutes": round(total_minutes, 2),
        "output_file": output_file
    })
    
    emit_progress(json_mode, "info", {"message": f"Starting download with {max_workers} threads...", "stage": "starting_download"})
    
    segment_urls = [s[0] for s in segments]
    
    # Check if we can write to file
    try:
        with open(output_file, "wb"):
            pass
    except IOError as e:
        emit_progress(json_mode, "error", {"message": f"Cannot write to output file {output_file}: {e}"})
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
                    data = download_data(segment_urls[i], retries=5, timeout=60)
                
                if data:
                    outfile.write(data)
                    success_count += 1
                else:
                    fail_count += 1
                    if not json_mode:
                        print(f"\nFailed to download segment {i+1} after multiple retries.", file=sys.stderr)
                
                # Progress update
                percent = (i + 1) / total_segments * 100
                emit_progress(json_mode, "progress", {
                    "percent": round(percent, 1),
                    "current": i + 1,
                    "total": total_segments,
                    "success": success_count,
                    "failed": fail_count
                })

    # Verify download
    file_size = os.path.getsize(output_file) if os.path.exists(output_file) else 0
    file_size_mb = file_size / (1024 * 1024)
    
    # Check if download was reasonably complete (allow up to 5% failures)
    failure_rate = fail_count / total_segments if total_segments > 0 else 0
    is_complete = failure_rate <= 0.05 and success_count > 0
    
    if not is_complete:
        emit_progress(json_mode, "error", {
            "message": f"Download incomplete: {success_count}/{total_segments} segments downloaded, {fail_count} failed ({failure_rate*100:.1f}% failure rate)",
            "success": success_count,
            "failed": fail_count,
            "total_segments": total_segments
        })
        sys.exit(1)
    
    emit_progress(json_mode, "complete", {
        "success": success_count,
        "failed": fail_count,
        "output": output_file,
        "total_segments": total_segments,
        "file_size_mb": round(file_size_mb, 2),
        "duration_minutes": round(total_duration / 60, 2),
        "is_complete": is_complete
    })

if __name__ == "__main__":
    main()

