import requests
from typing import List, Dict, Any, Optional

USER_AGENT = "AcervoCultural/1.0 (Desktop Cultural Catalog App)"

def search_open_library(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    results = []
    seen_ids = set()
    
    # Try general search (matches titles and authors) and author search
    for param_key in ["q", "author"]:
        try:
            url = "https://openlibrary.org/search.json"
            params = {
                param_key: query.strip(),
                "limit": limit,
                "fields": "key,title,author_name,first_publish_year,subject,language,cover_i,edition_count"
            }
            headers = {"User-Agent": USER_AGENT}
            res = requests.get(url, params=params, headers=headers, timeout=14)
            
            if res.status_code == 200:
                data = res.json()
                for doc in data.get("docs", []):
                    key = doc.get("key") or ""
                    ext_id = key.replace("/works/", "") if key else str(doc.get("cover_i") or doc.get("title"))
                    
                    if ext_id in seen_ids:
                        continue
                    seen_ids.add(ext_id)
                    
                    authors = doc.get("author_name") or []
                    creator = ", ".join(authors[:2]) if authors else "Autor desconhecido"
                    
                    year = doc.get("first_publish_year")
                    if year:
                        try:
                            year = int(year)
                        except Exception:
                            year = None
                            
                    subjects = doc.get("subject") or []
                    genres = []
                    for s in subjects[:5]:
                        s_clean = s.strip()
                        if len(s_clean) > 2 and len(s_clean) < 30 and not s_clean.startswith("accessible"):
                            genres.append(s_clean)
                    if not genres:
                        genres = ["Literatura"]
                        
                    langs = doc.get("language") or []
                    country_code = langs[0] if langs else "por"
                    
                    cover_i = doc.get("cover_i")
                    cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg" if cover_i else ""
                    
                    results.append({
                        "media_type": "livro",
                        "external_id": ext_id,
                        "title": doc.get("title") or "Livro sem título",
                        "creator": creator,
                        "release_year": year,
                        "genres": genres[:3],
                        "country": country_code,
                        "cover_url": cover_url,
                        "overview": f"Livro por {creator}. Publicado originalmente em {year}." if year else f"Livro por {creator}.",
                        "rating": 0
                    })
                    
                    if len(results) >= limit:
                        return results
                if len(results) >= 5:
                    break
        except Exception as e:
            print(f"Erro Open Library ({param_key}): {e}")
            
    return results

def search_google_books(query: str, api_key: Optional[str] = None, limit: int = 15) -> List[Dict[str, Any]]:
    results = []
    try:
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {
            "q": query.strip(),
            "maxResults": min(limit, 20),
            "printType": "books"
        }
        if api_key and api_key.strip():
            params["key"] = api_key.strip()
            
        res = requests.get(url, params=params, timeout=10)
        if res.status_code == 200:
            data = res.json()
            for item in data.get("items", []):
                vol = item.get("volumeInfo", {})
                authors = vol.get("authors") or []
                creator = ", ".join(authors) if authors else "Autor desconhecido"
                
                pub_date = vol.get("publishedDate") or ""
                year = int(pub_date[:4]) if pub_date and len(pub_date) >= 4 and pub_date[:4].isdigit() else None
                
                categories = vol.get("categories") or ["Livro"]
                
                image_links = vol.get("imageLinks") or {}
                cover = image_links.get("thumbnail") or image_links.get("smallThumbnail") or ""
                if cover.startswith("http:"):
                    cover = cover.replace("http:", "https:")
                    
                lang = vol.get("language") or "pt"
                country = "Brasil" if lang == "pt" else ("Estados Unidos" if lang == "en" else lang.upper())
                
                results.append({
                    "media_type": "livro",
                    "external_id": item.get("id"),
                    "title": vol.get("title") or "Livro sem título",
                    "creator": creator,
                    "release_year": year,
                    "genres": categories[:3],
                    "country": country,
                    "cover_url": cover,
                    "overview": vol.get("description") or "",
                    "rating": vol.get("averageRating") or 0
                })
    except Exception as e:
        print(f"Erro Google Books: {e}")
        
    return results

def search_books(query: str, google_key: Optional[str] = None) -> Dict[str, Any]:
    if google_key and google_key.strip():
        gb_res = search_google_books(query, google_key)
        if gb_res:
            return {"success": True, "results": gb_res}
            
    ol_res = search_open_library(query)
    if ol_res:
        return {"success": True, "results": ol_res}
        
    gb_fallback = search_google_books(query, None)
    if gb_fallback:
        return {"success": True, "results": gb_fallback}
        
    return {"success": True, "results": []}

def search_authors(query: str) -> List[Dict[str, Any]]:
    """Searches Open Library for authors to add to favorite creators"""
    authors = []
    try:
        url = "https://openlibrary.org/search/authors.json"
        params = {"q": query.strip(), "limit": 8}
        headers = {"User-Agent": USER_AGENT}
        res = requests.get(url, params=params, headers=headers, timeout=10)
        if res.status_code == 200:
            for a in res.json().get("docs", []):
                key = a.get("key")
                name = a.get("name")
                top_work = a.get("top_work")
                birth_date = a.get("birth_date")
                
                photo_url = f"https://covers.openlibrary.org/a/olid/{key}-L.jpg" if key else ""
                
                notes_parts = []
                if top_work:
                    notes_parts.append(f"Obra mais famosa: '{top_work}'.")
                if birth_date:
                    notes_parts.append(f"Nascimento: {birth_date}.")
                notes = " ".join(notes_parts) if notes_parts else "Autor(a) de literatura."
                
                authors.append({
                    "name": name,
                    "role": "autor",
                    "photo_url": photo_url,
                    "country": "Brasil" if ("brasil" in str(a).lower() or "portug" in str(a).lower()) else "Internacional",
                    "notes": notes
                })
    except Exception as e:
        print(f"Erro ao buscar autores Open Library: {e}")
    return authors
