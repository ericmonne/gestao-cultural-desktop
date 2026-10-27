# 🎬 Acervo Cultural - Aplicação Desktop

Uma aplicação de desktop moderna, elegante e intuitiva desenvolvida para catalogar, segmentar e acompanhar seu consumo cultural de **Filmes, Séries, Livros e Discos Musicais**.

---

## 🌟 Principais Funcionalidades

1. **🎨 4 Temas de Cores Selecionáveis**:
   - 🌙 **Modo Escuro (Slate)**: Tema clássico sofisticado para ambientes de baixa luminosidade.
   - ☀️ **Modo Claro**: Fundo límpido, tipografia de alto contraste e visual elegante.
   - 🔮 **Modo Roxo Pastel (Suave)**: Paleta suave e aconchegante em tons de lavanda, lilás e creme, menos moderna e visualmente reconfortante.
   - 🌊 **Modo Tons Azuis Médios**: Paleta equilibrada em azul oceânico e denim (`#1c2e4a` / `#243a5e`), com contraste relaxante e acabamento refinado.
   - *Alternância instantânea no cabeçalho ou nas configurações, com salvamento automático.*

2. **🔠 Ajuste do Tamanho da Fonte (A- / A+)**:
   - Controle acessível no cabeçalho para aumentar ou diminuir a escala tipográfica da interface inteira (Pequeno, Médio, Grande e Extra Grande), garantindo leitura confortável e proporcional em qualquer monitor.

3. **💾 Backup Completo: Exportar e Importar Dados (JSON)**:
   - Exporte com 1 clique todas as suas obras, criadores favoritos, anotações e status em um arquivo `.json`.
   - Restaure ou transfira seu acervo com facilidade em qualquer computador.

4. **📊 Aba Exclusiva de Estatísticas Detalhadas (Gênero, Década, Ano e País)**:
   - Nova visão analítica profunda no topo da aplicação: **`[Acervo de Obras] | [Estatísticas Detalhadas] | [Autores, Diretores & Artistas]`**.
   - **Segmentação por Mídia**: Alterne entre *Todas as Mídias*, *Filmes*, *Séries*, *Livros* e *Discos*, com contadores dinâmicos.
   - **Painel de Indicadores (KPIs)**: Total de obras no escopo, gênero predominante, década mais marcante, país com maior volume e taxa de consumo.
   - **Quatro Dimensões Analíticas**:
     - 🏷️ **Gêneros Culturais**: Frequência de cada gênero, proporção percentual e identificação de obras favoritas.
     - 📅 **Décadas**: Visão por décadas (Anos 2020, 2010, 90, 80, 70, 60...) com listagem dos anos com obras no acervo.
     - 📆 **Ano de Lançamento**: Distribuição cronológica ano a ano.
     - 🌍 **País de Origem**: Mapeamento geográfico das suas obras.
   - **Atalho Direto para o Acervo**: Botão interativo `[Ver no Acervo ↗]` em qualquer barra estatística para filtrar instantaneamente o catálogo por aquele gênero, década, ano ou país!

5. **🔍 Busca Universal por Obra e por Nome de Diretor, Autor ou Artista**:
   - Busque produtos culturais tanto pelo **título da obra** quanto pelo **nome do criador**:
     - Diretores de cinema (ex.: *Christopher Nolan*, *Walter Salles*)
     - Autores e escritores (ex.: *Machado de Assis*, *Clarice Lispector*, *Itamar Vieira Junior*)
     - Artistas musicais e bandas (ex.: *Milton Nascimento*, *The Beatles*, *Chico Buarque*)
   - **Busca de Novos Criadores**: Na aba de Criadores Favoritos, consulte e descubra novos diretores (TMDB), autores (Open Library) e músicos (iTunes) diretamente pelas APIs abertas com foto, país e biografias!

