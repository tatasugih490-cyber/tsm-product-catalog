/**
 * TSM Katalog Produk Digital — UI logic
 * No frameworks, no external dependencies. Works as a static site (GitHub Pages ready).
 */
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "628111266960";
  const MAX_COMPARE = 3;

  const QUICK_FILTERS = [
    { label: "Semua", categories: [] },
    { label: "Emas", categories: ["Peralatan Pemurnian Emas"] },
    { label: "Perak", categories: ["Peralatan Pemurnian Perak"] },
    { label: "Electrowinning", categories: ["Peralatan Electrowinning"] },
    { label: "Granulator", categories: ["Mesin Granulator"] },
    { label: "Pengecoran", categories: ["Mesin Pengecoran Ingot"] },
    { label: "Peleburan", categories: ["Tungku Peleburan"] },
    { label: "Pengolahan Emisi", categories: ["Sistem Pengolahan NOx", "Sistem Pengolahan Kabut Asam"] },
    { label: "Tembaga", categories: ["Peralatan Pemurnian Tembaga"] },
    { label: "Sistem Kustom", categories: ["Sistem Pemurnian Basah", "Sistem Pemurnian Platinum dan Palladium", "Peralatan Atomisasi"] },
  ];

  const state = {
    products: [],
    filtered: [],
    search: "",
    categories: [], // empty = semua kategori
    voltage: "",
    activeQuickFilter: 0,
    compareIds: [],
  };

  // ---------- DOM refs ----------
  const el = {
    quickFilters: document.getElementById("quickFilters"),
    searchInput: document.getElementById("searchInput"),
    categorySelect: document.getElementById("categorySelect"),
    voltageSelect: document.getElementById("voltageSelect"),
    resetBtn: document.getElementById("resetFilters"),
    resultsCount: document.getElementById("resultsCount"),
    productGrid: document.getElementById("productGrid"),
    yearSpan: document.getElementById("footerYear"),
    modalOverlay: document.getElementById("productModal"),
    modalContent: document.getElementById("modalContent"),
    modalClose: document.getElementById("modalClose"),
    compareIndicator: document.getElementById("compareIndicator"),
    compareIndicatorCount: document.getElementById("compareIndicatorCount"),
    compareBar: document.getElementById("compareBar"),
    compareBarItems: document.getElementById("compareBarItems"),
    compareBarCount: document.getElementById("compareBarCount"),
    compareViewBtn: document.getElementById("compareViewBtn"),
    compareClearBtn: document.getElementById("compareClearBtn"),
    compareModal: document.getElementById("compareModal"),
    compareModalClose: document.getElementById("compareModalClose"),
    compareTableWrap: document.getElementById("compareTableWrap"),
  };

  // ---------- Helpers ----------
  function waLink(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function productWaMessage(p) {
    return `Halo PT Tata Sugih Mineral, saya tertarik dengan ${p.name} model ${p.model}. Mohon informasi dan penawarannya.`;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // ---------- Quick filter chips ----------
  function renderQuickFilters() {
    el.quickFilters.innerHTML = QUICK_FILTERS.map(
      (qf, i) => `<button type="button" class="chip${i === state.activeQuickFilter ? " is-active" : ""}" data-index="${i}">${escapeHtml(qf.label)}</button>`
    ).join("");
  }

  function syncQuickFilterFromCategories() {
    // Highlight a chip only if its category set matches the current filter exactly.
    const current = state.categories.slice().sort().join("|");
    let matchIndex = state.categories.length === 0 ? 0 : -1;
    QUICK_FILTERS.forEach((qf, i) => {
      if (qf.categories.slice().sort().join("|") === current) matchIndex = i;
    });
    state.activeQuickFilter = matchIndex;
    el.quickFilters.querySelectorAll(".chip").forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.getAttribute("data-index")) === matchIndex);
    });
  }

  function initQuickFilters() {
    el.quickFilters.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-index"));
      const qf = QUICK_FILTERS[idx];
      state.categories = qf.categories.slice();
      state.activeQuickFilter = idx;
      el.categorySelect.value = qf.categories.length === 1 ? qf.categories[0] : "";
      syncQuickFilterFromCategories();
      applyFilters();
    });
  }

  function populateSelect(select, values, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  // ---------- Filters ----------
  function applyFilters() {
    state.filtered = TSMProducts.filterProducts(state.products, {
      search: state.search,
      categories: state.categories,
      voltage: state.voltage,
    });
    renderProductGrid();
    renderResultsMeta();
  }

  function renderResultsMeta() {
    el.resultsCount.textContent = `${state.filtered.length} produk ditemukan`;
  }

  function initFilters() {
    el.searchInput.addEventListener(
      "input",
      debounce((e) => {
        state.search = e.target.value;
        applyFilters();
      }, 200)
    );
    el.categorySelect.addEventListener("change", (e) => {
      state.categories = e.target.value ? [e.target.value] : [];
      syncQuickFilterFromCategories();
      applyFilters();
    });
    el.voltageSelect.addEventListener("change", (e) => {
      state.voltage = e.target.value;
      applyFilters();
    });
    el.resetBtn.addEventListener("click", () => {
      state.search = "";
      state.categories = [];
      state.voltage = "";
      el.searchInput.value = "";
      el.categorySelect.value = "";
      el.voltageSelect.value = "";
      syncQuickFilterFromCategories();
      applyFilters();
    });
  }

  // ---------- Product grid ----------
  function productCardTemplate(p) {
    const isComparing = state.compareIds.includes(p.id);
    const compareDisabled = !isComparing && state.compareIds.length >= MAX_COMPARE;
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-media">
          ${p.representativeImage ? '<span class="badge badge-representative">Gambar representatif</span>' : ""}
          ${!p.imageAvailable ? '<span class="badge">Belum tersedia</span>' : ""}
          <img src="${p.image}" alt="${escapeHtml(p.name)} - ${escapeHtml(p.model)}" loading="lazy" width="400" height="300">
        </div>
        <div class="product-body">
          <span class="product-category">${escapeHtml(p.category)}</span>
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <span class="product-model">${escapeHtml(p.model)}</span>
          <div class="product-specs">
            <div class="spec-line"><span>Kapasitas:</span> ${escapeHtml(p.capacity)}</div>
            <div class="spec-line"><span>Tegangan:</span> ${escapeHtml(p.voltage)}</div>
            <div class="spec-line"><span>Estimasi Produksi:</span> ${escapeHtml(p.productionTime)}</div>
          </div>
          <div class="product-actions">
            <button type="button" class="btn btn-outline btn-detail" data-id="${p.id}">Lihat Detail</button>
            <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${waLink(productWaMessage(p))}">Tanyakan</a>
          </div>
          <label class="compare-toggle">
            <input type="checkbox" class="compare-checkbox" data-id="${p.id}" ${isComparing ? "checked" : ""} ${compareDisabled ? "disabled" : ""}>
            Bandingkan
          </label>
        </div>
      </article>
    `;
  }

  function renderProductGrid() {
    if (state.filtered.length === 0) {
      el.productGrid.innerHTML = `
        <div class="empty-state">
          <h3>Produk tidak ditemukan</h3>
          <p>Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh produk.</p>
        </div>
      `;
      return;
    }
    el.productGrid.innerHTML = state.filtered.map(productCardTemplate).join("");
  }

  function initProductGridEvents() {
    el.productGrid.addEventListener("click", (e) => {
      const detailBtn = e.target.closest(".btn-detail");
      if (detailBtn) openModal(detailBtn.getAttribute("data-id"));
    });
    el.productGrid.addEventListener("change", (e) => {
      const cb = e.target.closest(".compare-checkbox");
      if (cb) toggleCompare(cb.getAttribute("data-id"), cb.checked);
    });
  }

  // ---------- Product detail modal ----------
  let lastFocusedEl = null;

  function specRow(label, value) {
    return `<tr><th scope="row">${label}</th><td>${escapeHtml(value)}</td></tr>`;
  }

  function openModal(id) {
    const p = TSMProducts.findById(state.products, id);
    if (!p) return;
    lastFocusedEl = document.activeElement;

    el.modalContent.innerHTML = `
      <div class="modal-media">
        <img src="${p.image}" alt="${escapeHtml(p.name)} - ${escapeHtml(p.model)}" loading="lazy">
      </div>
      <div class="modal-details">
        <h3 id="modalTitle">${escapeHtml(p.name)}</h3>
        <p class="modal-model">${escapeHtml(p.model)} &middot; ${escapeHtml(p.category)}</p>
        ${p.representativeImage ? '<span class="badge badge-representative" style="position:static;display:inline-block;margin-bottom:10px;">Gambar representatif</span>' : ""}
        <table class="spec-table">
          ${specRow("Fungsi Utama", p.function)}
          ${specRow("Kapasitas", p.capacity)}
          ${specRow("Tegangan", p.voltage)}
          ${specRow("Daya", p.power)}
          ${specRow("Dimensi", p.dimensions)}
          ${specRow("Berat", p.weight)}
          ${specRow("Estimasi Produksi", p.productionTime)}
          ${specRow("Keterangan", p.description)}
        </table>
        <div class="modal-note">
          Spesifikasi dapat disesuaikan berdasarkan kebutuhan proyek. Kapasitas, konfigurasi, waktu produksi, dan kelengkapan peralatan akan dikonfirmasi kembali sebelum penerbitan penawaran resmi.
        </div>
        <a class="btn btn-whatsapp btn-block" target="_blank" rel="noopener" href="${waLink(productWaMessage(p))}">Konsultasi via WhatsApp</a>
      </div>
    `;

    openOverlay(el.modalOverlay);
    el.modalClose.focus();
  }

  function closeModal() {
    closeOverlay(el.modalOverlay);
  }

  function openOverlay(overlay) {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay(overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (!anyOverlayOpen()) document.body.style.overflow = "";
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function anyOverlayOpen() {
    return [el.modalOverlay, el.compareModal].some((o) => o.classList.contains("is-open"));
  }

  function initModal() {
    el.modalClose.addEventListener("click", closeModal);
    el.modalOverlay.addEventListener("click", (e) => {
      if (e.target === el.modalOverlay) closeModal();
    });
    el.compareModalClose.addEventListener("click", closeCompareModal);
    el.compareModal.addEventListener("click", (e) => {
      if (e.target === el.compareModal) closeCompareModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (el.compareModal.classList.contains("is-open")) closeCompareModal();
      else if (el.modalOverlay.classList.contains("is-open")) closeModal();
    });
  }

  // ---------- Compare ----------
  function toggleCompare(id, checked) {
    if (checked) {
      if (state.compareIds.length >= MAX_COMPARE) return;
      state.compareIds.push(id);
    } else {
      state.compareIds = state.compareIds.filter((x) => x !== id);
    }
    renderProductGrid();
    renderCompareBar();
    renderCompareIndicator();
  }

  function removeCompare(id) {
    state.compareIds = state.compareIds.filter((x) => x !== id);
    renderProductGrid();
    renderCompareBar();
    renderCompareIndicator();
    if (el.compareModal.classList.contains("is-open")) renderCompareTable();
  }

  function renderCompareIndicator() {
    const count = state.compareIds.length;
    el.compareIndicatorCount.textContent = String(count);
    el.compareIndicator.classList.toggle("has-items", count > 0);
  }

  function renderCompareBar() {
    const count = state.compareIds.length;
    el.compareBar.classList.toggle("is-visible", count > 0);
    el.compareBarCount.textContent = `${count}/${MAX_COMPARE} dipilih`;
    el.compareBarItems.innerHTML = state.compareIds
      .map((id) => {
        const p = TSMProducts.findById(state.products, id);
        if (!p) return "";
        return `<span class="compare-chip">${escapeHtml(p.model)}<button type="button" data-id="${id}" aria-label="Hapus ${escapeHtml(p.model)} dari perbandingan">&times;</button></span>`;
      })
      .join("");
  }

  function compareRow(label, getValue) {
    return `<tr><th scope="row">${label}</th>${state.compareIds
      .map((id) => `<td>${escapeHtml(getValue(TSMProducts.findById(state.products, id)))}</td>`)
      .join("")}</tr>`;
  }

  function renderCompareTable() {
    if (state.compareIds.length === 0) {
      el.compareTableWrap.innerHTML = `
        <div class="compare-empty">
          Pilih hingga 3 produk melalui tombol "Bandingkan" pada katalog untuk melihat perbandingan di sini.
        </div>
      `;
      return;
    }
    const products = state.compareIds.map((id) => TSMProducts.findById(state.products, id));
    el.compareTableWrap.innerHTML = `
      <table class="compare-table">
        <tbody>
          <tr>
            <th scope="row">Gambar</th>
            ${products.map((p) => `<td><img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy"></td>`).join("")}
          </tr>
          <tr>
            <th scope="row">Nama Produk</th>
            ${products.map((p) => `<td>${escapeHtml(p.name)}</td>`).join("")}
          </tr>
          ${compareRow("Model", (p) => p.model)}
          ${compareRow("Kategori", (p) => p.category)}
          ${compareRow("Kapasitas", (p) => p.capacity)}
          ${compareRow("Tegangan", (p) => p.voltage)}
          ${compareRow("Daya", (p) => p.power)}
          ${compareRow("Dimensi", (p) => p.dimensions)}
          ${compareRow("Berat", (p) => p.weight)}
          ${compareRow("Estimasi Produksi", (p) => p.productionTime)}
          <tr>
            <th scope="row">Aksi</th>
            ${products
              .map(
                (p) => `<td>
                  <a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waLink(productWaMessage(p))}">Konsultasi WhatsApp</a>
                  <br>
                  <button type="button" class="compare-remove" data-id="${p.id}">Hapus</button>
                </td>`
              )
              .join("")}
          </tr>
        </tbody>
      </table>
    `;
  }

  function openCompareModal() {
    lastFocusedEl = document.activeElement;
    renderCompareTable();
    openOverlay(el.compareModal);
    el.compareModalClose.focus();
  }

  function closeCompareModal() {
    closeOverlay(el.compareModal);
  }

  function initCompareEvents() {
    el.compareBarItems.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (btn) removeCompare(btn.getAttribute("data-id"));
    });
    el.compareTableWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".compare-remove");
      if (btn) removeCompare(btn.getAttribute("data-id"));
    });
    el.compareClearBtn.addEventListener("click", () => {
      state.compareIds = [];
      renderProductGrid();
      renderCompareBar();
      renderCompareIndicator();
      if (el.compareModal.classList.contains("is-open")) renderCompareTable();
    });
    el.compareViewBtn.addEventListener("click", openCompareModal);
    el.compareIndicator.addEventListener("click", openCompareModal);
  }

  // ---------- Init ----------
  async function init() {
    if (el.yearSpan) el.yearSpan.textContent = new Date().getFullYear();
    initModal();
    initCompareEvents();
    initProductGridEvents();
    initQuickFilters();

    try {
      state.products = await TSMProducts.loadAll();
      state.filtered = state.products;

      const categories = TSMProducts.getCategories(state.products);
      const voltages = TSMProducts.getVoltages(state.products);

      renderQuickFilters();
      populateSelect(el.categorySelect, categories, "Semua Kategori");
      populateSelect(el.voltageSelect, voltages, "Semua Tegangan");

      initFilters();
      renderProductGrid();
      renderResultsMeta();
      renderCompareBar();
      renderCompareIndicator();
    } catch (err) {
      el.productGrid.innerHTML = `
        <div class="empty-state">
          <h3>Gagal memuat data produk</h3>
          <p>Silakan jalankan situs ini melalui local server (lihat README.md) lalu muat ulang halaman.</p>
        </div>
      `;
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
