/**
 * Data access layer for the TSM product catalog.
 * Loads data/products.json (relative path, works from any repo subfolder on GitHub Pages)
 * and exposes small helpers used by app.js.
 */
const TSMProducts = (() => {
  const DATA_URL = "./data/products.json";
  let cache = null;

  async function loadAll() {
    if (cache) return cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error(`Gagal memuat data produk (${res.status})`);
    }
    cache = await res.json();
    return cache;
  }

  function getCategories(products) {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }

  function getVoltages(products) {
    const set = new Set(products.map((p) => p.voltage).filter(Boolean));
    return Array.from(set).sort();
  }

  function filterProducts(products, { search = "", categories = [], voltage = "" } = {}) {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory = categories.length === 0 || categories.includes(p.category);
      const matchesVoltage = !voltage || p.voltage === voltage;
      return matchesSearch && matchesCategory && matchesVoltage;
    });
  }

  function findById(products, id) {
    return products.find((p) => p.id === id) || null;
  }

  return { loadAll, getCategories, getVoltages, filterProducts, findById };
})();
