/**
 * Acervo Cultural - Desktop Application Frontend
 */

let state = {
  currentView: 'acervo', // 'acervo' | 'estatisticas' | 'criadores'
  currentTheme: 'dark',  // 'dark' | 'light' | 'purple'
  currentFontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl'
  mediaType: 'all',
  status: 'all',
  genre: 'all',
  year: 'all',
  country: 'all',
  search: '',
  sortBy: 'created_desc',
  items: [],
  filtersData: null,
  settings: {},
  activeDetailItem: null,
  searchMediaType: 'all',
  dashboardExpanded: true,
  // Creators state
  creatorFilter: 'all',
  creators: [],
  editingCreatorId: null,
  // Detailed stats state
  statsMediaType: 'all', // 'all' | 'filme' | 'serie' | 'livro' | 'disco'
  statsDimension: 'genero', // 'genero' | 'decada' | 'ano' | 'pais'
  detailedStatsData: null
};

const FONT_SCALES = ['sm', 'md', 'lg', 'xl'];
const FONT_LABELS = { sm: 'P', md: 'M', lg: 'G', xl: 'GG' };

const MEDIA_LABELS = {
  filme: { name: 'Filme', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  serie: { name: 'Série', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  livro: { name: 'Livro', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  disco: { name: 'Disco', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
};

const CREATOR_ROLES = {
  diretor: { label: 'Diretor(a) de Cinema', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: 'clapperboard' },
  autor: { label: 'Autor(a) de Livros', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: 'feather' },
  artista: { label: 'Artista Musical', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: 'music' }
};

function getStatusLabel(status, mediaType = 'all') {
  if (status === 'concluido') {
    if (mediaType === 'filme' || mediaType === 'serie') return 'Já vi';
    if (mediaType === 'livro') return 'Já li';
    if (mediaType === 'disco') return 'Já ouvi';
    return 'Já consumido';
  }
  if (status === 'em_andamento') {
    if (mediaType === 'filme' || mediaType === 'serie') return 'Estou vendo';
    if (mediaType === 'livro') return 'Estou lendo';
    if (mediaType === 'disco') return 'Estou ouvindo';
    return 'Em andamento';
  }
  if (status === 'favorito') {
    return 'Favorito ⭐';
  }
  if (status === 'quero') {
    if (mediaType === 'filme' || mediaType === 'serie') return 'Quero ver';
    if (mediaType === 'livro') return 'Quero ler';
    if (mediaType === 'disco') return 'Quero ouvir';
    return 'Quero consumir';
  }
  return status;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'concluido':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'em_andamento':
      return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    case 'favorito':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'quero':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    default:
      return 'bg-slate-700 text-slate-300 border-slate-600';
  }
}

// ----------------- INITIALIZATION -----------------

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFontSize();
  if (window.lucide) lucide.createIcons();
  loadSettings();
  loadFilters();
  loadItems();
  loadDashboardStats();
  loadCreators();
  loadCreatorSuggestions();
});

// ----------------- THEME MANAGEMENT -----------------

function initTheme() {
  const savedTheme = localStorage.getItem('acervo_theme') || 'dark';
  setTheme(savedTheme, false);
}

function setTheme(themeName, save = true) {
  state.currentTheme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);

  if (save) {
    localStorage.setItem('acervo_theme', themeName);
  }

  // Update theme button active highlights
  ['dark', 'light', 'purple', 'blue'].forEach(t => {
    const btn = document.getElementById(`themeBtn-${t}`);
    if (btn) {
      if (t === themeName) {
        btn.className = 'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-indigo-600 text-white shadow-sm transition-all';
      } else {
        btn.className = 'p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 text-slate-400 hover:text-white transition-all';
      }
    }
  });

  if (window.lucide) lucide.createIcons();
}

// ----------------- FONT SIZE SCALING -----------------

function initFontSize() {
  const savedSize = localStorage.getItem('acervo_fontsize') || 'md';
  setFontSize(savedSize, false);
}

function setFontSize(sizeKey, save = true) {
  if (!FONT_SCALES.includes(sizeKey)) sizeKey = 'md';
  state.currentFontSize = sizeKey;

  // Clear previous font classes
  FONT_SCALES.forEach(s => document.documentElement.classList.remove(`font-${s}`));
  document.documentElement.classList.add(`font-${sizeKey}`);

  const indicator = document.getElementById('fontSizeIndicator');
  if (indicator) {
    indicator.textContent = FONT_LABELS[sizeKey] || 'M';
  }

  if (save) {
    localStorage.setItem('acervo_fontsize', sizeKey);
  }
}

function changeFontSize(direction) {
  const currentIndex = FONT_SCALES.indexOf(state.currentFontSize);
  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) nextIndex = 0;
  if (nextIndex >= FONT_SCALES.length) nextIndex = FONT_SCALES.length - 1;

  setFontSize(FONT_SCALES[nextIndex], true);
}

// ----------------- VIEW SWITCHING (ACERVO vs ESTATÍSTICAS vs CRIADORES) -----------------

function switchView(viewName) {
  state.currentView = viewName;

  const acervoSec = document.getElementById('viewAcervoSection');
  const estatisticasSec = document.getElementById('viewEstatisticasSection');
  const criadoresSec = document.getElementById('viewCriadoresSection');
  const tabAcervo = document.getElementById('tabViewAcervo');
  const tabEstatisticas = document.getElementById('tabViewEstatisticas');
  const tabCriadores = document.getElementById('tabViewCriadores');

  // Reset inactive tab styles
  if (tabAcervo) tabAcervo.className = 'px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
  if (tabEstatisticas) tabEstatisticas.className = 'px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
  if (tabCriadores) tabCriadores.className = 'px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';

  // Hide all sections
  if (acervoSec) {
    acervoSec.classList.add('hidden');
    acervoSec.classList.remove('flex');
  }
  if (estatisticasSec) {
    estatisticasSec.classList.add('hidden');
    estatisticasSec.classList.remove('flex');
  }
  if (criadoresSec) {
    criadoresSec.classList.add('hidden');
    criadoresSec.classList.remove('flex');
  }

  if (viewName === 'acervo') {
    if (acervoSec) {
      acervoSec.classList.remove('hidden');
      acervoSec.classList.add('flex');
    }
    if (tabAcervo) tabAcervo.className = 'px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 transition-all';
    loadDashboardStats();
  } else if (viewName === 'estatisticas') {
    if (estatisticasSec) {
      estatisticasSec.classList.remove('hidden');
      estatisticasSec.classList.add('flex');
    }
    if (tabEstatisticas) tabEstatisticas.className = 'px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 transition-all';
    loadDetailedStats();
  } else if (viewName === 'criadores') {
    if (criadoresSec) {
      criadoresSec.classList.remove('hidden');
      criadoresSec.classList.add('flex');
    }
    if (tabCriadores) tabCriadores.className = 'px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold transition-all';
    loadCreators();
    loadCreatorSuggestions();
  }

  if (window.lucide) lucide.createIcons();
}

// ----------------- BACKUP: EXPORT & IMPORT -----------------

async function exportBackupData() {
  try {
    const res = await fetch('/api/backup/export');
    const data = await res.json();

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acervo_cultural_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Backup exportado com sucesso!', 'success');
  } catch (err) {
    console.error('Erro ao exportar backup:', err);
    showToast('Erro ao exportar dados do acervo', 'error');
  }
}

function handleBackupFileSelect(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsedData = JSON.parse(e.target.result);
      if (!parsedData || (!parsedData.items && !parsedData.favorite_creators)) {
        showToast('Arquivo de backup inválido.', 'error');
        return;
      }

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        loadFilters();
        loadItems();
        loadDashboardStats();
        loadCreators();
        loadCreatorSuggestions();
        closeSettingsModal();
      } else {
        showToast(data.detail || 'Erro ao importar backup', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao processar arquivo JSON de backup.', 'error');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

// ----------------- TOAST NOTIFICATIONS -----------------

function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMsg');
  const iconEl = document.getElementById('toastIcon');

  msgEl.textContent = message;
  if (type === 'success') {
    iconEl.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>';
    toast.className = toast.className.replace(/border-[a-z]+-[0-9]+/g, '') + ' border-emerald-500/40';
  } else if (type === 'error') {
    iconEl.innerHTML = '<i data-lucide="alert-circle" class="w-5 h-5 text-rose-400"></i>';
    toast.className = toast.className.replace(/border-[a-z]+-[0-9]+/g, '') + ' border-rose-500/40';
  } else {
    iconEl.innerHTML = '<i data-lucide="info" class="w-5 h-5 text-indigo-400"></i>';
    toast.className = toast.className.replace(/border-[a-z]+-[0-9]+/g, '') + ' border-indigo-500/40';
  }

  if (window.lucide) lucide.createIcons();

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3200);
}

