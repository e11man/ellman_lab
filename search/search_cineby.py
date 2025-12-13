import argparse
import requests
import sys

API_URL = "https://db.videasy.net/3/search/multi"

def search_media(query):
    params = {
        "query": query,
        "language": "en",
        "page": "1"
    }
    try:
        response = requests.get(API_URL, params=params)
        response.raise_for_status()
        return response.json().get("results", [])
    except Exception as e:
        print(f"Error searching: {e}", file=sys.stderr)
        return []

def main():
    parser = argparse.ArgumentParser(description="Search for movies/TV shows on Cineby")
    parser.add_argument("query", help="The search query (e.g., 'The Matrix')")
    parser.add_argument("--first", action="store_true", help="Only output the URL of the first result (useful for automation)")
    args = parser.parse_args()

    results = search_media(args.query)
    
    # Filter out people, keep only movies and tv
    media_results = [r for r in results if r.get("media_type") in ["movie", "tv"]]

    if not media_results:
        print("No results found.", file=sys.stderr)
        sys.exit(1)

    if args.first:
        top = media_results[0]
        url = f"https://www.cineby.gd/{top['media_type']}/{top['id']}"
        print(url)
    else:
        print(f"Found {len(media_results)} results for '{args.query}':\n")
        for i, item in enumerate(media_results):
            title = item.get("title") or item.get("name")
            year = item.get("release_date") or item.get("first_air_date") or "N/A"
            if year != "N/A":
                year = year.split("-")[0]
            
            m_type = item.get("media_type")
            m_id = item.get("id")
            url = f"https://www.cineby.gd/{m_type}/{m_id}"
            
            print(f"{i+1}. {title} ({year}) [{m_type}]")
            print(f"   Link: {url}")
            print("")

if __name__ == "__main__":
    main()
