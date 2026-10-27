import requests
from typing import List, Dict, Any, Optional

TMDB_GENRES = {
    # Filmes
    28: "Ação",
    12: "Aventura",
    16: "Animação",
    35: "Comédia",
    80: "Crime",
    99: "Documentário",
    18: "Drama",
    10751: "Família",
    14: "Fantasia",
    36: "História",
    27: "Terror",
    10402: "Música",
    9648: "Mistério",
    10749: "Romance",
    878: "Ficção Científica",
    10770: "Cinema TV",
    53: "Suspense",
    10752: "Guerra",
    37: "Faroeste",
    # Séries
    10759: "Ação e Aventura",
    10762: "Infantil",
    10763: "Notícias",
    10764: "Reality",
    10765: "Ficção e Fantasia",
    10766: "Novela",
    10767: "Talk Show",
    10768: "Guerra e Política"
}

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w300"

def test_tmdb_key(api_key: str) -> Dict[str, Any]:
    if not api_key or not api_key.strip():
        return {"valid": False, "message": "Chave de API não informada."}
    try:
        url = f"{TMDB_BASE_URL}/configuration"
        res = requests.get(url, params={"api_key": api_key.strip()}, timeout=8)
        if res.status_code == 200:
            return {"valid": True, "message": "Chave TMDB conectada com sucesso!"}
        elif res.status_code == 401:
            return {"valid": False, "message": "Chave TMDB inválida. Verifique os caracteres e tente novamente."}
        else:
            return {"valid": False, "message": f"Erro TMDB ({res.status_code}): {res.text}"}
    except Exception as e:
        return {"valid": False, "message": f"Erro de conexão: {str(e)}"}

def format_movie(item: Dict[str, Any], director_name: str = "") -> Dict[str, Any]:
    release_date = item.get("release_date") or ""
    year = int(release_date[:4]) if release_date and len(release_date) >= 4 and release_date[:4].isdigit() else None
    
    genre_ids = item.get("genre_ids") or []
    genres = [TMDB_GENRES[gid] for gid in genre_ids if gid in TMDB_GENRES]
    if not genres:
        genres = ["Filme"]
        
    poster_path = item.get("poster_path")
    cover_url = f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else ""
    lang = item.get("original_language") or ""
    
    creator = director_name if director_name else (item.get("original_title") if item.get("original_title") != item.get("title") else "Direção de Cinema")
    
    return {
        "media_type": "filme",
        "external_id": str(item.get("id")),
        "title": item.get("title") or item.get("original_title") or "Sem título",
        "creator": creator,
        "release_year": year,
        "genres": genres,
        "country": lang.upper() if lang else "Desconhecido",
        "cover_url": cover_url,
        "overview": item.get("overview") or "",
        "rating": round(item.get("vote_average", 0) / 2, 1) if item.get("vote_average") else 0
    }

def format_tv(item: Dict[str, Any], creator_name: str = "") -> Dict[str, Any]:
    first_air = item.get("first_air_date") or ""
    year = int(first_air[:4]) if first_air and len(first_air) >= 4 and first_air[:4].isdigit() else None
    
    genre_ids = item.get("genre_ids") or []
    genres = [TMDB_GENRES[gid] for gid in genre_ids if gid in TMDB_GENRES]
    if not genres:
        genres = ["Série"]
        
    poster_path = item.get("poster_path")
    cover_url = f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else ""
    
    origin_country = item.get("origin_country") or []
    country = origin_country[0] if origin_country else (item.get("original_language") or "").upper()
    
    creator = creator_name if creator_name else (item.get("original_name") if item.get("original_name") != item.get("name") else "Série de TV")
    
    return {
        "media_type": "serie",
        "external_id": str(item.get("id")),
        "title": item.get("name") or item.get("original_name") or "Sem título",
        "creator": creator,
        "release_year": year,
        "genres": genres,
        "country": country if country else "Desconhecido",
        "cover_url": cover_url,
        "overview": item.get("overview") or "",
        "rating": round(item.get("vote_average", 0) / 2, 1) if item.get("vote_average") else 0
    }

