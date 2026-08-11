/* ==========================================================================
   TERANGA PACKAGING — App de gestion & prospection
   Vanilla JS, sans framework, sans étape de build.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* CONSTANTES */
/* ---------------------------------------------------------------------- */

const PRODUCTS = [
  { id: "boite-burger-kraft", nom: "Boîte Burger Kraft", cat: "kraft" },
  { id: "boite-sandwich-kraft", nom: "Boîte Sandwich Kraft", cat: "kraft" },
  { id: "barquette-tacos-kraft", nom: "Barquette Tacos Kraft", cat: "kraft" },
  { id: "boite-pizza-kraft", nom: "Boîte Pizza Kraft", cat: "kraft" },
  { id: "boite-patisserie-kraft", nom: "Boîte Pâtisserie Kraft", cat: "kraft" },
  { id: "boite-gateau-kraft", nom: "Boîte à Gâteau Kraft", cat: "kraft" },
  { id: "bol-salade-kraft", nom: "Bol Salade Kraft", cat: "kraft" },
  { id: "gobelet-kraft-chaud", nom: "Gobelet Kraft Boissons Chaudes", cat: "kraft" },
  { id: "pot-kraft-couvercle", nom: "Pot Kraft avec Couvercle", cat: "kraft" },
  { id: "porte-gobelets", nom: "Porte-Gobelets", cat: "kraft" },
  { id: "sac-kraft-poignees", nom: "Sac Kraft avec Poignées", cat: "kraft" },
  { id: "papier-alimentaire-kraft", nom: "Papier Alimentaire Kraft", cat: "kraft" },
  { id: "serviettes-kraft", nom: "Serviettes Kraft", cat: "kraft" },
  { id: "bol-kraft-couvercle", nom: "Bol Kraft avec Couvercle", cat: "kraft" },
  { id: "boite-transparente", nom: "Boîte Alimentaire Transparente", cat: "plastique" },
  { id: "barquette-noire-compart", nom: "Barquette Noire Compartimentée", cat: "plastique" },
  { id: "boite-patisserie-transparente", nom: "Boîte Pâtisserie Transparente", cat: "plastique" },
  { id: "gobelet-pet-dome", nom: "Gobelet PET avec Dôme", cat: "plastique" },
  { id: "couvercle-dome-pet", nom: "Couvercle Dôme PET", cat: "plastique" },
  { id: "pot-sauce-transparent", nom: "Pot à Sauce Transparent", cat: "plastique" },
  { id: "barquette-plastique-transparente", nom: "Barquette Plastique Transparente", cat: "plastique" },
  { id: "couverts-jetables", nom: "Couverts Jetables", cat: "plastique" },
  { id: "pailles", nom: "Pailles", cat: "plastique" },
  { id: "barquette-aluminium", nom: "Barquette Aluminium", cat: "plastique" },
  { id: "pot-cosmetique-kraft", nom: "Pot Cosmétique + Boîte Kraft", cat: "cosmetique" },
  { id: "flacon-comptegouttes-kraft", nom: "Flacon Compte-gouttes + Boîte Kraft", cat: "cosmetique" },
  { id: "flacon-pompe-kraft", nom: "Flacon Pompe + Boîte Kraft", cat: "cosmetique" },
  { id: "boite-kraft-savon", nom: "Boîte Kraft pour Savon", cat: "cosmetique" },
  { id: "flacon-pompe-cosmetique-etui", nom: "Flacon Pompe Cosmétique + Étui", cat: "cosmetique" },
  { id: "petit-flacon-comptegouttes-etui", nom: "Petit Flacon Compte-gouttes + Étui", cat: "cosmetique" },
];

const CAT_LABEL = { kraft: "Kraft", plastique: "Plastique", cosmetique: "Cosmétique" };
const TAILLES = ["Petit", "Moyen", "Grand"];

const SECTEURS = [
  "Restaurants", "Fast-foods", "Pâtisseries", "Boulangeries", "Cafés", "Traiteurs",
  "Hôtels", "Marques alimentaires", "Producteurs locaux", "Épiceries fines",
  "Entreprises agroalimentaires", "Cosmétique", "Startups", "Autre",
];

const TX_CATEGORIES_IN = ["Vente", "Apport", "Autre entrée"];
const TX_CATEGORIES_OUT = ["Achat stock", "Salaire", "Électricité", "Eau", "Transport", "Internet", "Téléphone", "Autre"];

const LS_KEY = "teranga_app_state_v2";

/* ---------------------------------------------------------------------- */
/* ÉTAT PAR DÉFAUT */
/* ---------------------------------------------------------------------- */

function emptyPrix() { return { Petit: { achat: 0, vente: 0 }, Moyen: { achat: 0, vente: 0 }, Grand: { achat: 0, vente: 0 } }; }
function emptySeuil() { return { Petit: 20, Moyen: 20, Grand: 20 }; }

function defaultState() {
  return {
    meta: { deviceId: uid(), createdAt: nowISO() },
    produits: PRODUCTS.map(p => ({ ...p, prix: emptyPrix(), seuil: emptySeuil() })),
    prospects: [],
    stockMouvements: [],
    simulations: [],
    caisse: [],
    settings: { firebaseConfig: "", syncCode: "" },
  };
}

let state = null;
let fileHandle = null;
let fbApp = null, fbDb = null, fbUnsub = null;
const persistDebounced = debounce(persistAll, 700);

/* ---------------------------------------------------------------------- */
/* UTILS */
/* ---------------------------------------------------------------------- */

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function nowISO() { return new Date().toISOString(); }
function todayInput() { return new Date().toISOString().slice(0, 10); }
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtFCFA(n) {
  n = Math.round(Number(n) || 0);
  return n.toLocaleString("fr-FR") + " FCFA";
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function findProduit(id) { return state.produits.find(p => p.id === id); }
function productName(id) { const p = findProduit(id); return p ? p.nom : id; }
function productCat(id) { const p = findProduit(id); return p ? p.cat : "kraft"; }
function toast(msg, type) {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " error" : "");
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------------------------------------------------------------------- */
/* PERSISTENCE : localStorage + fichier disque + Firebase (optionnels) */
/* ---------------------------------------------------------------------- */

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const existingIds = new Set((parsed.produits || []).map(p => p.id));
      PRODUCTS.forEach(p => {
        if (!existingIds.has(p.id)) parsed.produits.push({ ...p, prix: emptyPrix(), seuil: emptySeuil() });
      });
      state = Object.assign(defaultState(), parsed);
      state.produits = parsed.produits;
      return;
    }
  } catch (e) { console.warn("Lecture locale impossible", e); }
  state = defaultState();
}

function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { console.warn(e); }
  persistDebounced();
  render();
}

async function persistAll() {
  await saveToFileHandle();
  await pushToFirebase();
}

/* ---- Sauvegarde sur disque (File System Access API) ---- */

const FS_SUPPORTED = "showSaveFilePicker" in window;