// ----------------- DASHBOARD: CARGOS E GÊNEROS FAVORITOS -----------------

async function loadDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();

    // 1. Master Cargo Header
    const master = data.cargos?.master || {};
    document.getElementById('masterCargoTitle').textContent = master.title || 'Colecionadora em Formação';
    document.getElementById('masterCargoSubtitle').textContent = master.subtitle || `${master.total_items || 0} obras catalogadas`;
    const masterBadge = document.getElementById('masterCargoBadge');
    if (masterBadge && master.badge) {
      masterBadge.textContent = master.badge;
    }

    // 2. Media Cards: Filmes, Séries, Livros, Discos
    const mediaKeys = ['filme', 'serie', 'livro', 'disco'];
    mediaKeys.forEach(m => {
      const cargo = data.cargos?.[m] || {};
      const genreData = data.genres_by_media?.[m] || {};

      const titleEl = document.getElementById(`roleTitle-${m}`);
      const badgeEl = document.getElementById(`roleBadge-${m}`);
      const descEl = document.getElementById(`roleDesc-${m}`);
      const listEl = document.getElementById(`genresList-${m}`);

      if (titleEl) titleEl.textContent = cargo.title || 'Entusiasta';
      if (badgeEl) badgeEl.textContent = cargo.badge || '⭐';
      if (descEl) descEl.textContent = cargo.desc || '';

      if (listEl) {
        listEl.innerHTML = '';
        const topGenres = genreData.top_genres || [];
        if (topGenres.length === 0) {
          listEl.innerHTML = '<span class="text-xs text-slate-500 italic">Nenhum gênero ainda</span>';
        } else {
          topGenres.slice(0, 2).forEach(g => {
            const row = document.createElement('div');
            row.className = 'flex flex-col gap-0.5';
            row.innerHTML = `
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-medium text-slate-300 truncate">${g.genre}</span>
                <span class="text-indigo-400 font-bold ml-1">${g.percentage}%</span>
              </div>
              <div class="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style="width: ${Math.min(g.percentage, 100)}%"></div>
              </div>
            `;
            listEl.appendChild(row);
          });
        }
      }
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Erro ao carregar estatísticas do dashboard:', err);
  }
}

function toggleDashboardExpansion() {
  const grid = document.getElementById('mediaStatsCardsGrid');
  const btnText = document.getElementById('toggleDashboardText');
  const icon = document.getElementById('toggleDashboardIcon');

  state.dashboardExpanded = !state.dashboardExpanded;

  if (state.dashboardExpanded) {
    grid.classList.remove('hidden');
    btnText.textContent = 'Recolher Detalhes';
    icon.setAttribute('data-lucide', 'chevron-up');
  } else {
    grid.classList.add('hidden');
    btnText.textContent = 'Expandir Estatísticas & Cargos';
    icon.setAttribute('data-lucide', 'chevron-down');
  }

  if (window.lucide) lucide.createIcons();
}

// ----------------- CRIADORES FAVORITOS (AUTORES, DIRETORES, ARTISTAS) -----------------

async function loadCreators() {
  try {
    const res = await fetch(`/api/creators?role=${state.creatorFilter}`);
    const data = await res.json();
    state.creators = data.creators || [];

    updateCreatorCounts();

    const grid = document.getElementById('creatorsGrid');
    const emptyState = document.getElementById('emptyCreatorsState');

    if (state.creators.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      renderCreatorsGrid(state.creators);
    }
  } catch (err) {
    console.error('Erro ao carregar criadores:', err);
  }
}

async function updateCreatorCounts() {
  try {
    const res = await fetch('/api/creators?role=all');
    const data = await res.json();
    const all = data.creators || [];

    document.getElementById('creatorCount-all').textContent = all.length;
    document.getElementById('creatorCount-diretor').textContent = all.filter(c => c.role === 'diretor').length;
    document.getElementById('creatorCount-autor').textContent = all.filter(c => c.role === 'autor').length;
    document.getElementById('creatorCount-artista').textContent = all.filter(c => c.role === 'artista').length;
    document.getElementById('navCreatorsCountBadge').textContent = all.length;
  } catch (err) {
    console.error(err);
  }
}

function setCreatorFilter(role) {
  state.creatorFilter = role;

  document.querySelectorAll('.creator-filter-tab').forEach(btn => {
    if (btn.getAttribute('data-creator-filter') === role) {
      btn.className = 'creator-filter-tab active text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2';
    } else {
      btn.className = 'creator-filter-tab text-xs font-semibold px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-2';
    }
  });

  loadCreators();
}

