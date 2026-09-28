// ===================================================================
// WISHLIST ARCHIVE — MONOCHROMATIC JAVASCRIPT ENGINE
// ===================================================================

const STORAGE_KEY = "wishlist_archive_catalog_v1";
const THEME_KEY = "wishlist_theme_v1";

// State
let items = [];
let activeCategory = "ALL";
let searchQuery = "";
let sortBy = "default";
let priorityFilter = "all";
let currentView = "grid";
let currentModalItemIndex = -1;
let filteredItems = [];

// DOM Elements
const catalogGrid = document.getElementById("catalogGrid");
const categoryPillsContainer = document.getElementById("categoryPillsContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const prioritySelect = document.getElementById("priorityFilter");
const viewButtons = document.querySelectorAll(".view-btn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");

// Stats Elements
const statTotalItems = document.getElementById("statTotalItems");
const statTotalValue = document.getElementById("statTotalValue");
const statHighPriority = document.getElementById("statHighPriority");
const statCategoriesCount = document.getElementById("statCategoriesCount");
const headerItemCount = document.getElementById("headerItemCount");

// Modal Elements
const itemModalOverlay = document.getElementById("itemModalOverlay");
const itemModalCard = document.getElementById("itemModalCard");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalPrevBtn = document.getElementById("modalPrevBtn");
const modalNextBtn = document.getElementById("modalNextBtn");
const modalViewSection = document.getElementById("modalViewSection");
const modalEditSection = document.getElementById("modalEditSection");
const modalEditBtn = document.getElementById("modalEditBtn");
const btnSaveEdit = document.getElementById("btnSaveEdit");
const btnCancelEdit = document.getElementById("btnCancelEdit");

// Add Item Modal Elements
const addItemModalOverlay = document.getElementById("addItemModalOverlay");
const btnAddNewItem = document.getElementById("btnAddNewItem");
const closeAddItemModalBtn = document.getElementById("closeAddItemModalBtn");
const cancelAddItemBtn = document.getElementById("cancelAddItemBtn");
const addNewItemForm = document.getElementById("addNewItemForm");

// Data Sync Modal
const dataSyncModalOverlay = document.getElementById("dataSyncModalOverlay");
const btnExportImport = document.getElementById("btnExportImport");
const closeDataModalBtn = document.getElementById("closeDataModalBtn");
const btnExportJSON = document.getElementById("btnExportJSON");
const btnExportMarkdown = document.getElementById("btnExportMarkdown");
const btnTriggerImport = document.getElementById("btnTriggerImport");
const importFileInput = document.getElementById("importFileInput");
const btnQuickReset = document.getElementById("btnQuickReset");

// Toast Container
const toastContainer = document.getElementById("toastContainer");

// Initialize
function init() {
  loadData();
  setupTheme();
  setupEventListeners();
  render();
  feather.replace();
}

// Load data from localStorage or fallback to INITIAL_WISHLIST
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      items = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse local storage, loading defaults", e);
      items = [...window.INITIAL_WISHLIST];
    }
  } else {
    items = [...window.INITIAL_WISHLIST];
  }

  // Ensure default fields
  items = items.map((item, idx) => ({
    id: item.asin || `item-${idx}`,
    asin: item.asin || `item-${idx}`,
    title: item.title || "Untitled Item",
    price: item.price || "$0.00",
    price_raw: typeof item.price_raw === "number" ? item.price_raw : extractPrice(item.price),
    image: item.image || "https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png",
    product_url: item.product_url || (item.asin ? `https://www.amazon.com/dp/${item.asin}` : "#"),
    category: item.category || "General",
    tags: Array.isArray(item.tags) ? item.tags : [],
    description: item.description || "No description added yet.",
    notes: item.notes || "",
    priority: item.priority || "Medium",
    status: item.status || "Wanted"
  }));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  updateStats();
}

