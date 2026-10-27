import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "acervo.db")

COUNTRY_MAP = {
    "US": "Estados Unidos",
    "USA": "Estados Unidos",
    "BR": "Brasil",
    "BRA": "Brasil",
    "GB": "Reino Unido",
    "GBR": "Reino Unido",
    "UK": "Reino Unido",
    "FR": "França",
    "FRA": "França",
    "JP": "Japão",
    "JPN": "Japão",
    "KR": "Coreia do Sul",
    "KOR": "Coreia do Sul",
    "IT": "Itália",
    "ITA": "Itália",
    "ES": "Espanha",
    "ESP": "Espanha",
    "DE": "Alemanha",
    "DEU": "Alemanha",
    "CA": "Canadá",
    "CAN": "Canadá",
    "MX": "México",
    "MEX": "México",
    "AR": "Argentina",
    "ARG": "Argentina",
    "PT": "Portugal",
    "PRT": "Portugal",
    "IE": "Irlanda",
    "IRL": "Irlanda",
    "AU": "Austrália",
    "AUS": "Austrália",
    "SE": "Suécia",
    "SWE": "Suécia",
    "NO": "Noruega",
    "NOR": "Noruega",
    "DK": "Dinamarca",
    "DNK": "Dinamarca",
    "CN": "China",
    "CHN": "China",
    "IN": "Índia",
    "IND": "Índia",
    "RU": "Rússia",
    "RUS": "Rússia",
    "CO": "Colômbia",
    "COL": "Colômbia",
    "CL": "Chile",
    "CHL": "Chile",
    "UY": "Uruguai",
    "URY": "Uruguai",
    "por": "Brasil",
    "eng": "Estados Unidos",
    "fre": "França",
    "spa": "Espanha",
    "ita": "Itália",
    "ger": "Alemanha",
    "jpn": "Japão",
    "kor": "Coreia do Sul",
    "rus": "Rússia",
    "chi": "China"
}

def normalize_country(code_or_name: str) -> str:
    if not code_or_name:
        return "Não informado"
    cleaned = str(code_or_name).strip()
    return COUNTRY_MAP.get(cleaned.upper(), COUNTRY_MAP.get(cleaned.lower(), cleaned))

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            media_type TEXT NOT NULL,
            external_id TEXT,
            title TEXT NOT NULL,
            creator TEXT,
            release_year INTEGER,
            genres TEXT,
            country TEXT,
            status TEXT NOT NULL,
            cover_url TEXT,
            overview TEXT,
            rating REAL DEFAULT 0,
            user_notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(media_type, external_id)
        )
    """)
    
    # Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    
    # Favorite Creators table (Autores, Diretores, Artistas Musicais)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorite_creators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL, -- 'diretor', 'autor', 'artista'
            photo_url TEXT DEFAULT '',
            country TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            rating REAL DEFAULT 5.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, role)
        )
    """)
    
    conn.commit()
    conn.close()

