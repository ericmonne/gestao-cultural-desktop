import os
import sys
import time
import socket
import threading
import webbrowser
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any, List

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import database
import services.tmdb as tmdb_service
import services.books as books_service
import services.music as music_service

# Initialize Database
database.init_db()

app = FastAPI(title="Acervo Cultural API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# ----------------- API ENDPOINTS -----------------

@app.get("/api/items")
def list_items(
    media_type: str = "all",
    status: str = "all",
    genre: str = "all",
    year: Optional[int] = None,
    country: str = "all",
    search: Optional[str] = None,
    sort_by: str = "created_desc"
):
    items = database.get_items(
        media_type=media_type,
        status=status,
        genre=genre,
        year=year,
        country=country,
        search=search,
        sort_by=sort_by
    )
    return {"items": items, "count": len(items)}

@app.post("/api/items")
def create_item(item_data: Dict[str, Any] = Body(...)):
    if not item_data.get("title"):
        raise HTTPException(status_code=400, detail="O título é obrigatório.")
    if not item_data.get("media_type"):
        raise HTTPException(status_code=400, detail="O tipo de mídia é obrigatório.")
    if not item_data.get("status"):
        item_data["status"] = "quero"
        
    item_id = database.add_item(item_data)
    return {"success": True, "id": item_id, "message": "Item salvo com sucesso!"}

@app.patch("/api/items/{item_id}/status")
def change_status(item_id: int, payload: Dict[str, str] = Body(...)):
    new_status = payload.get("status")
    allowed = ["concluido", "em_andamento", "favorito", "quero"]
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status inválido. Escolha entre: {', '.join(allowed)}")
        
    success = database.update_item_status(item_id, new_status)
    if not success:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    return {"success": True, "message": "Status atualizado com sucesso!", "status": new_status}

@app.patch("/api/items/{item_id}")
def update_item_details(item_id: int, payload: Dict[str, Any] = Body(...)):
    success = database.update_item(item_id, payload)
    if not success:
        raise HTTPException(status_code=404, detail="Item não encontrado ou nenhum campo alterado.")
    return {"success": True, "message": "Item atualizado com sucesso!"}

@app.delete("/api/items/{item_id}")
def remove_item(item_id: int):
    success = database.delete_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    return {"success": True, "message": "Item removido com sucesso!"}

@app.get("/api/filters")
def get_filters():
    data = database.get_filters_data()
    return data

@app.get("/api/search/external")
def search_external(
    query: str,
    media_type: str = "all"
):
    """
    Searches external open APIs:
    - TMDB for 'filme' and 'serie'
    - Open Library / Google Books for 'livro'
    - iTunes Search API for 'disco'
    """
    settings = database.get_all_settings()
    tmdb_key = settings.get("tmdb_api_key", "").strip()
    google_key = settings.get("google_books_api_key", "").strip()
    
    results: List[Dict[str, Any]] = []
    messages = []
    
    # 1. Filmes e Séries (TMDB)
    if media_type in ("all", "filme", "serie"):
        tmdb_res = tmdb_service.search_movies_and_series(query, tmdb_key, media_type)
        if tmdb_res.get("success"):
            results.extend(tmdb_res.get("results", []))
        else:
            messages.append({
                "type": "tmdb_notice",
                "media": "filmes_series",
                "error_type": tmdb_res.get("error_type"),
                "message": tmdb_res.get("message")
            })
            
    # 2. Livros (Open Library + Google Books)
    if media_type in ("all", "livro"):
        books_res = books_service.search_books(query, google_key)
        if books_res.get("success"):
            results.extend(books_res.get("results", []))
            
    # 3. Discos (iTunes Search + MusicBrainz)
    if media_type in ("all", "disco"):
        music_res = music_service.search_music(query)
        if music_res.get("success"):
            results.extend(music_res.get("results", []))
            
    # Mark items that are already in the user's personal catalog
    registered_map = database.get_registered_ids()
    for item in results:
        key = f"{item['media_type']}:{item['external_id']}"
        if key in registered_map:
            item["in_library"] = True
            item["current_status"] = registered_map[key]
        else:
            item["in_library"] = False
            item["current_status"] = None
            
    return {
        "query": query,
        "media_type": media_type,
        "results": results,
        "count": len(results),
        "messages": messages
    }

@app.get("/api/settings")
def get_settings():
    all_s = database.get_all_settings()
    # Mask API key partially for security when returning
    tmdb_key = all_s.get("tmdb_api_key", "")
    masked_key = (tmdb_key[:4] + "..." + tmdb_key[-4:]) if len(tmdb_key) > 8 else tmdb_key
    return {
        "tmdb_api_key": tmdb_key,
        "tmdb_key_masked": masked_key,
        "has_tmdb_key": bool(tmdb_key.strip()),
        "google_books_api_key": all_s.get("google_books_api_key", "")
    }

@app.post("/api/settings")
def save_settings(payload: Dict[str, str] = Body(...)):
    if "tmdb_api_key" in payload:
        database.set_setting("tmdb_api_key", payload["tmdb_api_key"].strip())
    if "google_books_api_key" in payload:
        database.set_setting("google_books_api_key", payload["google_books_api_key"].strip())
    return {"success": True, "message": "Configurações salvas com sucesso!"}

@app.post("/api/settings/test-tmdb")
def test_tmdb_endpoint(payload: Dict[str, str] = Body(...)):
    api_key = payload.get("tmdb_api_key", "").strip()
    if not api_key:
        api_key = database.get_setting("tmdb_api_key", "")
    res = tmdb_service.test_tmdb_key(api_key)
    return res

@app.post("/api/seed")
def seed_demo_data():
    """Seeds initial demonstrative cultural items across all 4 categories and statuses"""
    demo_items = [
        {
            "media_type": "filme",
            "external_id": "157336",
            "title": "Interestelar",
            "creator": "Christopher Nolan",
            "release_year": 2014,
            "genres": ["Ficção Científica", "Drama", "Aventura"],
            "country": "Estados Unidos",
            "status": "favorito",
            "cover_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            "overview": "As reservas naturais da Terra estão chegando ao fim e um grupo de astronautas recebe a missão de verificar possíveis planetas para receberem a população mundial.",
            "rating": 5.0,
            "user_notes": "Obra-prima do cinema de ficção científica. Trilha sonora inesquecível de Hans Zimmer."
        },
        {
            "media_type": "filme",
            "external_id": "670",
            "title": "Central do Brasil",
            "creator": "Walter Salles",
            "release_year": 1998,
            "genres": ["Drama"],
            "country": "Brasil",
            "status": "concluido",
            "cover_url": "https://image.tmdb.org/t/p/w500/iS51QZgO0yQ86V6Zz4lHjR7mH5t.jpg",
            "overview": "Dora escreve cartas para analfabetos na estação Central do Brasil. Ela ajuda o menino Josué a encontrar seu pai no sertão.",
            "rating": 5.0,
            "user_notes": "Atuação histórica de Fernanda Montenegro."
        },
        {
            "media_type": "serie",
            "external_id": "70523",
            "title": "Dark",
            "creator": "Baran bo Odar & Jantje Friese",
            "release_year": 2017,
            "genres": ["Ficção e Fantasia", "Mistério", "Drama"],
            "country": "Alemanha",
            "status": "concluido",
            "cover_url": "https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
            "overview": "O desaparecimento de duas crianças na cidade de Winden expõe as vidas duplas e os relacionamentos fraturados entre quatro famílias.",
            "rating": 4.8,
            "user_notes": "Roteiro amarrado do início ao fim."
        },
        {
            "media_type": "serie",
            "external_id": "115036",
            "title": "Ruptura (Severance)",
            "creator": "Dan Erickson",
            "release_year": 2022,
            "genres": ["Ficção e Fantasia", "Suspense", "Drama"],
            "country": "Estados Unidos",
            "status": "em_andamento",
            "cover_url": "https://image.tmdb.org/t/p/w500/j09H8v7Vf68P7i8T4CgC5t3s7M4.jpg",
            "overview": "Mark lidera uma equipe de funcionários de escritório cujas memórias foram divididas cirurgicamente entre o trabalho e a vida pessoal.",
            "rating": 4.5,
            "user_notes": "Estou na primeira temporada. Premissa fascinante."
        },
        {
            "media_type": "livro",
            "external_id": "torto_arado_itamar",
            "title": "Torto Arado",
            "creator": "Itamar Vieira Junior",
            "release_year": 2019,
            "genres": ["Literatura Brasileira", "Ficção", "Drama"],
            "country": "Brasil",
            "status": "favorito",
            "cover_url": "https://covers.openlibrary.org/b/id/10574043-L.jpg",
            "overview": "Nas profundezas do sertão baiano, as irmãs Bibiana e Belonísia encontram uma misteriosa faca guardada na mala de sua avó.",
            "rating": 5.0,
            "user_notes": "Um dos livros mais marcantes que já li na literatura contemporânea."
        },
        {
            "media_type": "livro",
            "external_id": "cem_anos_solidao",
            "title": "Cem Anos de Solidão",
            "creator": "Gabriel García Márquez",
            "release_year": 1967,
            "genres": ["Realismo Mágico", "Ficção", "Romance"],
            "country": "Colômbia",
            "status": "quero",
            "cover_url": "https://covers.openlibrary.org/b/id/8316279-L.jpg",
            "overview": "A história das várias gerações da família Buendía na aldeia mítica de Macondo.",
            "rating": 0,
            "user_notes": "Recomendação do clube do livro. Quero ler nas férias."
        },
        {
            "media_type": "disco",
            "external_id": "1473446573",
            "title": "Clube da Esquina",
            "creator": "Milton Nascimento & Lô Borges",
            "release_year": 1972,
            "genres": ["MPB", "Música Brasileira"],
            "country": "Brasil",
            "status": "favorito",
            "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/16/fe/be/16febeb7-b081-c66c-a26b-1f7cd097bd45/19UMGIM66061.rgb.jpg/600x600bb.jpg",
            "overview": "Álbum duplo clássico gravado por Milton Nascimento e Lô Borges em 1972 com arranjos históricos.",
            "rating": 5.0,
            "user_notes": "Disco perfeito da primeira à última música. 'Trem de Doido' e 'O Trem Azul' são destaques."
        },
        {
            "media_type": "disco",
            "external_id": "1441164426",
            "title": "Abbey Road",
            "creator": "The Beatles",
            "release_year": 1969,
            "genres": ["Rock"],
            "country": "Reino Unido",
            "status": "concluido",
            "cover_url": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ba/65/52/ba65529f-f529-ff82-b778-be7f73587b99/00602567713488.rgb.jpg/600x600bb.jpg",
            "overview": "Último álbum gravado pelos Beatles, famoso pelo medley no lado B e pela icônica faixa de pedestres.",
            "rating": 5.0,
            "user_notes": "O medley final é simplesmente inigualável."
        }
    ]
    
    count = 0
    for item in demo_items:
        try:
            database.add_item(item)
            count += 1
        except Exception as e:
            print(f"Erro ao inserir item demo: {e}")
            
    # Seed default favorite creators
    demo_creators = [
        {
            "name": "Christopher Nolan",
            "role": "diretor",
            "country": "Reino Unido",
            "notes": "Diretor visionário de Interestelar, Oppenheimer, A Origem e O Cavaleiro das Trevas.",
            "photo_url": "https://image.tmdb.org/t/p/w300/xuAIuYSmsUzKlUMBFGVZaWsY3Z5.jpg",
            "rating": 5.0
        },
        {
            "name": "Itamar Vieira Junior",
            "role": "autor",
            "country": "Brasil",
            "notes": "Um dos maiores nomes da literatura contemporânea brasileira, autor de Torto Arado e Salvar o Fogo.",
            "photo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Itamar_Vieira_Junior_%28cropped%29.jpg/330px-Itamar_Vieira_Junior_%28cropped%29.jpg",
            "rating": 5.0
        },
        {
            "name": "Milton Nascimento",
            "role": "artista",
            "country": "Brasil",
            "notes": "Uma das maiores vozes do mundo, criador do Clube da Esquina e patrimônio da música popular brasileira.",
            "photo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Milton_Nascimento_2022.jpg/330px-Milton_Nascimento_2022.jpg",
            "rating": 5.0
        },
        {
            "name": "Walter Salles",
            "role": "diretor",
            "country": "Brasil",
            "notes": "Diretor consagrado de Central do Brasil, Diários de Motocicleta e Ainda Estou Aqui.",
            "photo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Walter_Salles_66%C3%A8me_Festival_de_Venise_%28Mostra%29.jpg/330px-Walter_Salles_66%C3%A8me_Festival_de_Venise_%28Mostra%29.jpg",
            "rating": 5.0
        }
    ]
    
    for c in demo_creators:
        try:
            database.add_favorite_creator(c)
        except Exception as e:
            print(f"Erro ao inserir criador demo: {e}")
            
    return {"success": True, "message": f"{count} itens culturais e 4 criadores favoritos demonstrativos adicionados!", "count": count}

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    return database.get_dashboard_analytics()

@app.get("/api/stats/detailed")
def get_detailed_stats(media_type: str = "all"):
    """
    Retorna estatísticas detalhadas de gêneros, décadas, anos e países,
    filtradas por tipo de mídia (all, filme, serie, livro, disco).
    """
    return database.get_detailed_statistics(media_type=media_type)

@app.get("/api/creators")
def list_creators(role: Optional[str] = "all"):
    creators = database.get_favorite_creators(role=role)
    return {"creators": creators, "count": len(creators)}

@app.post("/api/creators")
def create_creator(payload: Dict[str, Any] = Body(...)):
    name = payload.get("name", "").strip()
    role = payload.get("role", "autor").strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="O nome do criador é obrigatório.")
    if role not in ("diretor", "autor", "artista"):
        raise HTTPException(status_code=400, detail="Função inválida. Escolha entre: diretor, autor ou artista.")
    cid = database.add_favorite_creator(payload)
    return {"success": True, "id": cid, "message": f"{name} adicionado aos criadores favoritos!"}