function extractPrice(priceStr) {
  if (!priceStr) return 0;
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

// Render everything
function render() {
  filterAndSortItems();
  renderCategories();
  renderGrid();
  updateStats();
  feather.replace();
}

// Filter and Sort
function filterAndSortItems() {
  filteredItems = items.filter(item => {
    // Category filter
    if (activeCategory !== "ALL" && item.category !== activeCategory) {
      return false;
    }
    // Priority filter
    if (priorityFilter !== "all" && item.priority !== priorityFilter) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchNotes = (item.notes || "").toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
      const matchAsin = item.asin.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchNotes || matchCategory || matchTags || matchAsin;
    }
    return true;
  });

  // Sort
  if (sortBy === "price-asc") {
    filteredItems.sort((a, b) => (a.price_raw || 0) - (b.price_raw || 0));
  } else if (sortBy === "price-desc") {
    filteredItems.sort((a, b) => (b.price_raw || 0) - (a.price_raw || 0));
  } else if (sortBy === "priority") {
    const pWeight = { "High": 3, "Medium": 2, "Low": 1 };
    filteredItems.sort((a, b) => (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0));
  } else if (sortBy === "name-asc") {
    filteredItems.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "name-desc") {
    filteredItems.sort((a, b) => b.title.localeCompare(a.title));
  }
}

// Render Category Filter Pills
function renderCategories() {
  const catCounts = {};
  items.forEach(item => {
    catCounts[item.category] = (catCounts[item.category] || 0) + 1;
  });

  const categories = Object.keys(catCounts).sort();

  let html = `
    <button class="cat-pill ${activeCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
      ALL <span class="count">${items.length}</span>
    </button>
  `;

  categories.forEach(cat => {
    html += `
      <button class="cat-pill ${activeCategory === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
        ${escapeHtml(cat)} <span class="count">${catCounts[cat]}</span>
      </button>
    `;
  });

  html += `
    <button class="cat-pill add-cat-btn" id="btnCustomCategory" title="Create Custom Category">
      + CUSTOM CATEGORY
    </button>
  `;

  categoryPillsContainer.innerHTML = html;

  // Event Listeners for category pills
  categoryPillsContainer.querySelectorAll(".cat-pill[data-cat]").forEach(pill => {
    pill.addEventListener("click", () => {
      activeCategory = pill.getAttribute("data-cat");
      render();
    });
  });

  document.getElementById("btnCustomCategory")?.addEventListener("click", promptNewCategory);
}

function promptNewCategory() {
  const newCat = prompt("Enter a new category name (e.g. 'Audio Gear', 'Keyboards', 'Books'):");
  if (newCat && newCat.trim()) {
    const trimmed = newCat.trim();
    showToast(`Category "${trimmed}" ready. Assign items to it via the item popout!`);
    activeCategory = trimmed;
    render();
  }
}