function renderCreatorsGrid(creators) {
  const grid = document.getElementById('creatorsGrid');
  grid.innerHTML = '';

  creators.forEach(c => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md group transition-all';

    const roleInfo = CREATOR_ROLES[c.role] || { label: c.role, color: 'bg-slate-800 text-slate-300', icon: 'award' };
    const hasPhoto = c.photo_url && c.photo_url.trim() !== '';

    card.innerHTML = `
      <div class="flex items-start gap-3.5">
        <div class="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center shadow-inner">
          ${hasPhoto 
            ? `<img src="${c.photo_url}" alt="${c.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-lg font-bold text-amber-400\\'>${c.name.charAt(0)}</span>';" />`
            : `<span class="text-xl font-black text-amber-400">${c.name.charAt(0)}</span>`
          }
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap mb-1">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${roleInfo.color}">
              ${roleInfo.label}
            </span>
            ${c.country ? `<span class="text-[10px] text-slate-400 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">${c.country}</span>` : ''}
          </div>

          <h3 class="text-sm font-bold text-white truncate" title="${c.name}">${c.name}</h3>
        </div>
      </div>

      ${c.notes ? `
        <p class="text-xs text-slate-300/90 leading-relaxed bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/60 line-clamp-3">
          ${c.notes}
        </p>
      ` : '<p class="text-xs text-slate-500 italic">Sem anotações registradas.</p>'}

      <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button 
          onclick="filterCatalogByCreator('${c.name.replace(/'/g, "\\'")}')" 
          title="Ver obras deste criador no seu acervo"
          class="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-all"
        >
          <span>${c.works_in_library} ${c.works_in_library === 1 ? 'obra' : 'obras'} no acervo</span>
          <i data-lucide="external-link" class="w-3 h-3"></i>
        </button>

        <div class="flex items-center gap-1">
          <button 
            onclick="openCreatorModal(${c.id})" 
            title="Editar criador"
            class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          </button>
          <button 
            onclick="deleteCreatorDirect(${c.id}, '${c.name.replace(/'/g, "\\'")}')" 
            title="Remover criador"
            class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

async function loadCreatorSuggestions() {
  try {
    const res = await fetch('/api/creators/suggestions');
    const data = await res.json();
    const suggestions = data.suggestions || [];

    const row = document.getElementById('creatorSuggestionsRow');
    const list = document.getElementById('creatorSuggestionsList');

    if (suggestions.length === 0) {
      row.classList.add('hidden');
      return;
    }

    row.classList.remove('hidden');
    list.innerHTML = '';

    suggestions.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'text-xs bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 px-3 py-1 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5';
      const roleIcon = s.role === 'diretor' ? '🎬' : (s.role === 'autor' ? '✍️' : '🎸');
      btn.innerHTML = `<span>${roleIcon}</span> <span>${s.name}</span> <span class="text-[10px] text-slate-400 group-hover:text-white font-bold">(${s.works_count}) +</span>`;
      btn.onclick = () => {
        openCreatorModal();
        document.getElementById('creatorNameInput').value = s.name;
        document.getElementById('creatorRoleSelect').value = s.role;
        document.getElementById('creatorCountryInput').value = s.country || '';
        document.getElementById('creatorNotesInput').value = `Criador de destaque de obras favoritas do seu acervo.`;
      };
      list.appendChild(btn);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

// ----------------- MODAL: DISCOVER CREATORS VIA APIS -----------------

function openDiscoverCreatorModal() {
  const modal = document.getElementById('discoverCreatorModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    document.getElementById('discoverCreatorInput').focus();
  }, 100);
  if (window.lucide) lucide.createIcons();
}

function closeDiscoverCreatorModal() {
  const modal = document.getElementById('discoverCreatorModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function triggerDiscoverCreators() {
  const query = document.getElementById('discoverCreatorInput').value.trim();
  const role = document.getElementById('discoverRoleSelect').value;
  const listEl = document.getElementById('discoverResultsList');
  const btn = document.getElementById('discoverBtn');

  if (!query) {
    showToast('Digite um nome para buscar criadores', 'info');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>';
  listEl.innerHTML = '<div class="text-center py-8 text-slate-400"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Consultando bancos de criadores abertos...</div>';
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch(`/api/creators/search-external?query=${encodeURIComponent(query)}&role=${role}`);
    const data = await res.json();
    renderDiscoverResults(data.results || []);
  } catch (err) {
    listEl.innerHTML = '<div class="text-center py-8 text-rose-400">Erro ao consultar criadores externos.</div>';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Buscar</span><i data-lucide="arrow-right" class="w-3.5 h-3.5 stroke-[3]"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

function renderDiscoverResults(results) {
  const listEl = document.getElementById('discoverResultsList');
  listEl.innerHTML = '';

  if (results.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <p class="font-bold text-slate-300">Nenhum criador encontrado</p>
        <p class="text-xs text-slate-500 mt-1">Tente pesquisar o nome completo ou alterar a área.</p>
      </div>
    `;
    return;
  }

  results.forEach(c => {
    const item = document.createElement('div');
    item.className = 'bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3';

    const roleInfo = CREATOR_ROLES[c.role] || { label: c.role, color: 'bg-slate-800 text-slate-300' };
    const hasPhoto = c.photo_url && c.photo_url.trim() !== '';

    item.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center">
          ${hasPhoto 
            ? `<img src="${c.photo_url}" alt="${c.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'font-bold text-amber-400\\'>${c.name.charAt(0)}</span>';" />`
            : `<span class="font-bold text-amber-400">${c.name.charAt(0)}</span>`
          }
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${roleInfo.color}">${roleInfo.label}</span>
            <span class="text-[10px] text-slate-400">${c.country || ''}</span>
          </div>
          <h4 class="text-xs font-bold text-white truncate">${c.name}</h4>
          <p class="text-[11px] text-slate-400 truncate">${c.notes || ''}</p>
        </div>
      </div>

      <div class="shrink-0">
        ${c.already_saved ? `
          <span class="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
            <i data-lucide="check" class="w-3.5 h-3.5"></i> Já Salvo
          </span>
        ` : `
          <button 
            onclick="addDiscoveredCreator(${escapeJsonForHtml(c)})" 
            class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1 whitespace-nowrap active:scale-95"
          >
            <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[3]"></i>
            <span>Favoritar</span>
          </button>
        `}
      </div>
    `;
    listEl.appendChild(item);
  });

  if (window.lucide) lucide.createIcons();
}

async function addDiscoveredCreator(creatorData) {
  try {
    const res = await fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creatorData)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`"${creatorData.name}" adicionado aos criadores favoritos!`, 'success');
      loadCreators();
      loadCreatorSuggestions();
      loadDashboardStats();
      triggerDiscoverCreators();
    } else {
      showToast(data.detail || 'Erro ao adicionar criador', 'error');
    }
  } catch (err) {
    showToast('Erro ao salvar criador', 'error');
  }
}

function openCreatorModal(creatorId = null) {
  state.editingCreatorId = creatorId;

  const modal = document.getElementById('creatorModal');
  const modalTitle = document.getElementById('creatorModalTitle');
  const deleteBtn = document.getElementById('creatorDeleteBtn');
  const idInput = document.getElementById('creatorIdInput');
  const nameInput = document.getElementById('creatorNameInput');
  const roleSelect = document.getElementById('creatorRoleSelect');
  const countryInput = document.getElementById('creatorCountryInput');
  const photoInput = document.getElementById('creatorPhotoInput');
  const notesInput = document.getElementById('creatorNotesInput');

  if (creatorId) {
    const creator = state.creators.find(c => c.id === creatorId);
    if (!creator) return;

    modalTitle.textContent = 'Editar Criador Favorito';
    idInput.value = creator.id;
    nameInput.value = creator.name;
    roleSelect.value = creator.role;
    countryInput.value = creator.country || '';
    photoInput.value = creator.photo_url || '';
    notesInput.value = creator.notes || '';
    deleteBtn.classList.remove('hidden');
    deleteBtn.classList.add('flex');
  } else {
    modalTitle.textContent = 'Registrar Criador Favorito';
    idInput.value = '';
    nameInput.value = '';
    roleSelect.value = 'diretor';
    countryInput.value = '';
    photoInput.value = '';
    notesInput.value = '';
    deleteBtn.classList.add('hidden');
    deleteBtn.classList.remove('flex');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  nameInput.focus();
  if (window.lucide) lucide.createIcons();
}

function closeCreatorModal() {
  const modal = document.getElementById('creatorModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  state.editingCreatorId = null;
}

async function saveCreatorForm() {
  const name = document.getElementById('creatorNameInput').value.trim();
  const role = document.getElementById('creatorRoleSelect').value;
  const country = document.getElementById('creatorCountryInput').value.trim();
  const photo_url = document.getElementById('creatorPhotoInput').value.trim();
  const notes = document.getElementById('creatorNotesInput').value.trim();

  if (!name) {
    showToast('Informe o nome do criador', 'error');
    return;
  }

  const payload = { name, role, country, photo_url, notes, rating: 5.0 };

  try {
    let res;
    if (state.editingCreatorId) {
      res = await fetch(`/api/creators/${state.editingCreatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (data.success) {
      showToast(state.editingCreatorId ? 'Criador atualizado com sucesso!' : `"${name}" adicionado aos criadores favoritos!`, 'success');
      closeCreatorModal();
      loadCreators();
      loadCreatorSuggestions();
      loadDashboardStats();
    } else {
      showToast(data.detail || 'Erro ao salvar criador', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar criador', 'error');
  }
}

async function deleteCurrentCreator() {
  if (!state.editingCreatorId) return;
  const creator = state.creators.find(c => c.id === state.editingCreatorId);
  const name = creator ? creator.name : 'este criador';

  if (!confirm(`Deseja realmente remover "${name}" dos seus criadores favoritos?`)) return;

  try {
    const res = await fetch(`/api/creators/${state.editingCreatorId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`"${name}" removido com sucesso.`, 'info');
      closeCreatorModal();
      loadCreators();
      loadCreatorSuggestions();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Erro ao remover criador', 'error');
  }
}

async function deleteCreatorDirect(creatorId, name) {
  if (!confirm(`Deseja realmente remover "${name}" dos seus criadores favoritos?`)) return;

  try {
    const res = await fetch(`/api/creators/${creatorId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`"${name}" removido com sucesso.`, 'info');
      loadCreators();
      loadCreatorSuggestions();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Erro ao remover criador', 'error');
  }
}

function filterCatalogByCreator(creatorName) {
  switchView('acervo');
  const input = document.getElementById('catalogSearchInput');
  input.value = creatorName;
  handleCatalogSearch(creatorName);
  showToast(`Filtrando acervo por: "${creatorName}"`, 'info');
}

// ----------------- CATALOG DATA LOADING -----------------

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    state.settings = data;
    
    const alertDot = document.getElementById('settingsAlertDot');
    if (!data.has_tmdb_key) {
      alertDot.classList.remove('hidden');
    } else {
      alertDot.classList.add('hidden');
    }

    const tmdbInput = document.getElementById('tmdbKeyInput');
    if (tmdbInput && data.tmdb_api_key) {
      tmdbInput.value = data.tmdb_api_key;
    }
    const gbInput = document.getElementById('googleBooksKeyInput');
    if (gbInput && data.google_books_api_key) {
      gbInput.value = data.google_books_api_key;
    }
    const tmdbBadge = document.getElementById('tmdbStatusBadge');
    if (tmdbBadge) {
      if (data.has_tmdb_key) {
        tmdbBadge.textContent = 'Configurada';
        tmdbBadge.className = 'text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      } else {
        tmdbBadge.textContent = 'Não configurada';
        tmdbBadge.className = 'text-[11px] px-2 py-0.5 rounded-full font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30';
      }
    }
  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
  }
}

async function loadFilters() {
  try {
    const res = await fetch('/api/filters');
    const data = await res.json();
    state.filtersData = data;

    document.getElementById('count-all').textContent = data.total || 0;
    document.getElementById('count-filme').textContent = data.media_counts.filme || 0;
    document.getElementById('count-serie').textContent = data.media_counts.serie || 0;
    document.getElementById('count-livro').textContent = data.media_counts.livro || 0;
    document.getElementById('count-disco').textContent = data.media_counts.disco || 0;

    // Atualiza contadores dos pills de status (favorito também conta em concluído/consumido)
    const statusCounts = data.status_counts || {};
    const countStatusAll = document.getElementById('count-status-all');
    if (countStatusAll) countStatusAll.textContent = data.total || 0;

    const countStatusConcluido = document.getElementById('count-status-concluido');
    if (countStatusConcluido) {
      const totalConsumido = statusCounts.concluido_com_favoritos ?? ((statusCounts.concluido || 0) + (statusCounts.favorito || 0));
      countStatusConcluido.textContent = totalConsumido;
    }

    const countStatusAndamento = document.getElementById('count-status-em_andamento');
    if (countStatusAndamento) countStatusAndamento.textContent = statusCounts.em_andamento || 0;

    const countStatusFavorito = document.getElementById('count-status-favorito');
    if (countStatusFavorito) countStatusFavorito.textContent = statusCounts.favorito || 0;

    const countStatusQuero = document.getElementById('count-status-quero');
    if (countStatusQuero) countStatusQuero.textContent = statusCounts.quero || 0;

    const genreSelect = document.getElementById('genreSelect');
    const prevGenre = genreSelect.value;
    genreSelect.innerHTML = '<option value="all">Todos os Gêneros</option>';
    data.genres.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      genreSelect.appendChild(opt);
    });
    if (data.genres.includes(prevGenre)) {
      genreSelect.value = prevGenre;
    }

    const yearSelect = document.getElementById('yearSelect');
    const prevYear = yearSelect.value;
    yearSelect.innerHTML = '<option value="all">Todos os Anos</option>';
    data.years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    });
    if (data.years.includes(parseInt(prevYear))) {
      yearSelect.value = prevYear;
    }

    const countrySelect = document.getElementById('countrySelect');
    const prevCountry = countrySelect.value;
    countrySelect.innerHTML = '<option value="all">Todos os Países</option>';
    data.countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      countrySelect.appendChild(opt);
    });
    if (data.countries.includes(prevCountry)) {
      countrySelect.value = prevCountry;
    }

    updateActiveFilterChips();
  } catch (err) {
    console.error('Erro ao carregar filtros:', err);
  }
}