def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def set_setting(key: str, value: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    """, (key, value))
    conn.commit()
    conn.close()

def get_all_settings() -> Dict[str, str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}

def row_to_item_dict(row: sqlite3.Row) -> Dict[str, Any]:
    item = dict(row)
    # Parse genres JSON string into list
    if item.get("genres"):
        try:
            item["genres_list"] = json.loads(item["genres"])
        except Exception:
            item["genres_list"] = [g.strip() for g in item["genres"].split(",") if g.strip()]
    else:
        item["genres_list"] = []
    return item

def add_item(item_data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    genres = item_data.get("genres", [])
    if isinstance(genres, list):
        genres_json = json.dumps(genres, ensure_ascii=False)
    else:
        genres_json = json.dumps([str(genres)], ensure_ascii=False)
        
    country = normalize_country(item_data.get("country", ""))
    
    cursor.execute("""
        INSERT INTO items (
            media_type, external_id, title, creator, release_year,
            genres, country, status, cover_url, overview, rating, user_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(media_type, external_id) DO UPDATE SET
            status = excluded.status,
            rating = excluded.rating,
            user_notes = excluded.user_notes,
            updated_at = CURRENT_TIMESTAMP
    """, (
        item_data.get("media_type"),
        str(item_data.get("external_id", "")),
        item_data.get("title", "Sem título"),
        item_data.get("creator", ""),
        item_data.get("release_year"),
        genres_json,
        country,
        item_data.get("status", "quero"),
        item_data.get("cover_url", ""),
        item_data.get("overview", ""),
        item_data.get("rating", 0),
        item_data.get("user_notes", "")
    ))
    
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return item_id

def update_item_status(item_id: int, new_status: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE items
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, item_id))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def update_item(item_id: int, data: Dict[str, Any]) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    
    allowed = ["status", "rating", "user_notes", "genres", "country", "release_year"]
    updates = []
    params = []
    
    for key in allowed:
        if key in data:
            if key == "genres" and isinstance(data[key], list):
                updates.append(f"{key} = ?")
                params.append(json.dumps(data[key], ensure_ascii=False))
            elif key == "country":
                updates.append(f"{key} = ?")
                params.append(normalize_country(data[key]))
            else:
                updates.append(f"{key} = ?")
                params.append(data[key])
                
    if not updates:
        conn.close()
        return False
        
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(item_id)
    
    query = f"UPDATE items SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, params)
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def delete_item(item_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def get_items(
    media_type: Optional[str] = None,
    status: Optional[str] = None,
    genre: Optional[str] = None,
    year: Optional[int] = None,
    country: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_desc"
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    clauses = []
    params = []
    
    if media_type and media_type != "all":
        clauses.append("media_type = ?")
        params.append(media_type)
        
    if status and status != "all":
        if status == "concluido":
            # Requisito: itens 'favorito' também aparecem na lista 'já consumido' (já li/vi/ouvi)
            clauses.append("status IN ('concluido', 'favorito')")
        else:
            clauses.append("status = ?")
            params.append(status)
        
    if year:
        clauses.append("release_year = ?")
        params.append(year)
        
    if country and country != "all":
        clauses.append("country = ?")
        params.append(country)
        
    if genre and genre != "all":
        clauses.append("genres LIKE ?")
        params.append(f'%"{genre}"%')
        
    if search and isinstance(search, str) and search.strip():
        term = f"%{search.strip()}%"
        clauses.append("(title LIKE ? OR creator LIKE ? OR overview LIKE ?)")
        params.extend([term, term, term])
        
    where_sql = (" WHERE " + " AND ".join(clauses)) if clauses else ""
    
    sort_map = {
        "created_desc": "id DESC",
        "created_asc": "id ASC",
        "title_asc": "title COLLATE NOCASE ASC",
        "title_desc": "title COLLATE NOCASE DESC",
        "year_desc": "release_year DESC NULLS LAST, id DESC",
        "year_asc": "release_year ASC NULLS LAST, id DESC",
        "rating_desc": "rating DESC, id DESC"
    }
    order_sql = sort_map.get(sort_by, "id DESC")
    
    cursor.execute(f"SELECT * FROM items {where_sql} ORDER BY {order_sql}", params)
    rows = cursor.fetchall()
    conn.close()
    
    return [row_to_item_dict(r) for r in rows]

def get_filters_data() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT genres FROM items WHERE genres IS NOT NULL AND genres != ''")
    genre_rows = cursor.fetchall()
    genres_set = set()
    for row in genre_rows:
        try:
            parsed = json.loads(row["genres"])
            if isinstance(parsed, list):
                for g in parsed:
                    if g and g.strip():
                        genres_set.add(g.strip())
        except Exception:
            pass
            
    cursor.execute("SELECT DISTINCT release_year FROM items WHERE release_year IS NOT NULL ORDER BY release_year DESC")
    year_rows = cursor.fetchall()
    years = [r["release_year"] for r in year_rows if r["release_year"]]
    
    cursor.execute("SELECT DISTINCT country FROM items WHERE country IS NOT NULL AND country != '' ORDER BY country ASC")
    country_rows = cursor.fetchall()
    countries = [r["country"] for r in country_rows if r["country"] and r["country"] != "Não informado"]
    
    cursor.execute("SELECT media_type, COUNT(*) as count FROM items GROUP BY media_type")
    media_counts = {r["media_type"]: r["count"] for r in cursor.fetchall()}
    
    cursor.execute("SELECT status, COUNT(*) as count FROM items GROUP BY status")
    status_counts = {r["status"]: r["count"] for r in cursor.fetchall()}
    # Contagem de itens que aparecem ao filtrar por "concluido" (já consumido, incluindo favoritos)
    status_counts["concluido_com_favoritos"] = status_counts.get("concluido", 0) + status_counts.get("favorito", 0)
    
    cursor.execute("SELECT COUNT(*) as total FROM items")
    total_row = cursor.fetchone()
    total = total_row["total"] if total_row else 0
    
    conn.close()
    
    return {
        "genres": sorted(list(genres_set)),
        "years": years,
        "countries": sorted(countries),
        "media_counts": media_counts,
        "status_counts": status_counts,
        "total": total
    }

def get_registered_ids() -> Dict[str, str]:
    """Returns a dict mapping 'media_type:external_id' -> status for quick check in UI"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT media_type, external_id, status FROM items WHERE external_id IS NOT NULL")
    rows = cursor.fetchall()
    conn.close()
    return {f"{r['media_type']}:{r['external_id']}": r['status'] for r in rows}

# ================= FAVORITE CREATORS CRUD =================

def add_favorite_creator(data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    country = normalize_country(data.get("country", ""))
    
    cursor.execute("""
        INSERT INTO favorite_creators (name, role, photo_url, country, notes, rating)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(name, role) DO UPDATE SET
            photo_url = excluded.photo_url,
            country = excluded.country,
            notes = excluded.notes,
            rating = excluded.rating,
            updated_at = CURRENT_TIMESTAMP
    """, (
        data.get("name", "").strip(),
        data.get("role", "autor").strip().lower(),
        data.get("photo_url", "").strip(),
        country,
        data.get("notes", "").strip(),
        float(data.get("rating", 5.0))
    ))
    creator_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return creator_id

def get_favorite_creators(role: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    if role and role != "all":
        cursor.execute("SELECT * FROM favorite_creators WHERE role = ? ORDER BY name ASC", (role.lower(),))
    else:
        cursor.execute("SELECT * FROM favorite_creators ORDER BY role ASC, name ASC")
        
    rows = cursor.fetchall()
    creators = []
    
    for row in rows:
        c = dict(row)
        # Check how many works by this creator exist in the collection
        cursor.execute("SELECT COUNT(*) as count FROM items WHERE creator LIKE ?", (f"%{c['name']}%",))
        cnt = cursor.fetchone()
        c["works_in_library"] = cnt["count"] if cnt else 0
        creators.append(c)
        
    conn.close()
    return creators

def get_favorite_creator(creator_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM favorite_creators WHERE id = ?", (creator_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_favorite_creator(creator_id: int, data: Dict[str, Any]) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["name", "role", "photo_url", "country", "notes", "rating"]
    updates = []
    params = []
    
    for key in allowed:
        if key in data:
            if key == "country":
                updates.append("country = ?")
                params.append(normalize_country(data[key]))
            elif key == "role":
                updates.append("role = ?")
                params.append(data[key].strip().lower())
            else:
                updates.append(f"{key} = ?")
                params.append(data[key])
                
    if not updates:
        conn.close()
        return False
        
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(creator_id)
    
    query = f"UPDATE favorite_creators SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, params)
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def delete_favorite_creator(creator_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM favorite_creators WHERE id = ?", (creator_id,))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def get_suggested_creators() -> List[Dict[str, Any]]:
    """Returns creators of favorite works in library who aren't yet explicitly saved in favorite_creators"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get all saved creator names
    cursor.execute("SELECT LOWER(name) as name FROM favorite_creators")
    saved_names = {r["name"].strip() for r in cursor.fetchall()}
    
    cursor.execute("""
        SELECT creator, media_type, country, COUNT(*) as count 
        FROM items 
        WHERE status = 'favorito' AND creator IS NOT NULL AND creator != ''
        GROUP BY creator, media_type
        ORDER BY count DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    suggestions = []
    for r in rows:
        creator_name = r["creator"].strip()
        if creator_name.lower() not in saved_names:
            media = r["media_type"]
            role = "diretor" if media in ("filme", "serie") else ("autor" if media == "livro" else "artista")
            suggestions.append({
                "name": creator_name,
                "role": role,
                "media_type": media,
                "country": r["country"],
                "works_count": r["count"]
            })
            
    return suggestions[:8]

# ================= DASHBOARD ANALYTICS & CARGOS =================

def get_dashboard_analytics() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Total counts by media & status
    cursor.execute("SELECT media_type, COUNT(*) as count FROM items GROUP BY media_type")
    media_counts = {r["media_type"]: r["count"] for r in cursor.fetchall()}
    
    cursor.execute("SELECT status, COUNT(*) as count FROM items GROUP BY status")
    status_counts = {r["status"]: r["count"] for r in cursor.fetchall()}
    # Contagem de itens que aparecem ao filtrar por "concluido" (já consumido, incluindo favoritos)
    status_counts["concluido_com_favoritos"] = status_counts.get("concluido", 0) + status_counts.get("favorito", 0)
    
    cursor.execute("SELECT COUNT(*) as total FROM items")
    total_items = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(DISTINCT country) as total FROM items WHERE country != '' AND country != 'Não informado'")
    total_countries = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as total FROM favorite_creators")
    total_creators = cursor.fetchone()["total"]
    
    # 2. Favorite genres per media type
    media_types = ["filme", "serie", "livro", "disco"]
    genres_by_media = {}
    
    for m in media_types:
        cursor.execute("SELECT genres, status FROM items WHERE media_type = ?", (m,))
        rows = cursor.fetchall()
        genre_freq = {}
        fav_genre_freq = {}
        total_media_items = len(rows)
        
        for r in rows:
            is_fav = (r["status"] == "favorito")
            try:
                g_list = json.loads(r["genres"]) if r["genres"] else []
                for g in g_list:
                    if g and g.strip():
                        name = g.strip()
                        genre_freq[name] = genre_freq.get(name, 0) + 1
                        if is_fav:
                            fav_genre_freq[name] = fav_genre_freq.get(name, 0) + 2 # Extra weight for favorites!
            except Exception:
                pass
                
        # Merge scores: favorite genres get higher priority
        combined_scores = {}
        for g, count in genre_freq.items():
            combined_scores[g] = count + fav_genre_freq.get(g, 0)
            
        sorted_genres = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:4]
        
        genre_stats = []
        for g_name, _ in sorted_genres:
            raw_count = genre_freq[g_name]
            pct = round((raw_count / total_media_items * 100), 1) if total_media_items > 0 else 0
            genre_stats.append({
                "genre": g_name,
                "count": raw_count,
                "percentage": pct,
                "is_top_favorite": g_name in fav_genre_freq
            })
            
        genres_by_media[m] = {
            "total": total_media_items,
            "top_genres": genre_stats,
            "primary_favorite": genre_stats[0]["genre"] if genre_stats else "Diversificado"
        }
        
    conn.close()
    
    # 3. Calculate "Cargos" / Cultural Honorary Titles (Escala de 8 Níveis)
    def get_role_title(media: str, count: int) -> Dict[str, str]:
        # Escala solicitada pelo usuário:
        # Nível 1: até 10 obras
        # Nível 2: 11 a 50 obras
        # Nível 3: 51 a 100 obras
        # Nível 4: 101 a 500 obras
        # Nível 5: 501 a 1000 obras
        # Nível 6: 1001 a 2000 obras
        # Nível 7: 2001 a 5000 obras
        # Nível 8: 5000+ obras
        if count <= 10:
            level = 1
        elif count <= 50:
            level = 2
        elif count <= 100:
            level = 3
        elif count <= 500:
            level = 4
        elif count <= 1000:
            level = 5
        elif count <= 2000:
            level = 6
        elif count <= 5000:
            level = 7
        else:
            level = 8

        roles = {
            "filme": {
                1: {"title": "Cinéfila Curiosa", "desc": "Iniciando sua cinemateca pessoal (até 10 filmes)."},
                2: {"title": "Cinéfila Dedicada", "desc": "Repertório crescente de clássicos e festivais (11 a 50 filmes)."},
                3: {"title": "Crítica de Cinema", "desc": "Olhar analítico para fotografia, roteiro e direção (51 a 100 filmes)."},
                4: {"title": "Curadora Cinematográfica", "desc": "Vasta cinemateca de movimentos e diretores (101 a 500 filmes)."},
                5: {"title": "Mestre da Sétima Arte", "desc": "Conhecimento enciclopédico de eras e gêneros (501 a 1000 filmes)."},
                6: {"title": "Historiadora das Telas", "desc": "Magnitude de cinemateca nacional (1001 a 2000 filmes)."},
                7: {"title": "Guardiã do Cinema Mundial", "desc": "Raridades, vanguarda e acervo monumental (2001 a 5000 filmes)."},
                8: {"title": "Lenda da Cinematografia", "desc": "Acervo supremo digno de museu internacional (5000+ filmes)."}
            },
            "serie": {
                1: {"title": "Maratonista Iniciante", "desc": "Descobrindo primeiras temporadas e universos (até 10 séries)."},
                2: {"title": "Maratonista de Temporada", "desc": "Acompanhando arcos e grandes produções (11 a 50 séries)."},
                3: {"title": "Crítica de Séries & Pilotos", "desc": "Especialista em narrativas episódicas (51 a 100 séries)."},
                4: {"title": "Doutora em Streaming & TV", "desc": "Conhecedora de showrunners e antologias (101 a 500 séries)."},
                5: {"title": "Embaixadora da Cultura Serial", "desc": "Repertório televisivo de prestígio global (501 a 1000 séries)."},
                6: {"title": "Curadora Suprema de Séries", "desc": "Acervo de todas as eras da teledramaturgia (1001 a 2000 séries)."},
                7: {"title": "Arquivo Vivo da Televisão", "desc": "Séries e minisséries de todo o planeta (2001 a 5000 séries)."},
                8: {"title": "Lenda da Teledramaturgia & Séries", "desc": "Domínio absoluto do universo audiovisual serial (5000+ séries)."}
            },
            "livro": {
                1: {"title": "Leitora Frequente", "desc": "Inaugurando as primeiras prateleiras da estante (até 10 livros)."},
                2: {"title": "Leitora Voraz", "desc": "Mergulho em romances, contos e ensaios (11 a 50 livros)."},
                3: {"title": "Bibliófila Apaixonada", "desc": "Estante diversa com grandes autores e prêmios (51 a 100 livros)."},
                4: {"title": "Curadora Literária", "desc": "Biblioteca particular rica em gêneros e nações (101 a 500 livros)."},
                5: {"title": "Mestre da Literatura", "desc": "Domínio de correntes literárias de várias línguas (501 a 1000 livros)."},
                6: {"title": "Erudita das Letras", "desc": "Acervo monumental digno de academia literária (1001 a 2000 livros)."},
                7: {"title": "Guardiã da Biblioteca de Alexandria", "desc": "Tesouro vivo de literatura universal e poesia (2001 a 5000 livros)."},
                8: {"title": "Lenda Literária Universal", "desc": "Biblioteca viva monumental e eterna (5000+ livros)."}
            },
            "disco": {
                1: {"title": "Apreciadora de Discos", "desc": "Ouvidos atentos aos primeiros álbuns completos (até 10 discos)."},
                2: {"title": "Melômana de Carteirinha", "desc": "Discografia rica em arranjos e sonoridades (11 a 50 discos)."},
                3: {"title": "Arquiteta Musical", "desc": "Apreço refinado por produção e compositores (51 a 100 discos)."},
                4: {"title": "Curadora Sonora", "desc": "Coleção vasta de ritmos, décadas e estilos (101 a 500 discos)."},
                5: {"title": "Enciclopédia Sonora", "desc": "Domínio harmônico de gêneros e discografias (501 a 1000 discos)."},
                6: {"title": "Maestrina de Vinis & Álbuns", "desc": "Acervo de alta fidelidade e clássicos históricos (1001 a 2000 discos)."},
                7: {"title": "Guardiã da Harmonia Mundial", "desc": "Discografia colossal com raridades e obras-primas (2001 a 5000 discos)."},
                8: {"title": "Lenda da Musicologia", "desc": "Panteão sonoro infinito de todas as épocas (5000+ discos)."}
            }
        }
        
        icon = {"filme": "🎬", "serie": "📺", "livro": "📚", "disco": "🎵"}.get(media, "⭐")
        info = roles.get(media, {}).get(level, {"title": "Entusiasta", "desc": ""})
        return {
            "level": level,
            "title": info["title"],
            "badge": f"{icon} Nível {level}",
            "desc": info["desc"]
        }

    # Master title based on overall total (Escala de 8 Níveis)
    if total_items <= 10:
        master_level = 1
        master_title = "Colecionadora em Formação"
        master_sub = f"{total_items} obras salvas (Nível 1: até 10 obras)"
        master_color = "from-slate-600 to-slate-800"
    elif total_items <= 50:
        master_level = 2
        master_title = "Exploradora Cultural"
        master_sub = f"{total_items} obras em {total_countries} países (Nível 2: 11 a 50 obras)"
        master_color = "from-indigo-600 to-blue-700"
    elif total_items <= 100:
        master_level = 3
        master_title = "Curadora Cultural Ouro"
        master_sub = f"{total_items} obras e {total_creators} criadores (Nível 3: 51 a 100 obras)"
        master_color = "from-purple-600 to-indigo-700"
    elif total_items <= 500:
        master_level = 4
        master_title = "Guardiã das Artes"
        master_sub = f"{total_items} obras catalogadas (Nível 4: 101 a 500 obras)"
        master_color = "from-amber-600 to-rose-600"
    elif total_items <= 1000:
        master_level = 5
        master_title = "Magnata Cultural"
        master_sub = f"{total_items} obras em constante expansão (Nível 5: 501 a 1000 obras)"
        master_color = "from-emerald-600 to-teal-700"
    elif total_items <= 2000:
        master_level = 6
        master_title = "Patrimônio Cultural Vivo"
        master_sub = f"{total_items} obras de repercussão nacional (Nível 6: 1001 a 2000 obras)"
        master_color = "from-cyan-600 to-blue-800"
    elif total_items <= 5000:
        master_level = 7
        master_title = "Soberana das Humanidades"
        master_sub = f"{total_items} obras de acervo monumental (Nível 7: 2001 a 5000 obras)"
        master_color = "from-fuchsia-600 to-pink-700"
    else:
        master_level = 8
        master_title = "Lenda do Acervo Cultural Universal"
        master_sub = f"{total_items} obras primorosas catalogadas (Nível 8: 5000+ obras)"
        master_color = "from-amber-500 via-rose-500 to-purple-600"
        
    cargos = {
        "master": {
            "level": master_level,
            "title": master_title,
            "badge": f"⭐ Nível {master_level}",
            "subtitle": master_sub,
            "gradient": master_color,
            "total_items": total_items,
            "total_favorites": status_counts.get("favorito", 0),
            "total_countries": total_countries,
            "total_creators": total_creators
        },
        "filme": get_role_title("filme", media_counts.get("filme", 0)),
        "serie": get_role_title("serie", media_counts.get("serie", 0)),
        "livro": get_role_title("livro", media_counts.get("livro", 0)),
        "disco": get_role_title("disco", media_counts.get("disco", 0))
    }
    
    return {
        "cargos": cargos,
        "genres_by_media": genres_by_media,
        "summary": {
            "total_items": total_items,
            "total_favorites": status_counts.get("favorito", 0),
            "total_creators": total_creators,
            "total_countries": total_countries
        }
    }

# ================= DETAILED STATISTICS (ABAS GÊNERO, DÉCADA, ANO, PAÍS) =================

def get_detailed_statistics(media_type: str = "all") -> Dict[str, Any]:
    """
    Retorna dados estatísticos aprofundados segmentados por tipo de mídia e dimensões:
    - Gêneros culturais
    - Décadas de lançamento
    - Anos específicos de lançamento
    - Países de origem
    - Status de consumo (com itens favoritos computados também como consumidos)
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    where_sql = ""
    params = []
    if media_type and media_type != "all":
        where_sql = "WHERE media_type = ?"
        params.append(media_type)
        
    cursor.execute(f"SELECT * FROM items {where_sql} ORDER BY id ASC", params)
    rows = cursor.fetchall()
    items = [row_to_item_dict(r) for r in rows]
    total_items = len(items)
    
    # Contagens gerais por mídia para atualizar os contadores das abas
    cursor.execute("SELECT media_type, COUNT(*) as count FROM items GROUP BY media_type")
    media_counts = {r["media_type"]: r["count"] for r in cursor.fetchall()}
    
    cursor.execute("SELECT COUNT(*) as total FROM items")
    overall_total = cursor.fetchone()["total"]
    
    conn.close()
    
    if total_items == 0:
        return {
            "media_type": media_type,
            "total_items": 0,
            "overall_total": overall_total,
            "media_counts": media_counts,
            "genres": [],
            "decades": [],
            "years": [],
            "countries": [],
            "status_distribution": {
                "concluido": 0,
                "favorito": 0,
                "em_andamento": 0,
                "quero": 0,
                "total_consumed": 0,
                "consumed_percentage": 0
            },
            "summary": {
                "top_genre": "Nenhum",
                "top_genre_count": 0,
                "top_decade": "Nenhuma",
                "top_decade_count": 0,
                "top_year": "Nenhum",
                "top_year_count": 0,
                "top_country": "Nenhum",
                "top_country_count": 0,
                "total_consumed": 0,
                "consumed_percentage": 0
            }
        }
        
    # 1. GÊNEROS (GENRES)
    genre_freq = {}
    genre_fav_freq = {}
    for item in items:
        is_fav = (item.get("status") == "favorito")
        g_list = item.get("genres_list")
        if not g_list:
            raw_g = item.get("genres")
            if isinstance(raw_g, list):
                g_list = raw_g
            elif isinstance(raw_g, str):
                try:
                    g_list = json.loads(raw_g)
                except Exception:
                    g_list = [g.strip() for g in raw_g.split(",") if g.strip()]
            else:
                g_list = []
                
        for g in g_list:
            if g and isinstance(g, str) and g.strip():
                g_clean = g.strip()
                genre_freq[g_clean] = genre_freq.get(g_clean, 0) + 1
                if is_fav:
                    genre_fav_freq[g_clean] = genre_fav_freq.get(g_clean, 0) + 1
                    
    genres_data = []
    for g, count in sorted(genre_freq.items(), key=lambda x: (-x[1], x[0])):
        pct = round((count / total_items) * 100, 1)
        genres_data.append({
            "name": g,
            "count": count,
            "favorites_count": genre_fav_freq.get(g, 0),
            "percentage": pct
        })
        
    # 2. DÉCADAS (DECADES)
    decade_buckets = {}
    for item in items:
        yr = item.get("release_year")
        if yr and isinstance(yr, int):
            decade_start = (yr // 10) * 10
            decade_buckets.setdefault(decade_start, []).append(item)
            
    decades_data = []
    for d_start in sorted(decade_buckets.keys(), reverse=True):
        d_items = decade_buckets[d_start]
        count = len(d_items)
        pct = round((count / total_items) * 100, 1)
        
        if d_start >= 2000:
            label = f"Anos {d_start}"
            desc = f"{d_start} a {d_start+9}"
        elif d_start >= 1960:
            label = f"Anos {d_start % 100:02d}"
            desc = f"{d_start} a {d_start+9}"
        else:
            label = f"Década de {d_start}"
            desc = f"{d_start} a {d_start+9}"
            
        favs = sum(1 for it in d_items if it.get("status") == "favorito")
        years_present = sorted(list(set(it.get("release_year") for it in d_items if it.get("release_year"))))
        
        decades_data.append({
            "decade_start": d_start,
            "decade_end": d_start + 9,
            "label": label,
            "desc": desc,
            "count": count,
            "percentage": pct,
            "favorites_count": favs,
            "years_present": years_present
        })
        
    # 3. ANOS ESPECÍFICOS DE LANÇAMENTO (YEARS)
    year_freq = {}
    for item in items:
        yr = item.get("release_year")
        if yr and isinstance(yr, int):
            year_freq[yr] = year_freq.get(yr, 0) + 1
            
    years_data = []
    for yr, count in sorted(year_freq.items(), key=lambda x: -x[0]):
        pct = round((count / total_items) * 100, 1)
        favs = sum(1 for it in items if it.get("release_year") == yr and it.get("status") == "favorito")
        years_data.append({
            "year": yr,
            "count": count,
            "percentage": pct,
            "favorites_count": favs
        })
        
    # 4. PAÍSES DE ORIGEM (COUNTRIES)
    country_freq = {}
    for item in items:
        c = (item.get("country") or "").strip()
        if c and c != "Não informado":
            country_freq[c] = country_freq.get(c, 0) + 1
            
    countries_data = []
    for c, count in sorted(country_freq.items(), key=lambda x: (-x[1], x[0])):
        pct = round((count / total_items) * 100, 1)
        favs = sum(1 for it in items if (it.get("country") or "").strip() == c and it.get("status") == "favorito")
        countries_data.append({
            "country": c,
            "count": count,
            "percentage": pct,
            "favorites_count": favs
        })
        
    # 5. STATUS & CONSUMO (Já consumido inclui "concluido" e "favorito")
    concluido_count = sum(1 for it in items if it.get("status") == "concluido")
    favorito_count = sum(1 for it in items if it.get("status") == "favorito")
    andamento_count = sum(1 for it in items if it.get("status") == "em_andamento")
    quero_count = sum(1 for it in items if it.get("status") == "quero")
    total_consumed = concluido_count + favorito_count
    consumed_pct = round((total_consumed / total_items) * 100, 1) if total_items > 0 else 0
    
    # 6. RESUMO / KPIs
    top_genre = genres_data[0]["name"] if genres_data else "Diversificado"
    top_genre_count = genres_data[0]["count"] if genres_data else 0
    
    top_decade_item = max(decades_data, key=lambda x: x["count"]) if decades_data else None
    top_decade = top_decade_item["label"] if top_decade_item else "Diversificada"
    top_decade_count = top_decade_item["count"] if top_decade_item else 0
    
    top_year_item = max(years_data, key=lambda x: x["count"]) if years_data else None
    top_year = str(top_year_item["year"]) if top_year_item else "Variado"
    top_year_count = top_year_item["count"] if top_year_item else 0
    
    top_country = countries_data[0]["country"] if countries_data else "Diversificado"
    top_country_count = countries_data[0]["count"] if countries_data else 0
    
    return {
        "media_type": media_type,
        "total_items": total_items,
        "overall_total": overall_total,
        "media_counts": media_counts,
        "genres": genres_data,
        "decades": decades_data,
        "years": years_data,
        "countries": countries_data,
        "status_distribution": {
            "concluido": concluido_count,
            "favorito": favorito_count,
            "em_andamento": andamento_count,
            "quero": quero_count,
            "total_consumed": total_consumed,
            "consumed_percentage": consumed_pct
        },
        "summary": {
            "top_genre": top_genre,
            "top_genre_count": top_genre_count,
            "top_decade": top_decade,
            "top_decade_count": top_decade_count,
            "top_year": top_year,
            "top_year_count": top_year_count,
            "top_country": top_country,
            "top_country_count": top_country_count,
            "total_consumed": total_consumed,
            "consumed_percentage": consumed_pct
        }
    }

# ================= BACKUP: IMPORT & EXPORT =================

def export_full_database() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM items ORDER BY id ASC")
    items_rows = [row_to_item_dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM favorite_creators ORDER BY id ASC")
    creators_rows = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT key, value FROM settings")
    settings_rows = {r["key"]: r["value"] for r in cursor.fetchall()}
    
    conn.close()
    
    return {
        "app": "Acervo Cultural",
        "version": "1.2.0",
        "exported_at": datetime.now().isoformat(),
        "total_items": len(items_rows),
        "total_creators": len(creators_rows),
        "items": items_rows,
        "favorite_creators": creators_rows,
        "settings": settings_rows
    }

def import_full_database(data: Dict[str, Any], overwrite_all: bool = False) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    if overwrite_all:
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM favorite_creators")
        conn.commit()
    conn.close()
    
    imported_items = 0
    imported_creators = 0
    
    # Import items
    for item in data.get("items", []):
        try:
            add_item(item)
            imported_items += 1
        except Exception as e:
            print(f"Erro ao importar item: {e}")
            
    # Import creators
    for c in data.get("favorite_creators", []):
        try:
            add_favorite_creator(c)
            imported_creators += 1
        except Exception as e:
            print(f"Erro ao importar criador: {e}")
            
    # Import settings
    for k, v in data.get("settings", {}).items():
        try:
            set_setting(k, str(v))
        except Exception as e:
            print(f"Erro ao importar setting: {e}")
            
    return {
        "success": True,
        "imported_items": imported_items,
        "imported_creators": imported_creators,
        "message": f"Backup restaurado com sucesso! {imported_items} obras e {imported_creators} criadores processados."
    }