// Render Products Grid
function renderGrid() {
  catalogGrid.className = `catalog-grid view-${currentView}`;

  if (filteredItems.length === 0) {
    catalogGrid.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-title">NO MATCHING ITEMS FOUND</h3>
        <p class="empty-sub">Try adjusting your search query, priority filter, or category selection.</p>
      </div>
    `;
    return;
  }

  let html = "";
  filteredItems.forEach((item, index) => {
    const displayPrice = item.price || (item.price_raw ? `$${item.price_raw.toFixed(2)}` : "—");
    
    html += `
      <article class="product-card" data-asin="${item.asin}" data-filtered-idx="${index}">
        <div class="card-image-wrap">
          <span class="card-badge-priority">${escapeHtml(item.priority || 'MEDIUM')}</span>
          ${item.status === 'Purchased' ? '<span class="card-badge-status">PURCHASED</span>' : ''}
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="card-img" loading="lazy" onerror="this.src='https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png'">
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="card-category">${escapeHtml(item.category)}</span>
            <span class="card-price">${escapeHtml(displayPrice)}</span>
          </div>
          <div class="card-main-info">
            <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            <p class="card-description">${escapeHtml(item.description)}</p>
          </div>
          <div class="card-tags">
            ${item.tags.slice(0, 3).map(tag => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join('')}
            ${item.tags.length > 3 ? `<span class="tag-pill">+${item.tags.length - 3}</span>` : ''}
          </div>
        </div>
        <div class="card-footer-action">
          <span>DETAILS & DESCRIPTION</span>
          <span>↗</span>
        </div>
      </article>
    `;
  });

  catalogGrid.innerHTML = html;

  // Add click listeners to cards
  catalogGrid.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      const idx = parseInt(card.getAttribute("data-filtered-idx"), 10);
      openItemModal(idx);
    });
  });
}

// Update Top Statistics
function updateStats() {
  const total = items.length;
  const totalVal = items.reduce((sum, item) => sum + (item.price_raw || 0), 0);
  const highPriority = items.filter(i => i.priority === "High").length;
  const categories = new Set(items.map(i => i.category)).size;

  statTotalItems.textContent = total;
  statTotalValue.textContent = `$${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  statHighPriority.textContent = highPriority;
  statCategoriesCount.textContent = categories;
  headerItemCount.textContent = `${filteredItems.length} OF ${total} ITEMS`;
}

// Modal Logic
function openItemModal(filteredIndex) {
  if (filteredIndex < 0 || filteredIndex >= filteredItems.length) return;
  currentModalItemIndex = filteredIndex;
  const item = filteredItems[filteredIndex];

  // Set Modal View Mode Content
  document.getElementById("modalCategoryBreadcrumb").textContent = item.category.toUpperCase();
  document.getElementById("modalAsinBreadcrumb").textContent = item.asin;
  document.getElementById("modalImage").src = item.image;
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalPrice").textContent = item.price || (item.price_raw ? `$${item.price_raw.toFixed(2)}` : "—");
  document.getElementById("modalCategoryVal").textContent = item.category;
  document.getElementById("modalAsinVal").textContent = item.asin;
  document.getElementById("modalDescriptionText").textContent = item.description || "No description provided.";
  
  const notesSec = document.getElementById("modalNotesSection");
  if (item.notes && item.notes.trim()) {
    notesSec.style.display = "block";
    document.getElementById("modalNotesText").textContent = item.notes;
  } else {
    notesSec.style.display = "none";
  }

  // Priority & Status Badges
  const priorityBadge = document.getElementById("modalPriorityBadge");
  priorityBadge.textContent = (item.priority || "MEDIUM").toUpperCase();
  
  const statusBadge = document.getElementById("modalStatusBadge");
  statusBadge.textContent = (item.status || "WANTED").toUpperCase();

  // Tags
  const tagsContainer = document.getElementById("modalTagsContainer");
  tagsContainer.innerHTML = (item.tags || []).map(t => `<span class="tag-pill font-mono">#${escapeHtml(t)}</span>`).join('') || '<span style="color:var(--text-tertiary); font-size:0.8rem;">No tags</span>';

  // Amazon Link
  const amazonLink = document.getElementById("modalAmazonLink");
  amazonLink.href = item.product_url || `https://www.amazon.com/dp/${item.asin}`;

  // Switch to View Mode
  modalViewSection.style.display = "block";
  modalEditSection.style.display = "none";

  itemModalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
  feather.replace();
}

function closeItemModal() {
  itemModalOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

function nextModalItem() {
  if (filteredItems.length === 0) return;
  const nextIdx = (currentModalItemIndex + 1) % filteredItems.length;
  openItemModal(nextIdx);
}

function prevModalItem() {
  if (filteredItems.length === 0) return;
  const prevIdx = (currentModalItemIndex - 1 + filteredItems.length) % filteredItems.length;
  openItemModal(prevIdx);
}

// Toggle Edit Mode inside Modal
function enterModalEditMode() {
  const item = filteredItems[currentModalItemIndex];
  if (!item) return;

  // Populate categories in select
  const allCategories = Array.from(new Set(items.map(i => i.category))).sort();
  const select = document.getElementById("editCategorySelect");
  select.innerHTML = allCategories.map(c => `<option value="${escapeHtml(c)}" ${c === item.category ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');

  document.getElementById("editTitleInput").value = item.title || "";
  document.getElementById("editPriceInput").value = item.price || (item.price_raw ? `$${item.price_raw.toFixed(2)}` : "");
  document.getElementById("editPrioritySelect").value = item.priority || "Medium";
  document.getElementById("editStatusSelect").value = item.status || "Wanted";
  document.getElementById("editDescInput").value = item.description || "";
  document.getElementById("editNotesInput").value = item.notes || "";
  document.getElementById("editTagsInput").value = (item.tags || []).join(", ");
  document.getElementById("editImageInput").value = item.image || "";

  modalViewSection.style.display = "none";
  modalEditSection.style.display = "flex";
  feather.replace();
}

function saveModalEdit() {
  const item = filteredItems[currentModalItemIndex];
  if (!item) return;

  const realIndex = items.findIndex(i => i.asin === item.asin);
  if (realIndex === -1) return;

  const priceStr = document.getElementById("editPriceInput").value.trim();
  const priceRaw = extractPrice(priceStr);

  items[realIndex].title = document.getElementById("editTitleInput").value.trim() || item.title;
  items[realIndex].price = priceStr || (priceRaw > 0 ? `$${priceRaw.toFixed(2)}` : "$0.00");
  items[realIndex].price_raw = priceRaw;
  items[realIndex].category = document.getElementById("editCategorySelect").value;
  items[realIndex].priority = document.getElementById("editPrioritySelect").value;
  items[realIndex].status = document.getElementById("editStatusSelect").value;
  items[realIndex].description = document.getElementById("editDescInput").value.trim();
  items[realIndex].notes = document.getElementById("editNotesInput").value.trim();
  items[realIndex].image = document.getElementById("editImageInput").value.trim() || item.image;
  
  const tagsStr = document.getElementById("editTagsInput").value;
  items[realIndex].tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);

  saveData();
  render();
  openItemModal(currentModalItemIndex);
  showToast("Item details updated successfully!");
}

function cancelModalEdit() {
  modalViewSection.style.display = "block";
  modalEditSection.style.display = "none";
}

// Add New Item
function openAddItemModal() {
  const allCategories = Array.from(new Set(items.map(i => i.category))).sort();
  const select = document.getElementById("newCategorySelect");
  select.innerHTML = allCategories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  addItemModalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAddItemModal() {
  addItemModalOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
  addNewItemForm.reset();
}

function handleAddNewItem(e) {
  e.preventDefault();
  const title = document.getElementById("newTitleInput").value.trim();
  const priceStr = document.getElementById("newPriceInput").value.trim();
  const priceRaw = extractPrice(priceStr);
  const category = document.getElementById("newCategorySelect").value;
  const priority = document.getElementById("newPrioritySelect").value;
  const url = document.getElementById("newUrlInput").value.trim();
  const image = document.getElementById("newImageInput").value.trim() || "https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png";
  const description = document.getElementById("newDescInput").value.trim() || "Custom added item.";
  const tagsStr = document.getElementById("newTagsInput").value;
  const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);

  let asin = "CUSTOM_" + Date.now();
  if (url.includes("/dp/")) {
    const match = url.match(/\/dp\/([A-Z0-9]+)/i);
    if (match) asin = match[1];
  }

  const newItem = {
    id: asin,
    asin: asin,
    title: title,
    price: priceStr || (priceRaw > 0 ? `$${priceRaw.toFixed(2)}` : "$0.00"),
    price_raw: priceRaw,
    image: image,
    product_url: url || `https://www.amazon.com/dp/${asin}`,
    category: category,
    tags: tags,
    description: description,
    notes: "",
    priority: priority,
    status: "Wanted"
  };

  items.unshift(newItem);
  saveData();
  closeAddItemModal();
  render();
  showToast(`Added "${newItem.title}" to catalog!`);
}

// Data Sync (Export / Import / Reset)
function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `wishlist_archive_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("JSON catalog exported!");
}

function exportMarkdown() {
  let md = `# WISHLIST // ARCHIVE EXPORT\n`;
  md += `Exported on: ${new Date().toLocaleDateString()}\n`;
  md += `Total Items: ${items.length} | Est. Value: ${statTotalValue.textContent}\n\n`;

  const grouped = {};
  items.forEach(i => {
    grouped[i.category] = grouped[i.category] || [];
    grouped[i.category].push(i);
  });

  for (const cat in grouped) {
    md += `## ${cat} (${grouped[cat].length})\n\n`;
    grouped[cat].forEach(i => {
      md += `### [${i.title}](${i.product_url})\n`;
      md += `- **Price:** ${i.price || 'N/A'}\n`;
      md += `- **Priority:** ${i.priority} | **Status:** ${i.status}\n`;
      md += `- **Description:** ${i.description}\n`;
      if (i.notes) md += `- **Notes:** ${i.notes}\n`;
      if (i.tags && i.tags.length) md += `- **Tags:** \`${i.tags.join('`, `')}\`\n`;
      md += `\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wishlist_archive_${new Date().toISOString().slice(0,10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Markdown summary exported!");
}

function handleImportJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        items = imported;
        saveData();
        render();
        dataSyncModalOverlay.classList.remove("active");
        showToast(`Successfully imported ${imported.length} items!`);
      } else {
        alert("Invalid file format. Must be a JSON array of items.");
      }
    } catch (err) {
      alert("Error parsing JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}

function resetToDefaults() {
  if (confirm("Reset catalog back to the initial Amazon wishlist? Any custom notes or edits will be restored to defaults.")) {
    items = [...window.INITIAL_WISHLIST];
    saveData();
    render();
    showToast("Catalog reset to Amazon list defaults!");
  }
}

// Theme
function setupTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  if (theme === "light") {
    themeIcon.setAttribute("data-feather", "moon");
  } else {
    themeIcon.setAttribute("data-feather", "sun");
  }
  feather.replace();
}

// Toast
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i data-feather="info" style="width:16px;height:16px;"></i> <span>${escapeHtml(msg)}</span>`;
  toastContainer.appendChild(toast);
  feather.replace();

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Utility
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Search
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    render();
  });

  // Keyboard shortcut '/' to search
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput && !itemModalOverlay.classList.contains("active") && !addItemModalOverlay.classList.contains("active")) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === "Escape") {
      closeItemModal();
      closeAddItemModal();
      dataSyncModalOverlay.classList.remove("active");
    }
    // Modal Arrow keys / J / K
    if (itemModalOverlay.classList.contains("active") && modalViewSection.style.display !== "none") {
      if (e.key === "ArrowRight" || e.key === "k" || e.key === "K") nextModalItem();
      if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") prevModalItem();
      if (e.key === "e" || e.key === "E") enterModalEditMode();
    }
  });

  // Sort & Filter
  sortSelect.addEventListener("change", (e) => {
    sortBy = e.target.value;
    render();
  });

  prioritySelect.addEventListener("change", (e) => {
    priorityFilter = e.target.value;
    render();
  });

  // View switchers
  viewButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      viewButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.getAttribute("data-view");
      renderGrid();
    });
  });

  // Theme toggle
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Modal navigation & close
  modalCloseBtn.addEventListener("click", closeItemModal);
  modalPrevBtn.addEventListener("click", prevModalItem);
  modalNextBtn.addEventListener("click", nextModalItem);
  itemModalOverlay.addEventListener("click", (e) => {
    if (e.target === itemModalOverlay) closeItemModal();
  });

  // Modal Edit mode
  modalEditBtn.addEventListener("click", enterModalEditMode);
  btnSaveEdit.addEventListener("click", saveModalEdit);
  btnCancelEdit.addEventListener("click", cancelModalEdit);

  // Add Item Modal
  btnAddNewItem.addEventListener("click", openAddItemModal);
  closeAddItemModalBtn.addEventListener("click", closeAddItemModal);
  cancelAddItemBtn.addEventListener("click", closeAddItemModal);
  addNewItemForm.addEventListener("submit", handleAddNewItem);
  addItemModalOverlay.addEventListener("click", (e) => {
    if (e.target === addItemModalOverlay) closeAddItemModal();
  });

  // Data Sync Modal
  btnExportImport.addEventListener("click", () => dataSyncModalOverlay.classList.add("active"));
  closeDataModalBtn.addEventListener("click", () => dataSyncModalOverlay.classList.remove("active"));
  dataSyncModalOverlay.addEventListener("click", (e) => {
    if (e.target === dataSyncModalOverlay) dataSyncModalOverlay.classList.remove("active");
  });

  btnExportJSON.addEventListener("click", exportJSON);
  btnExportMarkdown.addEventListener("click", exportMarkdown);
  btnTriggerImport.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", handleImportJSON);
  btnQuickReset.addEventListener("click", resetToDefaults);
}

// Start application
document.addEventListener("DOMContentLoaded", init);