async function loadItems() {
  const grid = document.getElementById('itemsGrid');
  const emptyState = document.getElementById('emptyState');
  const countEl = document.getElementById('displayedCount');

  const params = new URLSearchParams({
    media_type: state.mediaType,
    status: state.status,
    genre: state.genre,
    country: state.country,
    sort_by: state.sortBy
  });

  if (state.year !== 'all') {
    params.set('year', state.year);
  }
  if (state.search.trim()) {
    params.set('search', state.search.trim());
  }

  try {
    const res = await fetch(`/api/items?${params.toString()}`);
    const data = await res.json();
    state.items = data.items || [];

    countEl.textContent = state.items.length;

    if (state.items.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      updateEmptyStateText();
    } else {
      emptyState.classList.add('hidden');
      renderItemsGrid(state.items);
    }
  } catch (err) {
    console.error('Erro ao carregar itens:', err);
    showToast('Erro ao carregar itens do acervo', 'error');
  }
}

function updateEmptyStateText() {
  const title = document.getElementById('emptyTitle');
  const desc = document.getElementById('emptyDescription');
  const seedBtn = document.getElementById('seedDemoBtn');

  if (state.search.trim() || state.genre !== 'all' || state.year !== 'all' || state.country !== 'all' || state.status !== 'all' || state.mediaType !== 'all') {
    title.textContent = 'Nenhum resultado com esses filtros';
    desc.textContent = 'Tente redefinir os filtros ou buscar por outro título, diretor, autor ou músico.';
    if (seedBtn) seedBtn.classList.add('hidden');
  } else {
    title.textContent = 'Seu acervo ainda está vazio';
    desc.textContent = 'Comece buscando seus filmes, séries, livros e discos favoritos ou carregue alguns itens demonstrativos.';
    if (seedBtn) seedBtn.classList.remove('hidden');
  }
}

// ----------------- RENDERING CATALOG ITEMS -----------------