@app.patch("/api/creators/{creator_id}")
def update_creator(creator_id: int, payload: Dict[str, Any] = Body(...)):
    success = database.update_favorite_creator(creator_id, payload)
    if not success:
        raise HTTPException(status_code=404, detail="Criador não encontrado.")
    return {"success": True, "message": "Criador atualizado com sucesso!"}

@app.delete("/api/creators/{creator_id}")
def remove_creator(creator_id: int):
    success = database.delete_favorite_creator(creator_id)
    if not success:
        raise HTTPException(status_code=404, detail="Criador não encontrado.")
    return {"success": True, "message": "Criador removido com sucesso!"}

@app.get("/api/creators/suggestions")
def get_creator_suggestions():
    suggestions = database.get_suggested_creators()
    return {"suggestions": suggestions, "count": len(suggestions)}

@app.get("/api/creators/search-external")
def search_external_creators(query: str, role: Optional[str] = "all"):
    """Searches external open APIs for new directors, authors, and musical artists"""
    settings = database.get_all_settings()
    tmdb_key = settings.get("tmdb_api_key", "").strip()
    results = []
    
    # 1. Diretores (TMDB)
    if role in ("all", "diretor") and tmdb_key:
        directors = tmdb_service.search_directors(query, tmdb_key)
        results.extend(directors)
        
    # 2. Autores (Open Library)
    if role in ("all", "autor"):
        authors = books_service.search_authors(query)
        results.extend(authors)
        
    # 3. Artistas Musicais (iTunes)
    if role in ("all", "artista"):
        artists = music_service.search_musical_artists(query)
        results.extend(artists)
        
    # Check if already in favorite_creators
    existing = {f"{c['role']}:{c['name'].lower()}": True for c in database.get_favorite_creators()}
    for r in results:
        r["already_saved"] = existing.get(f"{r['role']}:{r['name'].lower()}", False)
        
    return {"results": results, "count": len(results)}