6. **🎖️ Cargos Honorários & Escala de 8 Níveis Culturais**:
   - Painel analítico no topo da página inicial com seus **cargos e níveis de progressão** calculados por mídia:
     - **Nível 1**: até 10 obras
     - **Nível 2**: 11 a 50 obras
     - **Nível 3**: 51 a 100 obras
     - **Nível 4**: 101 a 500 obras
     - **Nível 5**: 501 a 1000 obras
     - **Nível 6**: 1001 a 2000 obras
     - **Nível 7**: 2001 a 5000 obras
     - **Nível 8**: 5000+ obras
   - Títulos exclusivos para cada categoria de mídia (*Filmes, Séries, Livros e Discos*) e um Cargo Mestre Cultural Unificado no topo do painel.
   - Barras de progresso e estatísticas percentuais com os **gêneros favoritos** em cada categoria.

3. **🌟 Área Exclusiva de Criadores Favoritos**:
   - Seção dedicada para registrar e gerenciar seus:
     - 🎬 **Diretores de Cinema**
     - ✍️ **Autores de Livros**
     - 🎸 **Artistas Musicais**
   - Com anotações pessoais, país de origem, foto/avatar e contador de **quantas obras desse criador você já possui no acervo**, além de botão para filtrar as obras dele com 1 clique!
   - Sugestões automáticas baseadas nas obras que você favoritou.

4. **Busca Universal Integrada em APIs Abertas**:
   - **Filmes e Séries**: Conectado à API oficial do **TMDB (The Movie Database)**.
   - **Livros**: Conectado ao acervo aberto do **Open Library** e **Google Books**.
   - **Discos Musicais**: Conectado ao catálogo de álbuns de alta resolução do **iTunes Search API** e **MusicBrainz**.

7. **Quatro Formas de Registro (Status)**:
   - 🟢 **"Já li/vi/ouvi"** (Concluído / Já consumido): Exibe todas as obras já consumidas e **inclui automaticamente as obras marcadas como favoritas**, refletindo o total real de consumo!
   - 🔵 **"Estou lendo/vendo/ouvindo"** (Em andamento)
   - ⭐ **"Favorito"** (Favorito pessoal): Filtro exclusivo para suas obras prediletas.
   - 🟣 **"Quero ler/ver/ouvir"** (Lista de desejos / Quero consumir)
   *(Os rótulos se adaptam dinamicamente ao tipo de mídia selecionado!)*

3. **Segmentação e Filtros Avançados**:
   - **Por Tipo de Mídia**: Abas com contadores em tempo real para Todos, Filmes, Séries, Livros e Discos.
   - **Por Status**: Filtragem com 1 clique entre os 4 estados de consumo.
   - **Por Gênero Cultural**: Dropdown dinâmico com todos os gêneros presentes no seu acervo (ex: MPB, Ficção Científica, Rock, Drama, Literatura Brasileira, Fantasia, etc.).
   - **Por Ano de Lançamento**: Segmentação por ano original da obra.
   - **Por País de Origem**: Segmentação geográfica (Brasil, Estados Unidos, Reino Unido, Alemanha, Japão, França, etc.).
   - **Busca Textual Instantânea**: Localização rápida por título, autor, diretor ou artista.
   - **Ordenação Flexível**: Por data de adição (mais recente/antigo), título (A-Z / Z-A), ano de lançamento ou avaliação por estrelas.

4. **Gerenciamento Completo do Acervo**:
   - **Alteração de Status Rápida**: Mude o status do item diretamente no card ou na tela de detalhes.
   - **Remoção Segura**: Exclua itens com confirmação imediata.
   - **Anotações Pessoais & Resenha**: Espaço para guardar suas impressões, notas e avaliação de 1 a 5 estrelas.
   - **Estatísticas Visuais**: Painel com gráficos e resumos dos seus hábitos culturais.

---

## 🚀 Como Executar a Aplicação

Você pode iniciar o **Acervo Cultural** de forma muito simples no Windows:

### Opção 1: Clique Duplo (Recomendado)
- Dê um duplo clique no arquivo **`iniciar.bat`** ou **`iniciar_silencioso.vbs`** (este último abre a janela diretamente sem mostrar o terminal preto).

### Opção 2: Linha de Comando
Abra o terminal na pasta do projeto e execute:
```bash
python app.py
```

A aplicação abrirá instantaneamente em uma **janela desktop nativa** (utilizando WebView2 / modo aplicativo), com desempenho rápido e visual moderno.