async function connectFileHandle() {
  if (!FS_SUPPORTED) {
    toast("Sauvegarde sur disque non supportée par ce navigateur (essayez Chrome/Edge).", "error");
    return;
  }
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: "teranga-packaging-donnees.json",
      types: [{ description: "Fichier JSON", accept: { "application/json": [".json"] } }],
    });
    await idbSet("fileHandle", fileHandle);
    await saveToFileHandle();
    toast("Fichier de sauvegarde connecté.");
    updateSyncLabel();
  } catch (e) {
    if (e.name !== "AbortError") toast("Impossible de connecter le fichier.", "error");
  }
}

async function saveToFileHandle() {
  if (!fileHandle) return;
  try {
    const perm = await fileHandle.queryPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      const req = await fileHandle.requestPermission({ mode: "readwrite" });
      if (req !== "granted") return;
    }
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();
  } catch (e) { console.warn("Écriture fichier échouée", e); }
}

function idbSet(key, val) {
  return new Promise((resolve) => {
    const req = indexedDB.open("teranga_app_fs", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => {
      const tx = req.result.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = () => resolve(true);
    };
    req.onerror = () => resolve(false);
  });
}
function idbGet(key) {
  return new Promise((resolve) => {
    const req = indexedDB.open("teranga_app_fs", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => {
      const tx = req.result.transaction("kv", "readonly");
      const r = tx.objectStore("kv").get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

async function restoreFileHandle() {
  if (!FS_SUPPORTED) return;
  try {
    const handle = await idbGet("fileHandle");
    if (!handle) return;
    const perm = await handle.queryPermission({ mode: "readwrite" });
    if (perm === "granted") { fileHandle = handle; updateSyncLabel(); }
  } catch (e) { /* ignore */ }
}

/* ---- Synchronisation Firebase (optionnelle, sans auth) ---- */

async function connectFirebase() {
  const cfgRaw = document.getElementById("fbConfig").value.trim();
  const code = document.getElementById("fbCode").value.trim();
  if (!cfgRaw || !code) { toast("Renseignez la config Firebase et un code de synchronisation.", "error"); return; }
  let cfg;
  try { cfg = JSON.parse(cfgRaw); } catch (e) { toast("Configuration Firebase invalide (JSON attendu).", "error"); return; }

  try {
    const [{ initializeApp }, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
    ]);
    fbApp = initializeApp(cfg);
    fbDb = fs.getFirestore(fbApp);
    state.settings.firebaseConfig = cfgRaw;
    state.settings.syncCode = code;
    saveState();

    const ref = fs.doc(fbDb, "teranga_packaging_sync", code);
    await fs.setDoc(ref, { data: JSON.stringify(state), device: state.meta.deviceId, updatedAt: Date.now() });

    if (fbUnsub) fbUnsub();
    fbUnsub = fs.onSnapshot(ref, (snap) => {
      const d = snap.data();
      if (!d || d.device === state.meta.deviceId) return;
      try {
        const incoming = JSON.parse(d.data);
        state = incoming;
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        render();
        toast("Données mises à jour depuis un autre appareil.");
      } catch (e) { /* ignore */ }
    }, (err) => {
      setSyncStatus("err", "Erreur de synchronisation");
    });

    setSyncStatus("on", "Synchronisé (" + code + ")");
    toast("Connecté à la synchronisation.");
  } catch (e) {
    console.error(e);
    setSyncStatus("err", "Connexion impossible");
    toast("Connexion Firebase impossible. Vérifiez la configuration.", "error");
  }
}

function disconnectFirebase() {
  if (fbUnsub) { fbUnsub(); fbUnsub = null; }
  fbApp = null; fbDb = null;
  setSyncStatus("off", "Données locales");
  toast("Synchronisation désactivée.");
}

async function pushToFirebase() {
  if (!fbDb || !state.settings.syncCode) return;
  try {
    const fs = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const ref = fs.doc(fbDb, "teranga_packaging_sync", state.settings.syncCode);
    await fs.setDoc(ref, { data: JSON.stringify(state), device: state.meta.deviceId, updatedAt: Date.now() });
  } catch (e) { console.warn("Sync push échouée", e); }
}

function setSyncStatus(cls, label) {
  const dot = document.getElementById("syncDot");
  dot.classList.remove("on", "err");
  if (cls === "on") dot.classList.add("on");
  if (cls === "err") dot.classList.add("err");
  document.getElementById("syncLabel").textContent = label;
}
function updateSyncLabel() {
  if (fbDb) return;
  if (fileHandle) setSyncStatus("off", "Sauvegarde disque active");
  else setSyncStatus("off", "Données locales");
}

/* ---------------------------------------------------------------------- */
/* EXPORT / IMPORT JSON */
/* ---------------------------------------------------------------------- */

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "teranga-packaging-" + todayInput() + ".json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Export téléchargé.");
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state = Object.assign(defaultState(), data);
      saveState();
      toast("Données importées avec succès.");
    } catch (e) { toast("Fichier invalide.", "error"); }
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------------- */
/* CALCULS MÉTIER */
/* ---------------------------------------------------------------------- */

function computeStockLevels() {
  const map = {};
  state.produits.forEach(p => {
    TAILLES.forEach(t => {
      map[p.id + "__" + t] = { produit: p, taille: t, entree: 0, vente: 0, profitTotal: 0 };
    });
  });
  state.stockMouvements.forEach(m => {
    const key = m.produitId + "__" + m.taille;
    if (!map[key]) return;
    if (m.type === "entree") map[key].entree += m.quantite;
    else if (m.type === "vente") {
      map[key].vente += m.quantite;
      map[key].profitTotal += (m.profitTotal || 0);
    }
  });
  return Object.values(map).map(v => ({
    ...v,
    restant: v.entree - v.vente,
    prixAchat: v.produit.prix[v.taille].achat || 0,
    prixVente: v.produit.prix[v.taille].vente || 0,
    valeur: (v.entree - v.vente) * (v.produit.prix[v.taille].achat || 0),
  }));
}

function computeTotalProfit() {
  return state.stockMouvements.filter(m => m.type === "vente").reduce((s, m) => s + (m.profitTotal || 0), 0);
}

function computeRanking(filterSecteur, filterCat) {
  const agg = {};
  state.prospects.forEach(pr => {
    if (filterSecteur && pr.secteur !== filterSecteur) return;
    (pr.packaging || []).forEach(line => {
      if (filterCat && productCat(line.produitId) !== filterCat) return;
      const key = line.produitId;
      if (!agg[key]) agg[key] = { id: key, nom: productName(key), cat: productCat(key), quantite: 0, demandes: 0 };
      agg[key].quantite += Number(line.quantite) || 0;
      agg[key].demandes += 1;
    });
  });
  return Object.values(agg).sort((a, b) => b.quantite - a.quantite);
}

function computeCaisseSummary() {
  let entree = 0, sortie = 0;
  state.caisse.forEach(t => { if (t.type === "entree") entree += t.montant; else sortie += t.montant; });
  return { entree, sortie, solde: entree - sortie };
}

/* ---------------------------------------------------------------------- */
/* RENDU — ROUTER */
/* ---------------------------------------------------------------------- */

const PAGE_TITLES = {
  dashboard: "Tableau de bord",
  prospection: "Prospection",
  analyse: "Demandes produits",
  stock: "Stock",
  budget: "Simulation budget",
  caisse: "Comptabilité & Caisse",
  reglages: "Réglages",
};

function showPage(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  document.getElementById("pageTitle").textContent = PAGE_TITLES[page];
  document.getElementById("sidebar").classList.remove("open");
  renderPage(page);
  window.scrollTo(0, 0);
}

function renderPage(page) {
  if (page === "dashboard") renderDashboard();
  if (page === "prospection") renderProspection();
  if (page === "analyse") renderAnalyse();
  if (page === "stock") renderStock();
  if (page === "budget") renderBudget();
  if (page === "caisse") renderCaisse();
  if (page === "reglages") renderReglages();
}

function render() {
  const active = document.querySelector(".nav-item.active");
  renderPage(active ? active.dataset.page : "dashboard");
}

function barsHTML(rows, opts) {
  opts = opts || {};
  if (!rows.length) return '<p class="empty-hint">Pas encore de données.</p>';
  const max = Math.max(...rows.map(r => r.value), 1);
  return rows.map(r => `
    <div class="bar-row">
      <div class="bar-label" title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</div>
      <div class="bar-track"><div class="bar-fill${opts.gold ? " gold" : ""}" style="width:${Math.max(3, r.value / max * 100)}%"></div></div>
      <div class="bar-val">${r.display ?? r.value}</div>
    </div>`).join("");
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD */
/* ---------------------------------------------------------------------- */

function renderDashboard() {
  const ranking = computeRanking();
  const top = ranking[0];
  const stockLevels = computeStockLevels();
  const stockValue = stockLevels.reduce((s, v) => s + v.valeur, 0);
  const caisse = computeCaisseSummary();
  const profit = computeTotalProfit();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const prospectsThisMonth = state.prospects.filter(p => (p.date || "").slice(0, 7) === thisMonth).length;

  document.getElementById("kpiRow").innerHTML = `
    <div class="kpi"><div class="kpi-label">Prospects</div><div class="kpi-value">${state.prospects.length}</div><div class="kpi-sub">${prospectsThisMonth} ce mois-ci</div></div>
    <div class="kpi"><div class="kpi-label">Produit le + demandé</div><div class="kpi-value" style="font-size:16px;">${top ? escapeHtml(top.nom) : "—"}</div><div class="kpi-sub">${top ? top.quantite + " unités demandées" : "Aucune donnée"}</div></div>
    <div class="kpi"><div class="kpi-label">Valeur du stock</div><div class="kpi-value">${fmtFCFA(stockValue)}</div><div class="kpi-sub">Bénéfice réalisé : ${fmtFCFA(profit)}</div></div>
    <div class="kpi"><div class="kpi-label">Solde de caisse</div><div class="kpi-value">${fmtFCFA(caisse.solde)}</div><div class="kpi-sub">${fmtFCFA(caisse.entree)} entrées · ${fmtFCFA(caisse.sortie)} sorties</div></div>
  `;

  document.getElementById("topProductsChart").innerHTML = barsHTML(
    ranking.slice(0, 8).map(r => ({ label: r.nom, value: r.quantite, display: r.quantite }))
  );

  const bySecteur = {};
  state.prospects.forEach(p => { bySecteur[p.secteur] = (bySecteur[p.secteur] || 0) + 1; });
  document.getElementById("sectorChart").innerHTML = barsHTML(
    Object.entries(bySecteur).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k, value: v, display: v })),
    { gold: true }
  );

  const recent = [...state.prospects].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);
  document.getElementById("recentProspectsTbl").innerHTML = `
    <thead><tr><th>Date</th><th>Entreprise</th><th>Secteur</th><th>Statut</th></tr></thead>
    <tbody>${recent.length ? recent.map(p => `
      <tr><td>${fmtDate(p.date)}</td><td>${escapeHtml(p.entreprise)}</td><td>${escapeHtml(p.secteur)}</td><td>${statutPill(p.statut)}</td></tr>
    `).join("") : `<tr class="empty-row"><td colspan="4">Aucun prospect enregistré pour l'instant.</td></tr>`}</tbody>`;
}