function renderItemsGrid(items) {
  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cultural-card bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl overflow-hidden flex flex-col group';

    const mediaInfo = MEDIA_LABELS[item.media_type] || { name: 'Obra', color: 'bg-slate-700 text-slate-300' };
    const statusLabel = getStatusLabel(item.status, item.media_type);
    const statusBadgeClass = getStatusBadgeClass(item.status);

    const isSquare = item.media_type === 'disco';
    const hasCover = item.cover_url && item.cover_url.trim() !== '';

    card.innerHTML = `
      <div class="poster-container ${isSquare ? 'square' : ''} cursor-pointer relative" onclick="openDetailModal(${item.id})">
        ${hasCover 
          ? `<img src="${item.cover_url}" alt="${item.title}" class="poster-img" loading="lazy" onerror="this.onerror=null; this.src='/static/img/placeholder.svg'; this.classList.add('p-8');" />` 
          : `<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500">
               <i data-lucide="${getMediaIconName(item.media_type)}" class="w-10 h-10 mb-2 opacity-40"></i>
               <span class="text-[11px] font-medium leading-tight text-slate-400 line-clamp-2">${item.title}</span>
             </div>`
        }

        <div class="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md uppercase tracking-wider ${mediaInfo.color}">
            ${mediaInfo.name}
          </span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-lg border backdrop-blur-md ${statusBadgeClass}">
            ${statusLabel}
          </span>
        </div>

        ${item.rating > 0 ? `
          <div class="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-amber-400 flex items-center gap-1 border border-amber-500/20">
            <span>⭐</span>
            <span>${item.rating}</span>
          </div>
        ` : ''}
      </div>

      <div class="p-3 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <h4 class="text-xs font-bold text-slate-100 leading-snug line-clamp-1 hover:text-indigo-400 cursor-pointer transition-colors" title="${item.title}" onclick="openDetailModal(${item.id})">
            ${item.title}
          </h4>
          <p class="text-[11px] text-slate-400 truncate mt-0.5 cursor-pointer hover:underline" title="Filtrar por ${item.creator || ''}" onclick="filterCatalogByCreator('${(item.creator || '').replace(/'/g, "\\'")}')">
            ${item.creator || 'Não informado'}
          </p>

          <div class="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
            ${item.release_year ? `<span class="bg-slate-800/80 px-1.5 py-0.5 rounded">${item.release_year}</span>` : ''}
            ${item.country && item.country !== 'Não informado' ? `<span class="bg-slate-800/80 px-1.5 py-0.5 rounded truncate max-w-[90px]">${item.country}</span>` : ''}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
          <select 
            onchange="handleQuickStatusChange(${item.id}, this.value, '${item.media_type}')" 
            class="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1 truncate"
            title="Alterar Status Rapidamente"
          >
            <option value="concluido" ${item.status === 'concluido' ? 'selected' : ''}>${getStatusLabel('concluido', item.media_type)}</option>
            <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>${getStatusLabel('em_andamento', item.media_type)}</option>
            <option value="favorito" ${item.status === 'favorito' ? 'selected' : ''}>Favorito ⭐</option>
            <option value="quero" ${item.status === 'quero' ? 'selected' : ''}>${getStatusLabel('quero', item.media_type)}</option>
          </select>

          <button 
            onclick="openDetailModal(${item.id})" 
            title="Ver detalhes e anotações" 
            class="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
          </button>

          <button 
            onclick="quickDeleteItem(${item.id}, '${item.title.replace(/'/g, "\\'")}')" 
            title="Remover do acervo" 
            class="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function getMediaIconName(type) {
  switch (type) {
    case 'filme': return 'film';
    case 'serie': return 'tv';
    case 'livro': return 'book-open';
    case 'disco': return 'disc';
    default: return 'sparkles';
  }
}

// ----------------- FILTERS & SEGMENTATION HANDLERS -----------------

function setMediaType(type) {
  state.mediaType = type;

  document.querySelectorAll('.media-tab').forEach(tab => {
    if (tab.getAttribute('data-media') === type) {
      tab.className = 'media-tab active px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all';
    } else {
      tab.className = 'media-tab px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
    }
  });

  document.getElementById('label-status-concluido').textContent = getStatusLabel('concluido', type);
  document.getElementById('label-status-andamento').textContent = getStatusLabel('em_andamento', type);
  document.getElementById('label-status-quero').textContent = getStatusLabel('quero', type);

  updateActiveFilterChips();
  loadItems();
}

function setStatusFilter(status) {
  state.status = status;

  document.querySelectorAll('.status-pill').forEach(btn => {
    if (btn.getAttribute('data-status') === status) {
      btn.className = 'status-pill active text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/50 bg-indigo-600/30 text-white shadow-sm transition-all';
    } else {
      btn.className = 'status-pill text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-all';
    }
  });

  updateActiveFilterChips();
  loadItems();
}

function handleGenreChange(val) {
  state.genre = val;
  updateActiveFilterChips();
  loadItems();
}

function handleYearChange(val) {
  state.year = val;
  updateActiveFilterChips();
  loadItems();
}

function handleCountryChange(val) {
  state.country = val;
  updateActiveFilterChips();
  loadItems();
}

function handleSortChange(val) {
  state.sortBy = val;
  loadItems();
}

let searchDebounceTimeout = null;
function handleCatalogSearch(term) {
  state.search = term;
  const clearBtn = document.getElementById('clearCatalogSearchBtn');
  if (term.trim()) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    updateActiveFilterChips();
    loadItems();
  }, 250);
}

function clearCatalogSearch() {
  const input = document.getElementById('catalogSearchInput');
  input.value = '';
  handleCatalogSearch('');
}

function resetAllFilters() {
  state.mediaType = 'all';
  state.status = 'all';
  state.genre = 'all';
  state.year = 'all';
  state.country = 'all';
  state.search = '';
  state.sortBy = 'created_desc';

  document.getElementById('catalogSearchInput').value = '';
  document.getElementById('clearCatalogSearchBtn').classList.add('hidden');
  document.getElementById('genreSelect').value = 'all';
  document.getElementById('yearSelect').value = 'all';
  document.getElementById('countrySelect').value = 'all';
  document.getElementById('sortSelect').value = 'created_desc';

  setMediaType('all');
  setStatusFilter('all');
}

function updateActiveFilterChips() {
  const row = document.getElementById('activeFilterRow');
  const container = document.getElementById('activeFilterChips');
  container.innerHTML = '';

  const activeFilters = [];

  if (state.mediaType !== 'all') {
    const mName = MEDIA_LABELS[state.mediaType]?.name || state.mediaType;
    activeFilters.push({ label: `Mídia: ${mName}`, clear: () => setMediaType('all') });
  }
  if (state.status !== 'all') {
    activeFilters.push({ label: `Status: ${getStatusLabel(state.status, state.mediaType)}`, clear: () => setStatusFilter('all') });
  }
  if (state.genre !== 'all') {
    activeFilters.push({ label: `Gênero: ${state.genre}`, clear: () => { document.getElementById('genreSelect').value = 'all'; handleGenreChange('all'); } });
  }
  if (state.year !== 'all') {
    activeFilters.push({ label: `Ano: ${state.year}`, clear: () => { document.getElementById('yearSelect').value = 'all'; handleYearChange('all'); } });
  }
  if (state.country !== 'all') {
    activeFilters.push({ label: `País: ${state.country}`, clear: () => { document.getElementById('countrySelect').value = 'all'; handleCountryChange('all'); } });
  }
  if (state.search.trim()) {
    activeFilters.push({ label: `Busca: "${state.search.trim()}"`, clear: clearCatalogSearch });
  }

  if (activeFilters.length > 0) {
    row.classList.remove('hidden');
    activeFilters.forEach(f => {
      const chip = document.createElement('span');
      chip.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[11px] font-medium';
      chip.innerHTML = `
        <span>${f.label}</span>
        <button class="hover:text-white transition-colors cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
      `;
      chip.querySelector('button').onclick = f.clear;
      container.appendChild(chip);
    });
    if (window.lucide) lucide.createIcons();
  } else {
    row.classList.add('hidden');
  }
}

// ----------------- ITEM ACTIONS (STATUS & REMOVE) -----------------

async function handleQuickStatusChange(itemId, newStatus, mediaType) {
  try {
    const res = await fetch(`/api/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Status atualizado para "${getStatusLabel(newStatus, mediaType)}"`, 'success');
      loadFilters();
      loadItems();
      loadDashboardStats();
      loadCreatorSuggestions();
    } else {
      showToast(data.detail || 'Erro ao atualizar status', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao atualizar status', 'error');
  }
}

async function quickDeleteItem(itemId, title) {
  if (!confirm(`Deseja realmente remover "${title}" do seu acervo?`)) return;

  try {
    const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`"${title}" removido com sucesso.`, 'info');
      loadFilters();
      loadItems();
      loadDashboardStats();
      loadCreators();
    } else {
      showToast(data.detail || 'Erro ao remover', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao remover item', 'error');
  }
}

// ----------------- DETAIL MODAL -----------------

function openDetailModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;

  state.activeDetailItem = item;

  const modal = document.getElementById('detailModal');
  const coverImg = document.getElementById('detailCover');
  const titleEl = document.getElementById('detailTitle');
  const creatorEl = document.getElementById('detailCreator');
  const yearEl = document.getElementById('detailYear');
  const countryEl = document.getElementById('detailCountry');
  const genresEl = document.getElementById('detailGenres');
  const overviewEl = document.getElementById('detailOverview');
  const statusSelect = document.getElementById('detailStatusSelect');
  const ratingSelect = document.getElementById('detailRatingSelect');
  const notesText = document.getElementById('detailUserNotes');
  const mediaBadge = document.getElementById('detailMediaBadge');

  titleEl.textContent = item.title;
  creatorEl.textContent = item.creator || 'Não informado';
  yearEl.textContent = item.release_year || 'Ano não informado';
  countryEl.textContent = item.country || 'País não informado';
  overviewEl.textContent = item.overview || 'Nenhuma descrição fornecida pela API.';

  if (item.cover_url) {
    coverImg.src = item.cover_url;
    coverImg.classList.remove('hidden');
  } else {
    coverImg.src = '/static/img/placeholder.svg';
  }

  const mInfo = MEDIA_LABELS[item.media_type] || { name: 'Obra', color: 'bg-slate-700 text-slate-300' };
  mediaBadge.textContent = mInfo.name;
  mediaBadge.className = `text-xs px-2.5 py-0.5 rounded-md font-semibold border ${mInfo.color}`;

  genresEl.innerHTML = '';
  if (item.genres_list && item.genres_list.length > 0) {
    item.genres_list.forEach(g => {
      const tag = document.createElement('span');
      tag.className = 'text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700';
      tag.textContent = g;
      genresEl.appendChild(tag);
    });
  }

  statusSelect.innerHTML = `
    <option value="concluido" ${item.status === 'concluido' ? 'selected' : ''}>${getStatusLabel('concluido', item.media_type)}</option>
    <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>${getStatusLabel('em_andamento', item.media_type)}</option>
    <option value="favorito" ${item.status === 'favorito' ? 'selected' : ''}>Favorito ⭐</option>
    <option value="quero" ${item.status === 'quero' ? 'selected' : ''}>${getStatusLabel('quero', item.media_type)}</option>
  `;

  ratingSelect.value = item.rating ? Math.round(item.rating).toString() : '0';
  notesText.value = item.user_notes || '';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  state.activeDetailItem = null;
}

async function saveDetailChanges() {
  if (!state.activeDetailItem) return;

  const status = document.getElementById('detailStatusSelect').value;
  const rating = parseFloat(document.getElementById('detailRatingSelect').value) || 0;
  const user_notes = document.getElementById('detailUserNotes').value;

  try {
    const res = await fetch(`/api/items/${state.activeDetailItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rating, user_notes })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Alterações salvas com sucesso!', 'success');
      closeDetailModal();
      loadFilters();
      loadItems();
      loadDashboardStats();
    } else {
      showToast(data.detail || 'Erro ao salvar alterações', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar alterações', 'error');
  }
}

async function confirmDeleteItem() {
  if (!state.activeDetailItem) return;
  const item = state.activeDetailItem;
  if (!confirm(`Tem certeza que deseja excluir "${item.title}" do seu acervo?`)) return;

  try {
    const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`"${item.title}" removido com sucesso.`, 'info');
      closeDetailModal();
      loadFilters();
      loadItems();
      loadDashboardStats();
      loadCreators();
    } else {
      showToast(data.detail || 'Erro ao remover item', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao remover item', 'error');
  }
}

