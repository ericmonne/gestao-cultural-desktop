import requests
from typing import List, Dict, Any

def format_itunes_album(item: Dict[str, Any]) -> Dict[str, Any]:
    rel_date = item.get("releaseDate") or ""
    year = int(rel_date[:4]) if rel_date and len(rel_date) >= 4 and rel_date[:4].isdigit() else None
    
    artwork = item.get("artworkUrl100") or item.get("artworkUrl60") or ""
    if artwork:
        artwork = artwork.replace("100x100bb.jpg", "600x600bb.jpg").replace("60x60bb.jpg", "600x600bb.jpg")
        
    genre = item.get("primaryGenreName") or "Música"
    country_code = item.get("country") or "USA"
    
    artist = item.get("artistName") or "Artista Desconhecido"
    album_title = item.get("collectionName") or "Álbum Sem Título"
    track_count = item.get("trackCount")
    
    overview = f"Álbum por {artist}."
    if track_count:
        overview += f" Contém {track_count} faixas."
    if year:
        overview += f" Lançado em {year}."
        
    return {
        "media_type": "disco",
        "external_id": str(item.get("collectionId")),
        "title": album_title,
        "creator": artist,
        "release_year": year,
        "genres": [genre],
        "country": country_code,
        "cover_url": artwork,
        "overview": overview,
        "rating": 0
    }

def search_itunes(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    results = []
    seen_ids = set()
    
    # Try with general search and artist-specific search
    search_queries = [
        {"term": query.strip(), "entity": "album"},
        {"term": query.strip(), "entity": "album", "attribute": "artistTerm"}
    ]
    
    for country_param in ["BR", "US"]:
        for sq in search_queries:
            try:
                url = "https://itunes.apple.com/search"
                params = {**sq, "limit": limit, "country": country_param}
                res = requests.get(url, params=params, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("results", []):
                        col_id = str(item.get("collectionId"))
                        if col_id and col_id not in seen_ids:
                            seen_ids.add(col_id)
                            results.append(format_itunes_album(item))
                            if len(results) >= limit:
                                return results
            except Exception as e:
                print(f"Erro iTunes Search ({country_param}): {e}")
            
    return results

def search_musicbrainz_fallback(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    results = []
    try:
        url = "https://musicbrainz.org/ws/2/release-group/"
        params = {
            "query": f'releasegroup:"{query}" OR artist:"{query}"',
            "type": "album",
            "fmt": "json",
            "limit": limit
        }
        headers = {"User-Agent": "AcervoCultural/1.0 (Desktop Cultural Catalog App)"}
        res = requests.get(url, params=params, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            for rg in data.get("release-groups", []):
                mbid = rg.get("id")
                title = rg.get("title")
                artist_credit = rg.get("artist-credit", [])
                artist = artist_credit[0].get("name") if artist_credit else "Artista Desconhecido"
                first_date = rg.get("first-release-date") or ""
                year = int(first_date[:4]) if len(first_date) >= 4 and first_date[:4].isdigit() else None
                
                cover_url = f"https://coverartarchive.org/release-group/{mbid}/front-500" if mbid else ""
                tags = [t.get("name").title() for t in rg.get("tags", [])[:2]]
                genres = tags if tags else ["Música"]
                
                results.append({
                    "media_type": "disco",
                    "external_id": f"mb_{mbid}",
                    "title": title,
                    "creator": artist,
                    "release_year": year,
                    "genres": genres,
                    "country": "Desconhecido",
                    "cover_url": cover_url,
                    "overview": f"Álbum por {artist}.",
                    "rating": 0
                })
    except Exception as e:
        print(f"Erro MusicBrainz: {e}")
    return results

def search_music(query: str) -> Dict[str, Any]:
    itunes_results = search_itunes(query, limit=15)
    if itunes_results:
        return {"success": True, "results": itunes_results}
        
    mb_results = search_musicbrainz_fallback(query, limit=10)
    if mb_results:
        return {"success": True, "results": mb_results}
        
    return {"success": True, "results": []}

def search_musical_artists(query: str) -> List[Dict[str, Any]]:
    """Searches iTunes for musical artists/bands to add to favorite creators"""
    artists = []
    try:
        url = "https://itunes.apple.com/search"
        params = {"term": query.strip(), "entity": "musicArtist", "limit": 8}
        res = requests.get(url, params=params, timeout=10)
        if res.status_code == 200:
            for a in res.json().get("results", []):
                genre = a.get("primaryGenreName") or "Música"
                name = a.get("artistName")
                artist_type = a.get("artistType") or "Artista"
                
                # Fetch top album by this artist to grab high-res artwork for their avatar!
                album_art = ""
                try:
                    alb_res = requests.get(f"https://itunes.apple.com/lookup?id={a.get('artistId')}&entity=album&limit=1", timeout=5)
                    if alb_res.status_code == 200:
                        alb_items = alb_res.json().get("results", [])
                        if len(alb_items) > 1:
                            art = alb_items[1].get("artworkUrl100") or ""
                            album_art = art.replace("100x100bb.jpg", "600x600bb.jpg")
                except Exception:
                    pass
                    
                artists.append({
                    "name": name,
                    "role": "artista",
                    "photo_url": album_art,
                    "country": "Brasil" if "brazil" in str(a).lower() else "Internacional",
                    "notes": f"Artista musical do gênero {genre}."
                })
    except Exception as e:
        print(f"Erro ao buscar artistas iTunes: {e}")
    return artists