function statutPill(s) {
  const map = { "Nouveau": "pill-gray", "Contacté": "pill-gold", "Intéressé": "pill-gold", "Client": "pill-green", "Perdu": "pill-red" };
  return `<span class="pill ${map[s] || "pill-gray"}">${escapeHtml(s || "Nouveau")}</span>`;
}

/* ---------------------------------------------------------------------- */
/* PROSPECTION */
/* ---------------------------------------------------------------------- */

let pkgActiveCat = "kraft";
let pkgLines = [];

function fillSelectOptions(select, values, withEmpty) {
  select.innerHTML = (withEmpty ? `<option value="">${withEmpty}</option>` : "") +
    values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

function renderProspection() {
  fillSelectOptions(document.getElementById("pf-secteur"), SECTEURS);
  const secteurFilter = document.getElementById("pfilter-secteur");
  if (secteurFilter.options.length <= 1) fillSelectOptions(secteurFilter, SECTEURS, "Tous secteurs");

  renderPkgPicker();
  renderPkgLines();
  renderProspectsTable();
}

function renderPkgPicker() {
  const grid = document.getElementById("pkgGrid");
  const items = PRODUCTS.filter(p => p.cat === pkgActiveCat);
  grid.innerHTML = items.map(p => {
    const already = pkgLines.some(l => l.produitId === p.id);
    return `<button type="button" class="pkg-item${already ? " checked" : ""}" data-id="${p.id}">
      <span>${escapeHtml(p.nom)}</span><span class="pkg-item-check">${already ? "✓ ajouté" : "+ ajouter"}</span>
    </button>`;
  }).join("");
}

function renderPkgLines() {
  const wrap = document.getElementById("pkgLines");
  if (!pkgLines.length) {
    wrap.innerHTML = '<p class="empty-hint">Aucun produit ajouté. Cliquez sur un produit ci-dessus pour l\'ajouter à la demande.</p>';
    return;
  }
  wrap.innerHTML = `
    <div class="pkgline pkgline-head">
      <span>Produit</span><span>Quantité</span><span>Format</span><span></span>
    </div>
    ${pkgLines.map((l, i) => `
    <div class="pkgline" data-idx="${i}">
      <span class="pkgline-name">${escapeHtml(productName(l.produitId))}</span>
      <input type="number" min="1" step="1" class="pkgline-qty" value="${l.quantite}" data-idx="${i}">
      <select class="pkgline-taille" data-idx="${i}">
        ${TAILLES.map(t => `<option value="${t}" ${l.taille === t ? "selected" : ""}>${t}</option>`).join("")}
      </select>
      <button type="button" class="icon-btn del pkgline-del" data-idx="${i}" title="Retirer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>`).join("")}
  `;
}

function resetProspectForm() {
  document.getElementById("prospectForm").reset();
  document.getElementById("pf-id").value = "";
  document.getElementById("pf-date").value = todayInput();
  document.getElementById("pf-statut").value = "Nouveau";
  pkgLines = [];
  pkgActiveCat = "kraft";
  document.querySelectorAll(".pkg-tab").forEach(t => t.classList.toggle("active", t.dataset.cat === "kraft"));
  renderPkgPicker();
  renderPkgLines();
  document.getElementById("prospectFormTitle").textContent = "Nouvelle fiche prospect";
}

function fillProspectForm(p) {
  document.getElementById("pf-id").value = p.id;
  document.getElementById("pf-date").value = p.date;
  document.getElementById("pf-entreprise").value = p.entreprise;
  document.getElementById("pf-secteur").value = p.secteur;
  document.getElementById("pf-contact").value = p.contact || "";
  document.getElementById("pf-telephone").value = p.telephone || "";
  document.getElementById("pf-email").value = p.email || "";
  document.getElementById("pf-adresse").value = p.adresse || "";
  document.getElementById("pf-statut").value = p.statut || "Nouveau";
  document.getElementById("pf-autre").value = p.autre || "";
  document.getElementById("pf-notes").value = p.notes || "";
  pkgLines = (p.packaging || []).map(l => ({ ...l }));
  renderPkgPicker();
  renderPkgLines();
  document.getElementById("prospectFormTitle").textContent = "Modifier la fiche — " + p.entreprise;
  document.getElementById("page-prospection").scrollIntoView({ behavior: "smooth" });
}

function renderProspectsTable() {
  const search = (document.getElementById("pfilter-search").value || "").toLowerCase();
  const secteur = document.getElementById("pfilter-secteur").value;
  const statut = document.getElementById("pfilter-statut").value;

  let rows = [...state.prospects];
  if (search) rows = rows.filter(p => p.entreprise.toLowerCase().includes(search));
  if (secteur) rows = rows.filter(p => p.secteur === secteur);
  if (statut) rows = rows.filter(p => p.statut === statut);
  rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  document.getElementById("prospectsTbl").innerHTML = `
    <thead><tr><th>Date</th><th>Entreprise</th><th>Secteur</th><th>Contact</th><th>Packaging demandé</th><th>Statut</th><th></th></tr></thead>
    <tbody>${rows.length ? rows.map(p => `
      <tr>
        <td>${fmtDate(p.date)}</td>
        <td><strong>${escapeHtml(p.entreprise)}</strong></td>
        <td>${escapeHtml(p.secteur)}</td>
        <td>${escapeHtml(p.telephone || p.contact || "—")}</td>
        <td>${packagingSummary(p)}</td>
        <td>${statutPill(p.statut)}</td>
        <td class="row-actions">
          <button class="icon-btn edit-prospect" data-id="${p.id}" title="Modifier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
          <button class="icon-btn del del-prospect" data-id="${p.id}" title="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
        </td>
      </tr>`).join("") : `<tr class="empty-row"><td colspan="7">Aucune fiche ne correspond.</td></tr>`}</tbody>`;
}

function packagingSummary(p) {
  const lines = p.packaging || [];
  if (!lines.length && !p.autre) return "—";
  let html = lines.slice(0, 2).map(l => `<span class="pill pill-gray">${l.quantite} × ${escapeHtml(productName(l.produitId))} (${l.taille})</span>`).join(" ");
  if (lines.length > 2) html += ` <span class="pill pill-gray">+${lines.length - 2}</span>`;
  if (p.autre) html += ` <span class="pill pill-gold">Autre</span>`;
  return html;
}

function saveProspectFromForm() {
  const id = document.getElementById("pf-id").value || uid();
  const isEdit = !!document.getElementById("pf-id").value;
  const prospect = {
    id,
    date: document.getElementById("pf-date").value || todayInput(),
    entreprise: document.getElementById("pf-entreprise").value.trim(),
    secteur: document.getElementById("pf-secteur").value,
    contact: document.getElementById("pf-contact").value.trim(),
    telephone: document.getElementById("pf-telephone").value.trim(),
    email: document.getElementById("pf-email").value.trim(),
    adresse: document.getElementById("pf-adresse").value.trim(),
    statut: document.getElementById("pf-statut").value,
    packaging: pkgLines.map(l => ({ produitId: l.produitId, quantite: Number(l.quantite) || 1, taille: l.taille })),
    autre: document.getElementById("pf-autre").value.trim(),
    notes: document.getElementById("pf-notes").value.trim(),
  };
  if (!prospect.entreprise) { toast("Le nom de l'entreprise est requis.", "error"); return; }

  if (isEdit) {
    const idx = state.prospects.findIndex(p => p.id === id);
    if (idx > -1) state.prospects[idx] = prospect;
  } else {
    state.prospects.push(prospect);
  }
  saveState();
  resetProspectForm();
  toast(isEdit ? "Fiche mise à jour." : "Fiche enregistrée.");
}

/* ---------------------------------------------------------------------- */
/* ANALYSE */
/* ---------------------------------------------------------------------- */

function renderAnalyse() {
  const secteurSel = document.getElementById("afilter-secteur");
  if (secteurSel.options.length <= 1) fillSelectOptions(secteurSel, SECTEURS, "Tous secteurs");

  const secteur = secteurSel.value;
  const cat = document.getElementById("afilter-cat").value;
  const ranking = computeRanking(secteur, cat);

  document.getElementById("rankingTbl").innerHTML = `
    <thead><tr><th>#</th><th>Produit</th><th>Matière</th><th>Unités demandées</th><th>Nb. de demandes</th></tr></thead>
    <tbody>${ranking.length ? ranking.map((r, i) => `
      <tr><td>${i + 1}</td><td><strong>${escapeHtml(r.nom)}</strong></td><td><span class="pill pill-gray">${CAT_LABEL[r.cat]}</span></td><td>${r.quantite.toLocaleString("fr-FR")}</td><td>${r.demandes}</td></tr>
    `).join("") : `<tr class="empty-row"><td colspan="5">Aucune demande enregistrée pour ces filtres.</td></tr>`}</tbody>`;

  const tailleCounts = {};
  state.prospects.forEach(p => (p.packaging || []).forEach(l => { tailleCounts[l.taille] = (tailleCounts[l.taille] || 0) + (Number(l.quantite) || 0); }));
  document.getElementById("tailleChart").innerHTML = barsHTML(
    TAILLES.map(t => ({ label: t, value: tailleCounts[t] || 0, display: tailleCounts[t] || 0 }))
  );

  const autres = state.prospects.filter(p => p.autre).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  document.getElementById("autreTbl").innerHTML = `
    <thead><tr><th>Entreprise</th><th>Besoin décrit</th></tr></thead>
    <tbody>${autres.length ? autres.map(p => `<tr><td>${escapeHtml(p.entreprise)}</td><td>${escapeHtml(p.autre)}</td></tr>`).join("") : `<tr class="empty-row"><td colspan="2">Aucun besoin "autre" signalé.</td></tr>`}</tbody>`;
}

/* ---------------------------------------------------------------------- */
/* STOCK */
/* ---------------------------------------------------------------------- */

function renderStock() {
  const levels = computeStockLevels();
  const totalValue = levels.reduce((s, v) => s + v.valeur, 0);
  const lowStock = levels.filter(v => v.restant > 0 && v.restant <= v.produit.seuil[v.taille]);
  const totalUnits = levels.reduce((s, v) => s + v.restant, 0);
  const profit = computeTotalProfit();

  document.getElementById("stockKpiRow").innerHTML = `
    <div class="kpi"><div class="kpi-label">Unités en stock</div><div class="kpi-value">${totalUnits.toLocaleString("fr-FR")}</div></div>
    <div class="kpi"><div class="kpi-label">Valeur du stock</div><div class="kpi-value">${fmtFCFA(totalValue)}</div></div>
    <div class="kpi"><div class="kpi-label">Bénéfice réalisé</div><div class="kpi-value">${fmtFCFA(profit)}</div><div class="kpi-sub">Sur toutes les ventes enregistrées</div></div>
    <div class="kpi"><div class="kpi-label">Sous le seuil d'alerte</div><div class="kpi-value">${lowStock.length}</div></div>
  `;

  const search = (document.getElementById("sfilter-search").value || "").toLowerCase();
  let rows = levels.filter(v => v.produit.nom.toLowerCase().includes(search) && (v.entree > 0 || v.vente > 0));
  rows.sort((a, b) => (a.restant - a.produit.seuil[a.taille]) - (b.restant - b.produit.seuil[b.taille]));

  document.getElementById("stockTbl").innerHTML = `
    <thead><tr><th>Produit</th><th>Format</th><th>Matière</th><th>Entrées</th><th>Ventes</th><th>Restant</th><th>Valeur</th><th>Bénéfice</th><th>Statut</th></tr></thead>
    <tbody>${rows.length ? rows.map(v => `
      <tr>
        <td><strong>${escapeHtml(v.produit.nom)}</strong></td>
        <td><span class="pill pill-gray">${v.taille}</span></td>
        <td><span class="pill pill-gray">${CAT_LABEL[v.produit.cat]}</span></td>
        <td>${v.entree.toLocaleString("fr-FR")}</td>
        <td>${v.vente.toLocaleString("fr-FR")}</td>
        <td><strong>${v.restant.toLocaleString("fr-FR")}</strong></td>
        <td>${fmtFCFA(v.valeur)}</td>
        <td>${fmtFCFA(v.profitTotal)}</td>
        <td>${v.restant <= 0 ? '<span class="pill pill-red">Rupture</span>' : v.restant <= v.produit.seuil[v.taille] ? '<span class="pill pill-gold">Bas</span>' : '<span class="pill pill-green">OK</span>'}</td>
      </tr>`).join("") : `<tr class="empty-row"><td colspan="9">Aucun mouvement enregistré encore. Utilisez "+ Entrée de stock" pour commencer.</td></tr>`}</tbody>`;

  const moves = [...state.stockMouvements].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 40);
  document.getElementById("movementsTbl").innerHTML = `
    <thead><tr><th>Date</th><th>Produit</th><th>Format</th><th>Type</th><th>Quantité</th><th>Prix unit.</th><th>Bénéfice</th><th>Note</th><th></th></tr></thead>
    <tbody>${moves.length ? moves.map(m => `
      <tr>
        <td>${fmtDate(m.date)}</td>
        <td>${escapeHtml(productName(m.produitId))}</td>
        <td><span class="pill pill-gray">${m.taille}</span></td>
        <td>${m.type === "entree" ? '<span class="pill pill-green">Entrée</span>' : '<span class="pill pill-gold">Vente</span>'}</td>
        <td>${m.type === "entree" ? "+" : "−"}${m.quantite.toLocaleString("fr-FR")}</td>
        <td>${fmtFCFA(m.type === "entree" ? m.prixAchat : m.prixVente)}</td>
        <td>${m.type === "vente" ? fmtFCFA(m.profitTotal) : "—"}</td>
        <td>${escapeHtml(m.note || "—")}</td>
        <td class="row-actions"><button class="icon-btn del del-mvt" data-id="${m.id}" title="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>
      </tr>`).join("") : `<tr class="empty-row"><td colspan="9">Aucun mouvement enregistré.</td></tr>`}</tbody>`;
}

function openStockModal(type) {
  const isEntree = type === "entree";
  const options = state.produits.map(p => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  openModal(`
    <h3>${isEntree ? "Nouvelle entrée de stock (achat)" : "Nouvelle vente"}</h3>
    <form id="mvtForm" class="form-grid">
      <div class="f f-wide"><label>Produit</label><select id="mvt-produit">${options}</select></div>
      <div class="f"><label>Format</label><select id="mvt-taille">${TAILLES.map(t => `<option value="${t}">${t}</option>`).join("")}</select></div>
      <div class="f"><label>Quantité</label><input type="number" id="mvt-qty" min="1" step="1" value="100" required></div>
      <div class="f"><label>Prix d'achat unitaire (FCFA)</label><input type="number" id="mvt-prix-achat" min="0" step="1"></div>
      ${isEntree ? "" : `<div class="f"><label>Prix de vente unitaire (FCFA)</label><input type="number" id="mvt-prix-vente" min="0" step="1"></div>`}
      <div class="f"><label>Date</label><input type="date" id="mvt-date" value="${todayInput()}"></div>
      <div class="f f-wide"><label>Note</label><input type="text" id="mvt-note" placeholder="${isEntree ? "Fournisseur, référence..." : "Client, référence..."}"></div>
      <p class="hint">${isEntree ? "Cette entrée sera aussi enregistrée comme une dépense (\"Achat stock\") dans la caisse." : "Cette vente sera aussi enregistrée comme une recette (\"Vente\") dans la caisse, et le bénéfice sera calculé automatiquement."}</p>
      <div class="f f-wide form-actions">
        <button type="button" class="btn btn-ghost" id="mvtCancel">Annuler</button>
        <button type="submit" class="btn btn-primary">${isEntree ? "Enregistrer l'entrée" : "Enregistrer la vente"}</button>
      </div>
    </form>
  `);

  const produitSel = document.getElementById("mvt-produit");
  const tailleSel = document.getElementById("mvt-taille");
  function syncPrix() {
    const p = findProduit(produitSel.value);
    const t = tailleSel.value;
    if (!p) return;
    document.getElementById("mvt-prix-achat").value = p.prix[t].achat || "";
    if (!isEntree) document.getElementById("mvt-prix-vente").value = p.prix[t].vente || "";
  }
  produitSel.onchange = syncPrix;
  tailleSel.onchange = syncPrix;
  syncPrix();

  document.getElementById("mvtCancel").onclick = closeModal;
  document.getElementById("mvtForm").onsubmit = (e) => {
    e.preventDefault();
    const produitId = produitSel.value;
    const taille = tailleSel.value;
    const quantite = Number(document.getElementById("mvt-qty").value) || 0;
    const prixAchat = Number(document.getElementById("mvt-prix-achat").value) || 0;
    if (quantite <= 0) { toast("Quantité invalide.", "error"); return; }

    const p = findProduit(produitId);
    const date = document.getElementById("mvt-date").value || todayInput();
    const note = document.getElementById("mvt-note").value.trim();

    if (isEntree) {
      p.prix[taille].achat = prixAchat;
      state.stockMouvements.push({ id: uid(), produitId, taille, type: "entree", quantite, prixAchat, prixVente: null, profitUnitaire: null, profitTotal: null, date, note });
      state.caisse.push({ id: uid(), type: "sortie", categorie: "Achat stock", montant: quantite * prixAchat, date, description: `Achat : ${quantite} × ${p.nom} (${taille})` });
      saveState();
      closeModal();
      toast("Entrée de stock enregistrée.");
    } else {
      const levels = computeStockLevels();
      const lvl = levels.find(l => l.produit.id === produitId && l.taille === taille);
      if (lvl && quantite > lvl.restant) { toast(`Stock insuffisant (restant : ${lvl.restant}).`, "error"); return; }

      const prixVente = Number(document.getElementById("mvt-prix-vente").value) || 0;
      p.prix[taille].vente = prixVente;
      const profitUnitaire = prixVente - prixAchat;
      const profitTotal = profitUnitaire * quantite;
      state.stockMouvements.push({ id: uid(), produitId, taille, type: "vente", quantite, prixAchat, prixVente, profitUnitaire, profitTotal, date, note });
      state.caisse.push({ id: uid(), type: "entree", categorie: "Vente", montant: quantite * prixVente, date, description: `Vente : ${quantite} × ${p.nom} (${taille})` });
      saveState();
      closeModal();
      toast(`Vente enregistrée — bénéfice : ${fmtFCFA(profitTotal)}.`);
    }
  };
}

/* ---------------------------------------------------------------------- */
/* BUDGET SIMULATION */
/* ---------------------------------------------------------------------- */

let budgetMode = "qty";

function renderBudget() {
  const sel = document.getElementById("bf-produit");
  sel.innerHTML = state.produits.map(p => `<option value="${p.id}">${escapeHtml(p.nom)} (${CAT_LABEL[p.cat]})</option>`).join("");
  const tailleSel = document.getElementById("bf-taille");
  if (!tailleSel.dataset.filled) {
    tailleSel.innerHTML = TAILLES.map(t => `<option value="${t}">${t}</option>`).join("");
    tailleSel.dataset.filled = "1";
  }
  function syncPrix() {
    const p = findProduit(sel.value);
    if (!p) return;
    document.getElementById("bf-prix").value = p.prix[tailleSel.value].achat || "";
  }
  sel.onchange = syncPrix;
  tailleSel.onchange = syncPrix;
  if (!sel.dataset.bound) { sel.dataset.bound = "1"; syncPrix(); }

  const sims = [...state.simulations].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  document.getElementById("simTbl").innerHTML = `
    <thead><tr><th>Date</th><th>Produit</th><th>Format</th><th>Quantité</th><th>Prix unit.</th><th>Coût total</th><th>Coût unit. réel</th><th></th></tr></thead>
    <tbody>${sims.length ? sims.map(s => `
      <tr>
        <td>${fmtDate(s.date)}</td>
        <td>${escapeHtml(productName(s.produitId))}</td>
        <td><span class="pill pill-gray">${s.taille || "—"}</span></td>
        <td>${s.quantite.toLocaleString("fr-FR")}</td>
        <td>${fmtFCFA(s.prixUnitaire)}</td>
        <td><strong>${fmtFCFA(s.coutTotal)}</strong></td>
        <td>${fmtFCFA(s.coutUnitaireReel)}</td>
        <td class="row-actions"><button class="icon-btn del del-sim" data-id="${s.id}" title="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>
      </tr>`).join("") : `<tr class="empty-row"><td colspan="8">Aucune simulation enregistrée.</td></tr>`}</tbody>`;
}

function calcBudget() {
  const produitId = document.getElementById("bf-produit").value;
  const taille = document.getElementById("bf-taille").value;
  const prix = Number(document.getElementById("bf-prix").value) || 0;
  const transit = Number(document.getElementById("bf-transit").value) || 0;
  const transport = Number(document.getElementById("bf-transport").value) || 0;
  const fraisFixes = transit + transport;

  if (prix <= 0) { toast("Renseignez un prix unitaire.", "error"); return null; }

  let quantite, coutTotal, coutUnitaireReel, budgetDisponible = null;

  if (budgetMode === "qty") {
    quantite = Number(document.getElementById("bf-qty").value) || 0;
    if (quantite <= 0) { toast("Renseignez une quantité.", "error"); return null; }
    coutTotal = quantite * prix + fraisFixes;
    coutUnitaireReel = coutTotal / quantite;
  } else {
    budgetDisponible = Number(document.getElementById("bf-budget").value) || 0;
    if (budgetDisponible <= fraisFixes) { toast("Le budget ne couvre même pas les frais fixes.", "error"); return null; }
    quantite = Math.floor((budgetDisponible - fraisFixes) / prix);
    coutTotal = quantite * prix + fraisFixes;
    coutUnitaireReel = quantite > 0 ? coutTotal / quantite : 0;
  }

  return {
    id: uid(), date: todayInput(), produitId, taille, prixUnitaire: prix,
    transit, transport, quantite, coutTotal, coutUnitaireReel, budgetDisponible,
    note: document.getElementById("bf-note").value.trim(),
  };
}

function renderBudgetResult(sim) {
  document.getElementById("budgetResult").innerHTML = `
    <div class="result-line"><span class="rl-label">Produit</span><span class="rl-val" style="font-size:14px;">${escapeHtml(productName(sim.produitId))} — ${sim.taille}</span></div>
    <div class="result-line"><span class="rl-label">Quantité ${budgetMode === "budget" ? "accessible" : "commandée"}</span><span class="rl-val">${sim.quantite.toLocaleString("fr-FR")} unités</span></div>
    <div class="result-line"><span class="rl-label">Coût produits (hors frais)</span><span class="rl-val">${fmtFCFA(sim.quantite * sim.prixUnitaire)}</span></div>
    <div class="result-line"><span class="rl-label">Frais de transit + transport</span><span class="rl-val">${fmtFCFA(sim.transit + sim.transport)}</span></div>
    <div class="result-line big"><span class="rl-label">Coût total</span><span class="rl-val">${fmtFCFA(sim.coutTotal)}</span></div>
    <div class="result-line big"><span class="rl-label">Coût unitaire réel</span><span class="rl-val">${fmtFCFA(sim.coutUnitaireReel)}</span></div>
  `;
}

/* ---------------------------------------------------------------------- */
/* CAISSE */
/* ---------------------------------------------------------------------- */

function renderCaisse() {
  const summary = computeCaisseSummary();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const moisEntree = state.caisse.filter(t => t.type === "entree" && (t.date || "").slice(0, 7) === thisMonth).reduce((s, t) => s + t.montant, 0);
  const moisSortie = state.caisse.filter(t => t.type === "sortie" && (t.date || "").slice(0, 7) === thisMonth).reduce((s, t) => s + t.montant, 0);

  document.getElementById("caisseKpiRow").innerHTML = `
    <div class="kpi"><div class="kpi-label">Solde actuel</div><div class="kpi-value">${fmtFCFA(summary.solde)}</div></div>
    <div class="kpi"><div class="kpi-label">Entrées (total)</div><div class="kpi-value">${fmtFCFA(summary.entree)}</div></div>
    <div class="kpi"><div class="kpi-label">Sorties (total)</div><div class="kpi-value">${fmtFCFA(summary.sortie)}</div></div>
    <div class="kpi"><div class="kpi-label">Ce mois-ci</div><div class="kpi-value" style="font-size:16px;">${fmtFCFA(moisEntree - moisSortie)}</div><div class="kpi-sub">${fmtFCFA(moisEntree)} / ${fmtFCFA(moisSortie)}</div></div>
  `;

  const typeFilter = document.getElementById("cfilter-type").value;
  let rows = [...state.caisse];
  if (typeFilter) rows = rows.filter(t => t.type === typeFilter);
  rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  document.getElementById("txTbl").innerHTML = `
    <thead><tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Description</th><th>Montant</th><th></th></tr></thead>
    <tbody>${rows.length ? rows.map(t => `
      <tr>
        <td>${fmtDate(t.date)}</td>
        <td>${t.type === "entree" ? '<span class="pill pill-green">Entrée</span>' : '<span class="pill pill-red">Sortie</span>'}</td>
        <td>${escapeHtml(t.categorie)}</td>
        <td>${escapeHtml(t.description || "—")}</td>
        <td><strong>${t.type === "entree" ? "+" : "−"}${fmtFCFA(t.montant)}</strong></td>
        <td class="row-actions"><button class="icon-btn del del-tx" data-id="${t.id}" title="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>
      </tr>`).join("") : `<tr class="empty-row"><td colspan="6">Aucune transaction enregistrée.</td></tr>`}</tbody>`;

  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(dt.toISOString().slice(0, 7));
  }
  const rowsChart = [];
  months.forEach(m => {
    const entree = state.caisse.filter(t => t.type === "entree" && (t.date || "").slice(0, 7) === m).reduce((s, t) => s + t.montant, 0);
    const label = new Date(m + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    rowsChart.push({ label: label + " · entrées", value: entree, display: fmtFCFA(entree) });
  });
  document.getElementById("cashChart").innerHTML = barsHTML(rowsChart);
}

function openTxModal() {
  openModal(`
    <h3>Nouvelle transaction</h3>
    <form id="txForm" class="form-grid">
      <div class="f f-wide">
        <label>Type</label>
        <div class="seg" id="txTypeSeg">
          <button type="button" class="seg-btn active" data-type="entree">Entrée</button>
          <button type="button" class="seg-btn" data-type="sortie">Sortie / Dépense</button>
        </div>
      </div>
      <div class="f f-wide"><label>Catégorie</label><select id="tx-cat"></select></div>
      <div class="f"><label>Montant (FCFA)</label><input type="number" id="tx-montant" min="0" step="1" required></div>
      <div class="f"><label>Date</label><input type="date" id="tx-date" value="${todayInput()}"></div>
      <div class="f f-wide"><label>Description</label><input type="text" id="tx-desc" placeholder="Ex : Salaire de juillet, facture SENELEC..."></div>
      <div class="f f-wide form-actions">
        <button type="button" class="btn btn-ghost" id="txCancel">Annuler</button>
        <button type="submit" class="btn btn-primary">Enregistrer</button>
      </div>
    </form>
  `);
  let txType = "entree";
  function fillCat() { fillSelectOptions(document.getElementById("tx-cat"), txType === "entree" ? TX_CATEGORIES_IN : TX_CATEGORIES_OUT); }
  fillCat();
  document.getElementById("txTypeSeg").querySelectorAll(".seg-btn").forEach(btn => {
    btn.onclick = () => {
      txType = btn.dataset.type;
      document.querySelectorAll("#txTypeSeg .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
      fillCat();
    };
  });
  document.getElementById("txCancel").onclick = closeModal;
  document.getElementById("txForm").onsubmit = (e) => {
    e.preventDefault();
    const montant = Number(document.getElementById("tx-montant").value) || 0;
    if (montant <= 0) { toast("Montant invalide.", "error"); return; }
    state.caisse.push({
      id: uid(), type: txType,
      categorie: document.getElementById("tx-cat").value,
      montant, date: document.getElementById("tx-date").value || todayInput(),
      description: document.getElementById("tx-desc").value.trim(),
    });
    saveState();
    closeModal();
    toast("Transaction enregistrée.");
  };
}

/* ---------------------------------------------------------------------- */
/* RÉGLAGES */
/* ---------------------------------------------------------------------- */

function renderReglages() {
  const search = (document.getElementById("catfilter-search")?.value || "").toLowerCase();
  const rowsHtml = [];
  state.produits.forEach(p => {
    if (search && !p.nom.toLowerCase().includes(search)) return;
    TAILLES.forEach(t => {
      rowsHtml.push(`
      <tr>
        <td>${escapeHtml(p.nom)}</td>
        <td><span class="pill pill-gray">${CAT_LABEL[p.cat]}</span></td>
        <td><span class="pill pill-gray">${t}</span></td>
        <td><input type="number" min="0" step="1" class="catalog-achat" data-id="${p.id}" data-taille="${t}" value="${p.prix[t].achat || 0}"></td>
        <td><input type="number" min="0" step="1" class="catalog-vente" data-id="${p.id}" data-taille="${t}" value="${p.prix[t].vente || 0}"></td>
        <td><input type="number" min="0" step="1" class="catalog-seuil" data-id="${p.id}" data-taille="${t}" value="${p.seuil[t] || 0}"></td>
      </tr>`);
    });
  });

  document.getElementById("catalogTbl").innerHTML = `
    <thead><tr><th>Produit</th><th>Matière</th><th>Format</th><th>Prix d'achat (FCFA)</th><th>Prix de vente (FCFA)</th><th>Seuil d'alerte</th></tr></thead>
    <tbody>${rowsHtml.join("")}</tbody>`;

  document.getElementById("fbConfig").value = state.settings.firebaseConfig || "";
  document.getElementById("fbCode").value = state.settings.syncCode || "";
}

/* ---------------------------------------------------------------------- */
/* MODAL HELPER */
/* ---------------------------------------------------------------------- */

function openModal(html) {
  document.getElementById("modalBox").innerHTML = html;
  document.getElementById("modalBackdrop").classList.add("open");
}
function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
  document.getElementById("modalBox").innerHTML = "";
}

/* ---------------------------------------------------------------------- */
/* ÉVÉNEMENTS GLOBAUX */
/* ---------------------------------------------------------------------- */

function bindEvents() {
  document.getElementById("sideNav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (btn) showPage(btn.dataset.page);
  });
  document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.goto)));

  document.getElementById("burgerBtn").onclick = () => document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });

  document.getElementById("quickAddBtn").onclick = () => { showPage("prospection"); resetProspectForm(); document.getElementById("pf-entreprise").focus(); };
  document.getElementById("quickExportBtn").onclick = exportJSON;

  /* ---- Prospection ---- */
  document.getElementById("pkgTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".pkg-tab");
    if (!btn) return;
    pkgActiveCat = btn.dataset.cat;
    document.querySelectorAll(".pkg-tab").forEach(t => t.classList.toggle("active", t === btn));
    renderPkgPicker();
  });
  document.getElementById("pkgGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".pkg-item");
    if (!btn) return;
    const id = btn.dataset.id;
    if (pkgLines.some(l => l.produitId === id)) { toast("Ce produit est déjà dans la liste."); return; }
    pkgLines.push({ produitId: id, quantite: 1, taille: "Petit" });
    renderPkgPicker();
    renderPkgLines();
  });
  document.getElementById("pkgLines").addEventListener("input", (e) => {
    const qtyInput = e.target.closest(".pkgline-qty");
    if (qtyInput) pkgLines[Number(qtyInput.dataset.idx)].quantite = Number(qtyInput.value) || 1;
  });
  document.getElementById("pkgLines").addEventListener("change", (e) => {
    const tailleSel = e.target.closest(".pkgline-taille");
    if (tailleSel) pkgLines[Number(tailleSel.dataset.idx)].taille = tailleSel.value;
  });
  document.getElementById("pkgLines").addEventListener("click", (e) => {
    const delBtn = e.target.closest(".pkgline-del");
    if (delBtn) {
      pkgLines.splice(Number(delBtn.dataset.idx), 1);
      renderPkgPicker();
      renderPkgLines();
    }
  });

  document.getElementById("prospectForm").addEventListener("submit", (e) => { e.preventDefault(); saveProspectFromForm(); });
  document.getElementById("pf-cancel").onclick = resetProspectForm;

  document.getElementById("pfilter-search").addEventListener("input", renderProspectsTable);
  document.getElementById("pfilter-secteur").addEventListener("change", renderProspectsTable);
  document.getElementById("pfilter-statut").addEventListener("change", renderProspectsTable);

  document.getElementById("prospectsTbl").addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-prospect");
    const delBtn = e.target.closest(".del-prospect");
    if (editBtn) { const p = state.prospects.find(p => p.id === editBtn.dataset.id); if (p) fillProspectForm(p); }
    if (delBtn) {
      if (confirm("Supprimer cette fiche prospect ?")) {
        state.prospects = state.prospects.filter(p => p.id !== delBtn.dataset.id);
        saveState();
        toast("Fiche supprimée.");
      }
    }
  });

  /* ---- Analyse ---- */
  document.getElementById("afilter-secteur").addEventListener("change", renderAnalyse);
  document.getElementById("afilter-cat").addEventListener("change", renderAnalyse);

  /* ---- Stock ---- */
  document.getElementById("sfilter-search").addEventListener("input", renderStock);
  document.getElementById("stockReceptionBtn").onclick = () => openStockModal("entree");
  document.getElementById("stockSortieBtn").onclick = () => openStockModal("vente");
  document.getElementById("movementsTbl").addEventListener("click", (e) => {
    const btn = e.target.closest(".del-mvt");
    if (btn && confirm("Supprimer ce mouvement ? (la transaction de caisse liée ne sera pas supprimée automatiquement)")) {
      state.stockMouvements = state.stockMouvements.filter(m => m.id !== btn.dataset.id);
      saveState();
    }
  });

  /* ---- Budget ---- */
  document.getElementById("budgetMode").addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    budgetMode = btn.dataset.mode;
    document.querySelectorAll("#budgetMode .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
    document.getElementById("bf-qty-wrap").classList.toggle("hidden", budgetMode !== "qty");
    document.getElementById("bf-budget-wrap").classList.toggle("hidden", budgetMode !== "budget");
  });
  document.getElementById("budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const sim = calcBudget();
    if (!sim) return;
    state.simulations.push(sim);
    saveState();
    renderBudgetResult(sim);
    toast("Simulation enregistrée.");
  });
  document.getElementById("simTbl").addEventListener("click", (e) => {
    const btn = e.target.closest(".del-sim");
    if (btn && confirm("Supprimer cette simulation ?")) {
      state.simulations = state.simulations.filter(s => s.id !== btn.dataset.id);
      saveState();
    }
  });

  /* ---- Caisse ---- */
  document.getElementById("txAddBtn").onclick = openTxModal;
  document.getElementById("cfilter-type").addEventListener("change", renderCaisse);
  document.getElementById("txTbl").addEventListener("click", (e) => {
    const btn = e.target.closest(".del-tx");
    if (btn && confirm("Supprimer cette transaction ?")) {
      state.caisse = state.caisse.filter(t => t.id !== btn.dataset.id);
      saveState();
    }
  });

  /* ---- Réglages ---- */
  document.getElementById("catfilter-search").addEventListener("input", renderReglages);
  document.getElementById("catalogTbl").addEventListener("change", (e) => {
    const achatInput = e.target.closest(".catalog-achat");
    const venteInput = e.target.closest(".catalog-vente");
    const seuilInput = e.target.closest(".catalog-seuil");
    if (achatInput) { const p = findProduit(achatInput.dataset.id); if (p) { p.prix[achatInput.dataset.taille].achat = Number(achatInput.value) || 0; saveState(); } }
    if (venteInput) { const p = findProduit(venteInput.dataset.id); if (p) { p.prix[venteInput.dataset.taille].vente = Number(venteInput.value) || 0; saveState(); } }
    if (seuilInput) { const p = findProduit(seuilInput.dataset.id); if (p) { p.seuil[seuilInput.dataset.taille] = Number(seuilInput.value) || 0; saveState(); } }
  });

  document.getElementById("exportBtn").onclick = exportJSON;
  document.getElementById("importInput").addEventListener("change", (e) => {
    if (e.target.files[0]) importJSONFile(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("resetBtn").onclick = () => {
    if (confirm("Cette action effacera définitivement toutes les données locales. Continuer ?")) {
      localStorage.removeItem(LS_KEY);
      state = defaultState();
      saveState();
      toast("Données réinitialisées.");
    }
  };
  document.getElementById("fsConnectBtn").onclick = connectFileHandle;
  document.getElementById("fbConnectBtn").onclick = connectFirebase;
  document.getElementById("fbDisconnectBtn").onclick = disconnectFirebase;
}

/* ---------------------------------------------------------------------- */
/* INIT */
/* ---------------------------------------------------------------------- */

async function init() {
  loadState();
  bindEvents();
  await restoreFileHandle();
  updateSyncLabel();
  document.getElementById("pf-date").value = todayInput();
  resetProspectForm();
  showPage("dashboard");

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