// ----------------- UNIVERSAL SEARCH MODAL -----------------

function openSearchModal() {
  const modal = document.getElementById('searchModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  checkTmdbBannerVisibility();

  setTimeout(() => {
    document.getElementById('externalSearchInput').focus();
  }, 100);

  if (window.lucide) lucide.createIcons();
}

function closeSearchModal() {
  const modal = document.getElementById('searchModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function setSearchMediaType(type) {
  state.searchMediaType = type;

  document.querySelectorAll('.search-media-pill').forEach(btn => {
    if (btn.getAttribute('data-search-media') === type) {
      btn.className = 'search-media-pill active text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/50 bg-indigo-600/30 text-white shadow-sm transition-all';
    } else {
      btn.className = 'search-media-pill text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white transition-all';
    }
  });

  checkTmdbBannerVisibility();

  const query = document.getElementById('externalSearchInput').value.trim();
  if (query.length >= 2) {
    triggerExternalSearch();
  }
}

function checkTmdbBannerVisibility() {
  const banner = document.getElementById('tmdbAlertBanner');
  const needsTmdb = state.searchMediaType === 'all' || state.searchMediaType === 'filme' || state.searchMediaType === 'serie';
  if (needsTmdb && !state.settings.has_tmdb_key) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

async function triggerExternalSearch() {
  const query = document.getElementById('externalSearchInput').value.trim();
  const listEl = document.getElementById('searchResultsList');
  const searchBtn = document.getElementById('searchExternalBtn');

  if (!query) {
    showToast('Digite um nome de obra, autor, diretor ou músico para pesquisar', 'info');
    return;
  }

  searchBtn.disabled = true;
  searchBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Buscando...</span>';
  if (window.lucide) lucide.createIcons();

  listEl.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 text-slate-400">
      <i data-lucide="loader" class="w-8 h-8 text-indigo-400 animate-spin mb-3"></i>
      <p class="text-sm font-medium text-slate-200">Consultando APIs abertas por títulos e criadores...</p>
      <p class="text-xs text-slate-500 mt-1">Pesquisando obras de "${query}"</p>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  try {
    const params = new URLSearchParams({
      query: query,
      media_type: state.searchMediaType
    });

    const res = await fetch(`/api/search/external?${params.toString()}`);
    const data = await res.json();

    renderSearchResults(data.results || [], data.messages || []);
  } catch (err) {
    console.error('Erro na busca externa:', err);
    listEl.innerHTML = `
      <div class="text-center py-10 text-rose-400">
        <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-2"></i>
        <p class="text-sm font-bold">Erro ao consultar os serviços externos.</p>
        <p class="text-xs text-slate-400 mt-1">Verifique sua conexão de rede e tente novamente.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  } finally {
    searchBtn.disabled = false;
    searchBtn.innerHTML = '<span>Buscar</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

function renderSearchResults(results, messages) {
  const listEl = document.getElementById('searchResultsList');
  listEl.innerHTML = '';

  if (messages && messages.length > 0) {
    messages.forEach(msg => {
      const banner = document.createElement('div');
      banner.className = 'bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-between gap-3 mb-2';
      banner.innerHTML = `
        <div class="flex items-center gap-2">
          <i data-lucide="info" class="w-4 h-4 text-amber-400 shrink-0"></i>
          <span>${msg.message}</span>
        </div>
        <button onclick="closeSearchModal(); openSettingsModal();" class="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2.5 py-1 rounded-lg border border-amber-500/40 shrink-0 font-medium">
          Configurar TMDB
        </button>
      `;
      listEl.appendChild(banner);
    });
  }

  if (results.length === 0) {
    listEl.innerHTML += `
      <div class="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <i data-lucide="frown" class="w-10 h-10 text-slate-600 mb-2"></i>
        <p class="text-sm font-semibold text-slate-200">Nenhum resultado encontrado</p>
        <p class="text-xs text-slate-500 mt-1">Tente pesquisar por outro termo, ou pelo nome do autor/diretor/artista.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  results.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-600 transition-all';

    const mediaInfo = MEDIA_LABELS[item.media_type] || { name: 'Obra', color: 'bg-slate-700 text-slate-300' };
    const hasCover = item.cover_url && item.cover_url.trim() !== '';

    card.innerHTML = `
      <div class="flex items-start gap-3.5 flex-1 min-w-0">
        <div class="w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center">
          ${hasCover 
            ? `<img src="${item.cover_url}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/static/img/placeholder.svg';" />` 
            : `<i data-lucide="${getMediaIconName(item.media_type)}" class="w-6 h-6 text-slate-600"></i>`
          }
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${mediaInfo.color}">
              ${mediaInfo.name}
            </span>
            ${item.release_year ? `<span class="text-[10px] text-slate-400 font-semibold bg-slate-900/80 px-1.5 py-0.5 rounded">${item.release_year}</span>` : ''}
            ${item.country && item.country !== 'Não informado' ? `<span class="text-[10px] text-slate-400 font-semibold bg-slate-900/80 px-1.5 py-0.5 rounded">${item.country}</span>` : ''}
          </div>

          <h4 class="text-sm font-bold text-white leading-snug truncate" title="${item.title}">${item.title}</h4>
          <p class="text-xs text-indigo-400 font-medium truncate mt-0.5">${item.creator || 'Não informado'}</p>

          ${item.genres && item.genres.length > 0 ? `
            <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
              ${item.genres.slice(0, 3).map(g => `<span class="text-[10px] text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded">${g}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="w-full sm:w-auto flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
        ${item.in_library ? `
          <div class="flex items-center gap-2">
            <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              No Acervo (${getStatusLabel(item.current_status, item.media_type)})
            </span>
          </div>
        ` : `
          <select id="statusSelect_${item.media_type}_${item.external_id}" class="custom-select bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="quero">${getStatusLabel('quero', item.media_type)}</option>
            <option value="concluido">${getStatusLabel('concluido', item.media_type)}</option>
            <option value="em_andamento">${getStatusLabel('em_andamento', item.media_type)}</option>
            <option value="favorito">Favorito ⭐</option>
          </select>

          <button 
            onclick="addSearchedItemToLibrary(${escapeJsonForHtml(item)})" 
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
          >
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Adicionar</span>
          </button>
        `}
      </div>
    `;

    listEl.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function escapeJsonForHtml(obj) {
  return JSON.stringify(obj).replace(/"/g, '&quot;');
}

async function addSearchedItemToLibrary(item) {
  const selectId = `statusSelect_${item.media_type}_${item.external_id}`;
  const statusEl = document.getElementById(selectId);
  const chosenStatus = statusEl ? statusEl.value : 'quero';

  const payload = {
    media_type: item.media_type,
    external_id: item.external_id,
    title: item.title,
    creator: item.creator,
    release_year: item.release_year,
    genres: item.genres || [],
    country: item.country,
    status: chosenStatus,
    cover_url: item.cover_url,
    overview: item.overview || '',
    rating: item.rating || 0,
    user_notes: ''
  };

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`"${item.title}" registrado como "${getStatusLabel(chosenStatus, item.media_type)}"`, 'success');
      loadFilters();
      loadItems();
      loadDashboardStats();
      loadCreators();
      loadCreatorSuggestions();
      triggerExternalSearch();
    } else {
      showToast(data.detail || 'Erro ao registrar item', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar item', 'error');
  }
}

// ----------------- SETTINGS & API MODAL -----------------

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const input = document.getElementById('tmdbKeyInput');
  if (state.settings && state.settings.tmdb_api_key) {
    input.value = state.settings.tmdb_api_key;
  }
  const gbInput = document.getElementById('googleBooksKeyInput');
  if (gbInput && state.settings.google_books_api_key) {
    gbInput.value = state.settings.google_books_api_key;
  }
  document.getElementById('tmdbFeedback').classList.add('hidden');

  if (window.lucide) lucide.createIcons();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

async function testTmdbKey() {
  const key = document.getElementById('tmdbKeyInput').value.trim();
  const feedback = document.getElementById('tmdbFeedback');
  const testBtn = document.getElementById('testTmdbBtn');

  if (!key) {
    feedback.textContent = 'Insira uma chave antes de testar.';
    feedback.className = 'text-xs text-rose-400 font-medium block';
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testando...';

  try {
    const res = await fetch('/api/settings/test-tmdb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_api_key: key })
    });
    const data = await res.json();

    if (data.valid) {
      feedback.textContent = '✓ ' + data.message;
      feedback.className = 'text-xs text-emerald-400 font-semibold block';
    } else {
      feedback.textContent = '✕ ' + data.message;
      feedback.className = 'text-xs text-rose-400 font-medium block';
    }
  } catch (err) {
    feedback.textContent = 'Erro de conexão ao testar chave.';
    feedback.className = 'text-xs text-rose-400 font-medium block';
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Testar';
  }
}

async function saveSettings() {
  const tmdbKey = document.getElementById('tmdbKeyInput').value.trim();
  const gbInput = document.getElementById('googleBooksKeyInput');
  const gbKey = gbInput ? gbInput.value.trim() : '';

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tmdb_api_key: tmdbKey,
        google_books_api_key: gbKey
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Configurações salvas com sucesso!', 'success');
      await loadSettings();
      closeSettingsModal();
    } else {
      showToast('Erro ao salvar configurações', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar configurações', 'error');
  }
}

async function seedDemoItems() {
  try {
    const res = await fetch('/api/seed', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadFilters();
      loadItems();
      loadDashboardStats();
      loadCreators();
      loadCreatorSuggestions();
      closeSettingsModal();
    }
  } catch (err) {
    showToast('Erro ao carregar itens demo', 'error');
  }
}

async function confirmClearCatalog() {
  if (!confirm('Atenção: deseja realmente limpar todos os itens e criadores salvos? Essa ação não pode ser desfeita.')) return;

  try {
    const res = await fetch('/api/clear', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Acervo limpo com sucesso.', 'info');
      loadFilters();
      loadItems();
      loadDashboardStats();
      loadCreators();
      loadCreatorSuggestions();
      closeSettingsModal();
    }
  } catch (err) {
    showToast('Erro ao limpar acervo', 'error');
  }
}

// ----------------- STATS MODAL -----------------

async function openStatsModal() {
  const modal = document.getElementById('statsModal');
  const content = document.getElementById('statsContent');

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  content.innerHTML = '<div class="text-center py-8 text-slate-400"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Calculando estatísticas...</div>';
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch('/api/filters');
    const data = await res.json();

    const mediaCounts = data.media_counts || {};
    const statusCounts = data.status_counts || {};
    const total = data.total || 0;

    content.innerHTML = `
      <div class="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span class="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Total no Acervo</span>
          <h3 class="text-3xl font-black text-white mt-1">${total}</h3>
          <p class="text-xs text-slate-400 mt-1">Obras culturais catalogadas</p>
        </div>
        <div class="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
          <i data-lucide="library" class="w-8 h-8"></i>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <i data-lucide="layers" class="w-4 h-4 text-indigo-400"></i>
          Distribuição por Mídia
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col">
            <span class="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
              <i data-lucide="film" class="w-3.5 h-3.5"></i> Filmes
            </span>
            <span class="text-xl font-bold text-white mt-1.5">${mediaCounts.filme || 0}</span>
          </div>

          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col">
            <span class="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <i data-lucide="tv" class="w-3.5 h-3.5"></i> Séries
            </span>
            <span class="text-xl font-bold text-white mt-1.5">${mediaCounts.serie || 0}</span>
          </div>

          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col">
            <span class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <i data-lucide="book-open" class="w-3.5 h-3.5"></i> Livros
            </span>
            <span class="text-xl font-bold text-white mt-1.5">${mediaCounts.livro || 0}</span>
          </div>

          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col">
            <span class="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
              <i data-lucide="disc" class="w-3.5 h-3.5"></i> Discos
            </span>
            <span class="text-xl font-bold text-white mt-1.5">${mediaCounts.disco || 0}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-indigo-400"></i>
          Distribuição por Status
        </h4>
        <div class="grid grid-cols-2 gap-2.5">
          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <div>
                <span class="text-xs text-slate-300 block">Já consumido</span>
                <span class="text-[10px] text-slate-400">(inclui favoritos)</span>
              </div>
            </div>
            <span class="text-sm font-bold text-white">${statusCounts.concluido_com_favoritos ?? ((statusCounts.concluido || 0) + (statusCounts.favorito || 0))}</span>
          </div>

          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span class="text-xs text-slate-300">Estou lendo/vendo/ouvindo</span>
            </div>
            <span class="text-sm font-bold text-white">${statusCounts.em_andamento || 0}</span>
          </div>

          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span class="text-xs text-slate-300">Favoritos ⭐</span>
            </div>
            <span class="text-sm font-bold text-white">${statusCounts.favorito || 0}</span>
          </div>

          <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span class="text-xs text-slate-300">Quero ler/ver/ouvir</span>
            </div>
            <span class="text-sm font-bold text-white">${statusCounts.quero || 0}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
          <span class="text-slate-400 font-medium">Países Catalogados:</span>
          <p class="text-base font-bold text-white mt-1">${data.countries.length} países</p>
        </div>
        <div class="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
          <span class="text-slate-400 font-medium">Gêneros Presentes:</span>
          <p class="text-base font-bold text-white mt-1">${data.genres.length} gêneros</p>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    content.innerHTML = '<div class="text-center py-6 text-rose-400">Erro ao carregar estatísticas.</div>';
  }
}

function closeStatsModal() {
  const modal = document.getElementById('statsModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ========================================================
// ESTATÍSTICAS DETALHADAS (GÊNERO, DÉCADA, ANO, PAÍS, MÍDIA)
// ========================================================

function setStatsMediaType(type) {
  state.statsMediaType = type;

  document.querySelectorAll('.stats-media-tab').forEach(tab => {
    if (tab.getAttribute('data-stats-media') === type) {
      tab.className = 'stats-media-tab active text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0';
    } else {
      tab.className = 'stats-media-tab text-xs font-semibold px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-2 shrink-0';
    }
  });

  loadDetailedStats();
}

function setStatsDimension(dim) {
  state.statsDimension = dim;

  document.querySelectorAll('.stats-dim-tab').forEach(tab => {
    if (tab.getAttribute('data-stats-dim') === dim) {
      tab.className = 'stats-dim-tab active px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all';
    } else {
      tab.className = 'stats-dim-tab px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
    }
  });

  if (state.detailedStatsData) {
    renderDimensionBars(state.detailedStatsData, dim);
  } else {
    loadDetailedStats();
  }
}

async function loadDetailedStats() {
  const container = document.getElementById('statsBarsContainer');
  if (container) {
    container.innerHTML = '<div class="text-center py-12 text-slate-400"><i data-lucide="loader" class="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-400"></i><p class="text-xs">Calculando estatísticas por mídia e dimensões...</p></div>';
    if (window.lucide) lucide.createIcons();
  }

  try {
    const res = await fetch(`/api/stats/detailed?media_type=${state.statsMediaType}`);
    const data = await res.json();
    state.detailedStatsData = data;

    // Atualiza contadores das abas de tipo de mídia
    const mediaCounts = data.media_counts || {};
    const elAll = document.getElementById('statsMediaCount-all');
    if (elAll) elAll.textContent = data.overall_total ?? data.total_items;
    const elFilme = document.getElementById('statsMediaCount-filme');
    if (elFilme) elFilme.textContent = mediaCounts.filme || 0;
    const elSerie = document.getElementById('statsMediaCount-serie');
    if (elSerie) elSerie.textContent = mediaCounts.serie || 0;
    const elLivro = document.getElementById('statsMediaCount-livro');
    if (elLivro) elLivro.textContent = mediaCounts.livro || 0;
    const elDisco = document.getElementById('statsMediaCount-disco');
    if (elDisco) elDisco.textContent = mediaCounts.disco || 0;

    // Atualiza Painel de Resumo / KPIs no topo
    const summary = data.summary || {};
    const kpiTotal = document.getElementById('kpiTotalItems');
    if (kpiTotal) kpiTotal.textContent = data.total_items || 0;

    const mediaScopeNames = {
      all: 'no acervo geral',
      filme: 'em filmes',
      serie: 'em séries',
      livro: 'em livros',
      disco: 'em discos'
    };
    const kpiSub = document.getElementById('kpiTotalSubtitle');
    if (kpiSub) kpiSub.textContent = `obras ${mediaScopeNames[state.statsMediaType] || 'catalogadas'}`;

    const kpiGenre = document.getElementById('kpiTopGenre');
    if (kpiGenre) kpiGenre.textContent = summary.top_genre || '-';
    const kpiGenreCount = document.getElementById('kpiTopGenreCount');
    if (kpiGenreCount) kpiGenreCount.textContent = `${summary.top_genre_count || 0} obras registradas`;

    const kpiDecade = document.getElementById('kpiTopDecade');
    if (kpiDecade) kpiDecade.textContent = summary.top_decade || '-';
    const kpiDecadeCount = document.getElementById('kpiTopDecadeCount');
    if (kpiDecadeCount) kpiDecadeCount.textContent = `${summary.top_decade_count || 0} obras na década`;

    const kpiCountry = document.getElementById('kpiTopCountry');
    if (kpiCountry) kpiCountry.textContent = summary.top_country || '-';
    const kpiCountryCount = document.getElementById('kpiTopCountryCount');
    if (kpiCountryCount) kpiCountryCount.textContent = `${summary.top_country_count || 0} obras deste país`;

    const kpiRate = document.getElementById('kpiConsumedRate');
    if (kpiRate) kpiRate.textContent = `${summary.consumed_percentage || 0}%`;
    const kpiConsumed = document.getElementById('kpiConsumedCount');
    if (kpiConsumed) kpiConsumed.textContent = `${summary.total_consumed || 0} de ${data.total_items || 0} já consumidos`;

    // Atualiza contadores das abas de dimensões
    const badgeGen = document.getElementById('dimBadgeCount-genero');
    if (badgeGen) badgeGen.textContent = (data.genres || []).length;
    const badgeDec = document.getElementById('dimBadgeCount-decada');
    if (badgeDec) badgeDec.textContent = (data.decades || []).length;
    const badgeAno = document.getElementById('dimBadgeCount-ano');
    if (badgeAno) badgeAno.textContent = (data.years || []).length;
    const badgePais = document.getElementById('dimBadgeCount-pais');
    if (badgePais) badgePais.textContent = (data.countries || []).length;

    renderDimensionBars(data, state.statsDimension);
  } catch (err) {
    console.error('Erro ao carregar estatísticas detalhadas:', err);
    if (container) {
      container.innerHTML = '<div class="text-center py-10 text-rose-400">Erro ao processar dados estatísticos.</div>';
    }
  }
}

function renderDimensionBars(data, dimension) {
  const container = document.getElementById('statsBarsContainer');
  const summaryText = document.getElementById('statsDimSummaryText');
  if (!container) return;

  container.innerHTML = '';
  const total = data.total_items || 0;

  if (total === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400 flex flex-col items-center">
        <i data-lucide="inbox" class="w-10 h-10 mb-2 opacity-40"></i>
        <p class="font-bold text-slate-300">Nenhuma obra encontrada para esta mídia</p>
        <p class="text-xs text-slate-500 mt-1">Adicione obras deste tipo para visualizar dados estatísticos detalhados.</p>
        <button onclick="openSearchModal()" class="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Buscar e Registrar Obras</span>
        </button>
      </div>
    `;
    if (summaryText) summaryText.textContent = 'Sem registros nesta mídia';
    if (window.lucide) lucide.createIcons();
    return;
  }

  let itemsToRender = [];
  if (dimension === 'genero') {
    itemsToRender = data.genres || [];
    if (summaryText) summaryText.textContent = `${itemsToRender.length} gêneros presentes em ${total} obra(s)`;
  } else if (dimension === 'decada') {
    itemsToRender = data.decades || [];
    if (summaryText) summaryText.textContent = `${itemsToRender.length} décadas representadas`;
  } else if (dimension === 'ano') {
    itemsToRender = data.years || [];
    if (summaryText) summaryText.textContent = `${itemsToRender.length} anos distintos de lançamento`;
  } else if (dimension === 'pais') {
    itemsToRender = data.countries || [];
    if (summaryText) summaryText.textContent = `${itemsToRender.length} países catalogados`;
  }

  if (itemsToRender.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <p class="text-sm font-semibold text-slate-300">Nenhum dado registrado para esta dimensão.</p>
        <p class="text-xs text-slate-500 mt-1">As obras cadastradas ainda não possuem essas informações preenchidas.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  itemsToRender.forEach((item, index) => {
    let title = '';
    let subtitle = '';
    let filterVal = '';
    let favs = item.favorites_count || 0;
    let count = item.count || 0;
    let pct = item.percentage || 0;
    let iconName = 'tag';

    if (dimension === 'genero') {
      title = item.name;
      subtitle = `${count} obra(s) (${pct}%) no acervo`;
      filterVal = item.name;
      iconName = 'tag';
    } else if (dimension === 'decada') {
      title = item.label;
      const yrsStr = item.years_present?.length > 0 ? `Anos com obras: ${item.years_present.join(', ')}` : item.desc;
      subtitle = `${item.desc} • ${yrsStr}`;
      filterVal = item.decade_start;
      iconName = 'hourglass';
    } else if (dimension === 'ano') {
      title = `Ano ${item.year}`;
      const decStart = Math.floor(item.year / 10) * 10;
      subtitle = `Década de ${decStart} • ${count} obra(s) (${pct}%)`;
      filterVal = item.year;
      iconName = 'calendar';
    } else if (dimension === 'pais') {
      title = item.country;
      subtitle = `${count} obra(s) (${pct}%) no acervo`;
      filterVal = item.country;
      iconName = 'globe';
    }

    const encodedVal = encodeURIComponent(String(filterVal));
    const row = document.createElement('div');
    row.className = 'bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all';

    row.innerHTML = `
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-6 h-6 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
            ${index + 1}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <i data-lucide="${iconName}" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></i>
                <span>${title}</span>
              </h4>
              ${favs > 0 ? `
                <span class="text-[10px] px-2 py-0.2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1">
                  ⭐ ${favs} favorito${favs > 1 ? 's' : ''}
                </span>
              ` : ''}
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5 truncate">${subtitle}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <span class="text-sm font-black text-white">${count}</span>
            <span class="text-[10px] text-indigo-400 font-bold ml-1">(${pct}%)</span>
          </div>

          <button 
            onclick="filterCatalogByDimension('${dimension}', decodeURIComponent('${encodedVal}'), '${state.statsMediaType}')" 
            title="Ver obras no catálogo do acervo" 
            class="text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/30 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <span>Ver no Acervo</span>
            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 stroke-[2.5]"></i>
          </button>
        </div>
      </div>

      <div class="w-full bg-slate-950/70 rounded-full h-2 overflow-hidden border border-slate-800/80">
        <div 
          class="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-2 rounded-full transition-all duration-500" 
          style="width: ${Math.min(pct, 100)}%"
        ></div>
      </div>
    `;

    container.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}

function filterCatalogByDimension(dimType, value, mediaType) {
  // 1. Alterna para a visualização do Acervo
  switchView('acervo');

  // 2. Define o tipo de mídia selecionado
  if (mediaType && mediaType !== 'all') {
    setMediaType(mediaType);
  } else {
    setMediaType('all');
  }

  // 3. Reseta filtros concorrentes
  state.status = 'all';
  state.genre = 'all';
  state.year = 'all';
  state.country = 'all';
  state.search = '';

  document.getElementById('genreSelect').value = 'all';
  document.getElementById('yearSelect').value = 'all';
  document.getElementById('countrySelect').value = 'all';
  document.getElementById('catalogSearchInput').value = '';
  document.getElementById('clearCatalogSearchBtn').classList.add('hidden');

  // 4. Aplica a dimensão específica
  if (dimType === 'genero') {
    state.genre = value;
    const genreSel = document.getElementById('genreSelect');
    if (genreSel) genreSel.value = value;
    showToast(`Filtrando acervo pelo gênero: "${value}"`, 'info');
  } else if (dimType === 'ano') {
    const yr = parseInt(value);
    state.year = isNaN(yr) ? 'all' : yr;
    const yearSel = document.getElementById('yearSelect');
    if (yearSel) yearSel.value = state.year;
    showToast(`Filtrando acervo pelo ano de lançamento: "${value}"`, 'info');
  } else if (dimType === 'pais') {
    state.country = value;
    const countrySel = document.getElementById('countrySelect');
    if (countrySel) countrySel.value = value;
    showToast(`Filtrando acervo pelo país de origem: "${value}"`, 'info');
  } else if (dimType === 'decada') {
    const decStart = parseInt(value);
    const yrsInDecade = state.filtersData?.years?.filter(y => y >= decStart && y < decStart + 10) || [];
    if (yrsInDecade.length === 1) {
      state.year = yrsInDecade[0];
      document.getElementById('yearSelect').value = state.year;
    }
    showToast(`Filtrando acervo pela década: ${decStart}s`, 'info');
  }

  setStatusFilter('all');
  updateActiveFilterChips();
  loadItems();
}