---

## 🔑 Guia Passo a Passo: Chaves de API

### 1. 🎬 Filmes e Séries: The Movie Database (TMDB)
Para pesquisar filmes e séries, o TMDB exige uma chave gratuita de desenvolvedor. O processo é simples e leva menos de 3 minutos:

1. Acesse: **[https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)** e crie sua conta gratuita.
2. Abra seu e-mail e clique no link de ativação enviado pelo TMDB.
3. Faça login no TMDB e acesse as configurações da API: **[https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)**.
4. Clique no botão **"Criar"** (ou *Create*) e escolha a opção **"Developer"** (Desenvolvedor).
5. Aceite os termos de serviço.
6. Preencha o formulário simples:
   - **Tipo de aplicação**: Selecione "Desktop".
   - **Nome da aplicação**: `Acervo Cultural`.
   - **URL da aplicação**: Pode colocar qualquer link seu (por exemplo, `http://localhost` ou seu perfil do GitHub/LinkedIn).
   - **Resumo da aplicação**: Digite `Aplicação pessoal para catalogar meus filmes e séries favoritos`.
   - Preencha seus dados de contato básicos (nome e endereço).
7. Clique em **"Enviar"**. Sua chave **API Key (v3 auth)** de 32 caracteres alfanuméricos aparecerá imediatamente na tela.
8. Abra o **Acervo Cultural**, clique no ícone de engrenagem ⚙️ (**Configurações**), cole sua chave no campo **The Movie Database (TMDB)**, clique em **Testar** (para confirmar que está verde) e em **Salvar Configurações**.

---

### 2. 📚 Livros: Open Library & Google Books
- **Chave de API necessária?** **NÃO!**
- O aplicativo já vem configurado de fábrica para consumir o catálogo aberto mundial da **Open Library**. Ele busca títulos em português e internacionais, autores, anos de lançamento e capas sem você precisar criar conta ou chave.
- *(Opcional)*: Se no futuro você quiser cadastrar uma chave própria do Google Books para respostas ainda mais rápidas, basta criar gratuitamente uma chave na Google Cloud Console e colá-la em Configurações.

---

### 3. 🎵 Discos Musicais: iTunes Search API & MusicBrainz
- **Chave de API necessária?** **NÃO!**
- A busca de álbuns e discos musicais utiliza a API aberta oficial da Apple (iTunes Search API) combinada com o acervo aberto do MusicBrainz.
- É **100% gratuita, ilimitada e não requer cadastro nem chave**.
- Retorna artistas, títulos de álbuns, ano de lançamento, gênero musical (MPB, Rock, Pop, etc.), país e capas em altíssima resolução (600x600px).

---

## 📂 Estrutura do Projeto

```
Coisas da Andy/
├── app.py                   # Servidor FastAPI e inicializador da janela desktop
├── database.py              # Banco de dados local SQLite, CRUD e filtros
├── services/
│   ├── tmdb.py              # Cliente de integração com TMDB (Filmes & Séries)
│   ├── books.py             # Cliente Open Library / Google Books (Livros)
│   └── music.py             # Cliente iTunes / MusicBrainz (Discos Musicais)
├── static/
│   ├── index.html           # Interface do Usuário moderna (Tailwind + Lucide)
│   ├── css/style.css        # Estilos customizados, posters e modais
│   ├── js/app.js            # Lógica reativa, filtros dinâmicos e requisições
│   └── img/placeholder.svg  # Capa padrão para obras sem imagem
├── data/
│   └── acervo.db            # Banco SQLite local persistente
├── iniciar.bat              # Inicializador rápido para Windows
├── iniciar_silencioso.vbs   # Inicializador silencioso sem terminal
└── README.md                # Documentação e manual de uso
```

---

## 💡 Dica Inicial
Ao abrir a aplicação pela primeira vez, você pode clicar no botão **"Carregar Exemplos"** no centro da tela ou nas Configurações. O aplicativo carregará 8 obras culturais demonstrativas (com capas, anos, países, gêneros e os 4 status diferentes) para você testar imediatamente a segmentação e os filtros em tempo real!