def search_movies_and_series(query: str, api_key: str, media_type: str = "all") -> Dict[str, Any]:
    if not api_key or not api_key.strip():
        return {
            "success": False,
            "error_type": "NO_API_KEY",
            "message": "Para pesquisar filmes e séries, insira sua chave de API do TMDB em Configurações.",
            "results": []
        }
        
    results: List[Dict[str, Any]] = []
    seen_ids = set()
    headers = {"Accept": "application/json"}
    
    try:
        # 1. Search movies if requested
        if media_type in ("all", "filme"):
            url = f"{TMDB_BASE_URL}/search/movie"
            params = {
                "api_key": api_key.strip(),
                "query": query.strip(),
                "language": "pt-BR",
                "include_adult": "false",
                "page": 1
            }
            res = requests.get(url, params=params, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for item in data.get("results", [])[:15]:
                    eid = f"filme:{item.get('id')}"
                    if eid not in seen_ids:
                        seen_ids.add(eid)
                        results.append(format_movie(item))
            elif res.status_code == 401:
                return {"success": False, "error_type": "INVALID_API_KEY", "message": "Chave TMDB inválida. Verifique em Configurações.", "results": []}
                
        # 2. Search series if requested
        if media_type in ("all", "serie"):
            url = f"{TMDB_BASE_URL}/search/tv"
            params = {
                "api_key": api_key.strip(),
                "query": query.strip(),
                "language": "pt-BR",
                "include_adult": "false",
                "page": 1
            }
            res = requests.get(url, params=params, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for item in data.get("results", [])[:15]:
                    eid = f"serie:{item.get('id')}"
                    if eid not in seen_ids:
                        seen_ids.add(eid)
                        results.append(format_tv(item))
            elif res.status_code == 401:
                return {"success": False, "error_type": "INVALID_API_KEY", "message": "Chave TMDB inválida. Verifique em Configurações.", "results": []}

        # 3. Search person / director (Permite buscar mídias pelo nome do DIRETOR/CRIADOR)
        try:
            url = f"{TMDB_BASE_URL}/search/person"
            params = {
                "api_key": api_key.strip(),
                "query": query.strip(),
                "language": "pt-BR",
                "include_adult": "false"
            }
            res = requests.get(url, params=params, headers=headers, timeout=8)
            if res.status_code == 200:
                data = res.json()
                person_results = data.get("results", [])
                if person_results:
                    person = person_results[0]
                    person_name = person.get("name")
                    person_id = person.get("id")
                    
                    # Fetch works directed or created by this person
                    credits_url = f"{TMDB_BASE_URL}/person/{person_id}/combined_credits"
                    c_res = requests.get(credits_url, params={"api_key": api_key.strip(), "language": "pt-BR"}, headers=headers, timeout=8)
                    if c_res.status_code == 200:
                        c_data = c_res.json()
                        crew = c_data.get("crew", [])
                        # Filter directed works or creators
                        directed = [c for c in crew if c.get("job") in ("Director", "Creator", "Executive Producer")]
                        if not directed:
                            directed = c_data.get("cast", [])[:10]
                            
                        for work in directed[:15]:
                            m_type = "filme" if work.get("media_type") == "movie" else "serie"
                            if media_type != "all" and media_type != m_type:
                                continue
                            eid = f"{m_type}:{work.get('id')}"
                            if eid not in seen_ids:
                                seen_ids.add(eid)
                                if m_type == "filme":
                                    results.append(format_movie(work, director_name=person_name))
                                else:
                                    results.append(format_tv(work, creator_name=person_name))
        except Exception as pe:
            print(f"Erro ao buscar diretor no TMDB: {pe}")

        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error_type": "REQUEST_ERROR", "message": f"Erro ao consultar TMDB: {str(e)}", "results": []}

def search_directors(query: str, api_key: str) -> List[Dict[str, Any]]:
    """Searches for directors/filmmakers on TMDB to add to favorite creators"""
    if not api_key or not api_key.strip():
        return []
    try:
        url = f"{TMDB_BASE_URL}/search/person"
        params = {
            "api_key": api_key.strip(),
            "query": query.strip(),
            "language": "pt-BR",
            "include_adult": "false"
        }
        res = requests.get(url, params=params, timeout=10)
        directors = []
        if res.status_code == 200:
            for p in res.json().get("results", [])[:8]:
                photo_path = p.get("profile_path")
                photo_url = f"{TMDB_PROFILE_BASE}{photo_path}" if photo_path else ""
                
                known_for = [k.get("title") or k.get("name") for k in p.get("known_for", []) if k.get("title") or k.get("name")]
                notes = f"Diretor(a) conhecido(a) por: {', '.join(known_for[:3])}." if known_for else "Cineasta."
                
                directors.append({
                    "name": p.get("name"),
                    "role": "diretor",
                    "photo_url": photo_url,
                    "country": "Internacional",
                    "notes": notes
                })
        return directors
    except Exception as e:
        print(f"Erro ao pesquisar diretores no TMDB: {e}")
        return []