@app.get("/api/backup/export")
def export_backup():
    data = database.export_full_database()
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": f"attachment; filename=acervo_cultural_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        }
    )

@app.post("/api/backup/import")
def import_backup(payload: Dict[str, Any] = Body(...)):
    if not isinstance(payload, dict) or ("items" not in payload and "favorite_creators" not in payload):
        raise HTTPException(status_code=400, detail="Formato de backup inválido. O arquivo deve conter 'items' ou 'favorite_creators'.")
    res = database.import_full_database(payload)
    return res

@app.delete("/api/clear")
def clear_catalog():
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items")
    cursor.execute("DELETE FROM favorite_creators")
    conn.commit()
    conn.close()
    return {"success": True, "message": "Acervo e criadores limpos com sucesso."}

# Serve Static UI files
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Interface em construção. Arquivos estáticos serão carregados em breve."}

# ----------------- DESKTOP WINDOW LAUNCHER -----------------

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def run_uvicorn_server(port: int):
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")

def launch_desktop():
    port = 8765
    url = f"http://127.0.0.1:{port}"
    
    # Start server thread if not already running
    if not is_port_in_use(port):
        t = threading.Thread(target=run_uvicorn_server, args=(port,), daemon=True)
        t.start()
        time.sleep(1.2)
        
    # Check if pywebview is requested or available
    use_browser = "--browser" in sys.argv
    
    if not use_browser:
        try:
            import webview
            print(f"Iniciando Acervo Cultural em janela desktop nativa: {url}")
            window = webview.create_window(
                title="Acervo Cultural - Filmes, Séries, Livros & Música",
                url=url,
                width=1280,
                height=840,
                min_size=(960, 600)
            )
            webview.start()
            sys.exit(0)
        except Exception as e:
            print(f"Aviso pywebview ({e}). Abrindo em modo aplicativo no navegador...")

    # Fallback: Open Edge in App Mode (which looks identical to a desktop app window)
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]
    
    opened = False
    for browser_exe in edge_paths:
        if os.path.exists(browser_exe):
            cmd = f'"{browser_exe}" --app={url} --window-size=1280,840'
            subprocess.Popen(cmd, shell=True)
            opened = True
            break
            
    if not opened:
        webbrowser.open(url)
        
    print(f"Acervo Cultural rodando em: {url}")
    # Keep main thread alive if using browser fallback
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nEncerrando Acervo Cultural...")

if __name__ == "__main__":
    launch_desktop()
