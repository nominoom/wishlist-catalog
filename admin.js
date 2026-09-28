// ===================================================================
// WISHLIST ARCHIVE — ADMIN CONSOLE JAVASCRIPT ENGINE
// ===================================================================

const STORAGE_KEY = "wishlist_archive_catalog_v1";
const THEME_KEY = "wishlist_theme_v1";

// State
let items = [];
let filteredItems = [];
let selectedItemIds = new Set();
let currentEditingIndex = -1;
let currentTab = "items-tab";

// Filter State
let searchQuery = "";
let filterCategory = "ALL";
let filterTag = "ALL";
let filterPriority = "ALL";
let filterStatus = "ALL";
let sortBy = "default";
let tagSearchQuery = "";

// DOM Elements
const adminSearchInput = document.getElementById("adminSearchInput");
const adminCategoryFilter = document.getElementById("adminCategoryFilter");
const adminTagFilter = document.getElementById("adminTagFilter");
const adminPriorityFilter = document.getElementById("adminPriorityFilter");
const adminStatusFilter = document.getElementById("adminStatusFilter");
const adminSortSelect = document.getElementById("adminSortSelect");
const adminItemsTableBody = document.getElementById("adminItemsTableBody");
const adminEmptyState = document.getElementById("adminEmptyState");
const filteredMatchCount = document.getElementById("filteredMatchCount");
const tableShowingCount = document.getElementById("tableShowingCount");
const tableTotalCount = document.getElementById("tableTotalCount");
const tabItemsCount = document.getElementById("tabItemsCount");
const tabTagsCount = document.getElementById("tabTagsCount");
const adminHeaderStats = document.getElementById("adminHeaderStats");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");
const bulkActionsBar = document.getElementById("bulkActionsBar");
const bulkSelectedCount = document.getElementById("bulkSelectedCount");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const toastContainer = document.getElementById("toastContainer");

// Drawer Elements
const adminEditDrawerOverlay = document.getElementById("adminEditDrawerOverlay");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const drawerItemAsin = document.getElementById("drawerItemAsin");
const drawerItemTitle = document.getElementById("drawerItemTitle");
const drawerItemId = document.getElementById("drawerItemId");
const drawerImagePreview = document.getElementById("drawerImagePreview");
const drawerInputImage = document.getElementById("drawerInputImage");
const drawerInputTitle = document.getElementById("drawerInputTitle");
const drawerInputCategory = document.getElementById("drawerInputCategory");
const drawerInputPrice = document.getElementById("drawerInputPrice");
const drawerSelectPriority = document.getElementById("drawerSelectPriority");
const drawerSelectStatus = document.getElementById("drawerSelectStatus");
const drawerInputDescription = document.getElementById("drawerInputDescription");
const drawerInputNotes = document.getElementById("drawerInputNotes");
const drawerInputProductUrl = document.getElementById("drawerInputProductUrl");
const drawerBtnTestPrimaryUrl = document.getElementById("drawerBtnTestPrimaryUrl");
const drawerCustomRefLinksContainer = document.getElementById("drawerCustomRefLinksContainer");
const btnAddCustomRefLink = document.getElementById("btnAddCustomRefLink");
const drawerActiveTagsContainer = document.getElementById("drawerActiveTagsContainer");
const drawerNewTagInput = document.getElementById("drawerNewTagInput");
const btnDrawerAddTag = document.getElementById("btnDrawerAddTag");
const drawerSuggestedTagsCloud = document.getElementById("drawerSuggestedTagsCloud");
const categoryDataList = document.getElementById("categoryDataList");
const btnDrawerSave = document.getElementById("btnDrawerSave");
const btnDrawerSaveAndNext = document.getElementById("btnDrawerSaveAndNext");
const btnDrawerSaveAndPrev = document.getElementById("btnDrawerSaveAndPrev");
const btnDrawerCancel = document.getElementById("btnDrawerCancel");
const btnDrawerDeleteItem = document.getElementById("btnDrawerDeleteItem");

// Global Tag Taxonomy Elements
const tagsTaxonomyGrid = document.getElementById("tagsTaxonomyGrid");
const newGlobalTagInput = document.getElementById("newGlobalTagInput");
const btnAddGlobalTagSubmit = document.getElementById("btnAddGlobalTagSubmit");
const tagSearchInput = document.getElementById("tagSearchInput");
const tagsSummaryCount = document.getElementById("tagsSummaryCount");
const globalTagModalOverlay = document.getElementById("globalTagModalOverlay");
const modalOriginalTagName = document.getElementById("modalOriginalTagName");
const modalDisplayCurrentTag = document.getElementById("modalDisplayCurrentTag");
const modalNewTagNameInput = document.getElementById("modalNewTagNameInput");
const modalTagUsageNote = document.getElementById("modalTagUsageNote");
const btnSubmitGlobalTagRename = document.getElementById("btnSubmitGlobalTagRename");
const btnCloseGlobalTagModal = document.getElementById("btnCloseGlobalTagModal");
const btnCancelGlobalTagModal = document.getElementById("btnCancelGlobalTagModal");

// Bulk Tag Modal Elements
const bulkTagModalOverlay = document.getElementById("bulkTagModalOverlay");
const bulkTagModalTitle = document.getElementById("bulkTagModalTitle");
const bulkTagTargetCount = document.getElementById("bulkTagTargetCount");
const bulkTagInputLabel = document.getElementById("bulkTagInputLabel");
const bulkTagInput = document.getElementById("bulkTagInput");
const btnSubmitBulkTagAction = document.getElementById("btnSubmitBulkTagAction");
const btnCloseBulkTagModal = document.getElementById("btnCloseBulkTagModal");
const btnCancelBulkTagModal = document.getElementById("btnCancelBulkTagModal");
let currentBulkActionType = "add-tag"; // 'add-tag', 'remove-tag', 'set-category', 'set-priority'

// Reference Links Tab Elements
const referenceLinksTableBody = document.getElementById("referenceLinksTableBody");

// Batch Tools Elements
const btnAdminExportJSON = document.getElementById("btnAdminExportJSON");
const btnAdminExportMD = document.getElementById("btnAdminExportMD");
const btnAdminExportCSV = document.getElementById("btnAdminExportCSV");
const btnAdminTriggerImport = document.getElementById("btnAdminTriggerImport");
const adminImportFileInput = document.getElementById("adminImportFileInput");
const btnAdminResetDefault = document.getElementById("btnAdminResetDefault");
const categoryBatchList = document.getElementById("categoryBatchList");

// Active item drawer state for tags and reference links
let drawerCurrentTags = [];
let drawerCurrentRefLinks = [];

// ===================================================================
// INITIALIZATION
// ===================================================================
function initAdmin() {
  loadData();
  setupTheme();
  setupEventListeners();
  renderAll();
  feather.replace();

  // Handle URL Query Params like ?edit=ASIN or ?tab=tags-tab
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");
  const tabParam = urlParams.get("tab");

  if (tabParam) {
    switchTab(tabParam);
  }

  if (editId) {
    const item = items.find(i => i.id === editId || i.asin === editId);
    if (item) {
      setTimeout(() => openItemEditDrawer(item.id), 100);
    }
  }
}

// Load data from localStorage or fallback
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

  // Ensure robust fields
  items = items.map((item, idx) => ({
    id: item.id || item.asin || `item-${idx}`,
    asin: item.asin || item.id || `item-${idx}`,
    title: item.title || "Untitled Item",
    price: item.price || "$0.00",
    price_raw: typeof item.price_raw === "number" ? item.price_raw : extractPrice(item.price),
    image: item.image || "https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png",
    product_url: item.product_url || (item.asin ? `https://www.amazon.com/dp/${item.asin}` : "#"),
    category: item.category || "General",
    tags: Array.isArray(item.tags) ? item.tags : [],
    description: item.description || "",
    notes: item.notes || "",
    priority: item.priority || "Medium",
    status: item.status || "Wanted",
    reference_links: Array.isArray(item.reference_links) ? item.reference_links : []
  }));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  updateStatsCounters();
}

function extractPrice(priceStr) {
  if (!priceStr) return 0;
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

// ===================================================================
// RENDERERS
// ===================================================================
function renderAll() {
  populateDropdownFilters();
  filterAndSortItems();
  renderItemsTable();
  renderTagsTaxonomy();
  renderReferenceLinksTable();
  renderCategoryBatchManager();
  updateStatsCounters();
  feather.replace();
}

function updateStatsCounters() {
  const allTags = getAllUniqueTags();
  const totalItems = items.length;
  const totalTags = allTags.length;

  tabItemsCount.textContent = totalItems;
  tabTagsCount.textContent = totalTags;
  tableTotalCount.textContent = totalItems;
  adminHeaderStats.textContent = `${totalItems} ITEMS / ${totalTags} UNIQUE TAGS`;
}

function getAllUniqueTags() {
  const tagSet = new Set();
  items.forEach(item => {
    (item.tags || []).forEach(t => {
      const clean = t.trim().toLowerCase();
      if (clean) tagSet.add(clean);
    });
  });
  return Array.from(tagSet).sort();
}

function getTagUsageCounts() {
  const counts = {};
  items.forEach(item => {
    (item.tags || []).forEach(t => {
      const clean = t.trim().toLowerCase();
      if (clean) counts[clean] = (counts[clean] || 0) + 1;
    });
  });
  return counts;
}

function populateDropdownFilters() {
  // Category options
  const categories = Array.from(new Set(items.map(i => i.category))).sort();
  const currentCat = adminCategoryFilter.value;
  adminCategoryFilter.innerHTML = '<option value="ALL">CATEGORY: ALL</option>' + 
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (categories.includes(currentCat)) adminCategoryFilter.value = currentCat;

  // Datalist for drawer category autocomplete
  categoryDataList.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}"></option>`).join('');

  // Tag options
  const tags = getAllUniqueTags();
  const currentTag = adminTagFilter.value;
  adminTagFilter.innerHTML = '<option value="ALL">TAG: ALL</option>' + 
    tags.map(t => `<option value="${escapeHtml(t)}">#${escapeHtml(t)}</option>`).join('');
  if (tags.includes(currentTag)) adminTagFilter.value = currentTag;
}

// Filter and Sort Items
function filterAndSortItems() {
  filteredItems = items.filter(item => {
    // Search query matches title, asin, description, tags, notes
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchAsin = (item.asin || "").toLowerCase().includes(q);
      const matchDesc = (item.description || "").toLowerCase().includes(q);
      const matchNotes = (item.notes || "").toLowerCase().includes(q);
      const matchTags = (item.tags || []).some(t => t.toLowerCase().includes(q));
      const matchUrl = (item.product_url || "").toLowerCase().includes(q);
      if (!matchTitle && !matchAsin && !matchDesc && !matchNotes && !matchTags && !matchUrl) {
        return false;
      }
    }

    // Category Filter
    if (filterCategory !== "ALL" && item.category !== filterCategory) {
      return false;
    }

    // Tag Filter
    if (filterTag !== "ALL") {
      const hasTag = (item.tags || []).some(t => t.toLowerCase() === filterTag.toLowerCase());
      if (!hasTag) return false;
    }

    // Priority Filter
    if (filterPriority !== "ALL" && item.priority !== filterPriority) {
      return false;
    }

    // Status Filter
    if (filterStatus !== "ALL" && item.status !== filterStatus) {
      return false;
    }

    return true;
  });

  // Sorting
  filteredItems.sort((a, b) => {
    switch (sortBy) {
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      case "price-desc":
        return (b.price_raw || 0) - (a.price_raw || 0);
      case "price-asc":
        return (a.price_raw || 0) - (b.price_raw || 0);
      case "tags-count":
        return (b.tags?.length || 0) - (a.tags?.length || 0);
      case "no-desc":
        const aHas = Boolean(a.description && a.description.trim());
        const bHas = Boolean(b.description && b.description.trim());
        return aHas === bHas ? 0 : aHas ? 1 : -1;
      case "default":
      default:
        return 0;
    }
  });

  filteredMatchCount.textContent = filteredItems.length;
  tableShowingCount.textContent = filteredItems.length;
}

// ===================================================================
// TAB 1: ITEMS TABLE RENDERER
// ===================================================================
function renderItemsTable() {
  if (filteredItems.length === 0) {
    adminItemsTableBody.innerHTML = "";
    adminEmptyState.style.display = "block";
    return;
  }

  adminEmptyState.style.display = "none";
  let html = "";

  filteredItems.forEach((item, index) => {
    const isChecked = selectedItemIds.has(item.id);
    const tagsHtml = (item.tags || []).map(t => `
      <span class="admin-tag-chip font-mono">
        #${escapeHtml(t)}
        <button type="button" class="tag-remove-btn" onclick="quickRemoveTagFromItem('${item.id}', '${escapeHtml(t)}', event)" title="Remove tag">&times;</button>
      </span>
    `).join('') + `
      <button type="button" class="btn-add-tag-inline font-mono" onclick="promptQuickAddTag('${item.id}', event)" title="Add tag to item">+ TAG</button>
    `;

    // Reference links summary badges
    let refLinksHtml = "";
    if (item.product_url) {
      refLinksHtml += `<a href="${escapeHtml(item.product_url)}" target="_blank" rel="noopener" class="table-ref-link-badge font-mono" title="Primary Store Link"><i data-feather="external-link" style="width:10px;height:10px;"></i> Amazon</a>`;
    }
    if (item.reference_links && item.reference_links.length > 0) {
      item.reference_links.forEach(ref => {
        refLinksHtml += `<a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener" class="table-ref-link-badge font-mono" title="${escapeHtml(ref.label || 'Reference')}"><i data-feather="link-2" style="width:10px;height:10px;"></i> ${escapeHtml(ref.label || 'Ref')}</a>`;
      });
    }

    const descSnippet = item.description ? escapeHtml(item.description) : '<span style="color:var(--text-tertiary); font-style:italic;">No custom description</span>';

    html += `
      <tr class="${isChecked ? 'selected-row' : ''}" data-id="${item.id}">
        <td class="col-select">
          <label class="custom-checkbox-container">
            <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} onchange="toggleItemSelection('${item.id}', this.checked)">
            <span class="checkbox-custom"></span>
          </label>
        </td>
        <td class="col-img">
          <img src="${escapeHtml(item.image)}" alt="" class="table-item-thumb" onerror="this.src='https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png'">
        </td>
        <td class="col-title">
          <div class="table-title-cell">
            <a href="javascript:void(0)" class="table-item-title" onclick="openItemEditDrawer('${item.id}')">${escapeHtml(item.title)}</a>
            <span class="table-item-asin font-mono">ASIN: ${escapeHtml(item.asin)} &bull; ${escapeHtml(item.status || 'Wanted')}</span>
          </div>
        </td>
        <td class="col-desc">
          <div class="table-desc-cell">
            <div class="table-desc-snippet">${descSnippet}</div>
            <div class="table-ref-links">${refLinksHtml}</div>
          </div>
        </td>
        <td class="col-category">
          <span class="badge font-mono text-xs">${escapeHtml(item.category)}</span>
        </td>
        <td class="col-tags">
          <div class="table-tags-cell">
            ${tagsHtml}
          </div>
        </td>
        <td class="col-price">
          <div class="font-mono font-bold">${escapeHtml(item.price || '$0.00')}</div>
          <div class="font-mono text-xs" style="color:var(--text-secondary);">${escapeHtml(item.priority || 'Medium')}</div>
        </td>
        <td class="col-actions">
          <div class="table-actions-cell">
            <button type="button" class="btn btn-sm btn-icon" onclick="openItemEditDrawer('${item.id}')" title="Edit item, descriptions & tags">
              <i data-feather="edit-2"></i>
            </button>
            <button type="button" class="btn btn-sm btn-icon" onclick="duplicateItem('${item.id}')" title="Duplicate item">
              <i data-feather="copy"></i>
            </button>
            <button type="button" class="btn btn-sm btn-icon btn-danger" onclick="deleteItemSingle('${item.id}')" title="Delete item">
              <i data-feather="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  adminItemsTableBody.innerHTML = html;
  updateBulkSelectionState();
  feather.replace();
}

// ===================================================================
// SELECTION & BULK ACTIONS
// ===================================================================
function toggleItemSelection(id, checked) {
  if (checked) {
    selectedItemIds.add(id);
  } else {
    selectedItemIds.delete(id);
  }
  updateBulkSelectionState();
}

function toggleSelectAll(checked) {
  if (checked) {
    filteredItems.forEach(item => selectedItemIds.add(item.id));
  } else {
    selectedItemIds.clear();
  }
  renderItemsTable();
}

function updateBulkSelectionState() {
  const count = selectedItemIds.size;
  if (count > 0) {
    bulkActionsBar.style.display = "flex";
    bulkSelectedCount.textContent = `${count} item${count > 1 ? 's' : ''} selected`;
  } else {
    bulkActionsBar.style.display = "none";
  }

  selectAllCheckbox.checked = filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.has(i.id));
}

function deselectAll() {
  selectedItemIds.clear();
  renderItemsTable();
}

function openBulkTagModal(type) {
  currentBulkActionType = type;
  const count = selectedItemIds.size;
  if (count === 0) return;

  bulkTagTargetCount.textContent = `Applying to ${count} selected item${count > 1 ? 's' : ''}:`;
  bulkTagInput.value = "";

  if (type === "add-tag") {
    bulkTagModalTitle.textContent = "BULK ADD TAGS";
    bulkTagInputLabel.textContent = "TAG(S) TO ADD (comma-separated)";
    bulkTagInput.placeholder = "e.g. ergonomic, upgrade, desk";
  } else if (type === "remove-tag") {
    bulkTagModalTitle.textContent = "BULK REMOVE TAGS";
    bulkTagInputLabel.textContent = "TAG(S) TO REMOVE (comma-separated)";
    bulkTagInput.placeholder = "e.g. tag-to-remove";
  } else if (type === "set-category") {
    bulkTagModalTitle.textContent = "BULK SET CATEGORY";
    bulkTagInputLabel.textContent = "NEW CATEGORY NAME";
    bulkTagInput.placeholder = "e.g. Audio, Desk Setup, Tools";
  } else if (type === "set-priority") {
    bulkTagModalTitle.textContent = "BULK SET PRIORITY";
    bulkTagInputLabel.textContent = "PRIORITY (High / Medium / Low)";
    bulkTagInput.placeholder = "High";
  }

  bulkTagModalOverlay.classList.add("active");
  bulkTagInput.focus();
}

function applyBulkAction() {
  const val = bulkTagInput.value.trim();
  if (!val) {
    alert("Please enter a value.");
    return;
  }

  let modifiedCount = 0;
  const tagsList = val.split(",").map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);

  items.forEach(item => {
    if (selectedItemIds.has(item.id)) {
      item.tags = item.tags || [];

      if (currentBulkActionType === "add-tag") {
        tagsList.forEach(t => {
          if (!item.tags.includes(t)) item.tags.push(t);
        });
        modifiedCount++;
      } else if (currentBulkActionType === "remove-tag") {
        item.tags = item.tags.filter(t => !tagsList.includes(t.toLowerCase()));
        modifiedCount++;
      } else if (currentBulkActionType === "set-category") {
        item.category = val;
        modifiedCount++;
      } else if (currentBulkActionType === "set-priority") {
        const p = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        item.priority = ["High", "Medium", "Low"].includes(p) ? p : "Medium";
        modifiedCount++;
      }
    }
  });

  saveData();
  bulkTagModalOverlay.classList.remove("active");
  renderAll();
  showToast(`Updated ${modifiedCount} items successfully!`);
}

function bulkDeleteSelected() {
  const count = selectedItemIds.size;
  if (count === 0) return;

  if (confirm(`Are you sure you want to permanently delete ${count} selected item${count > 1 ? 's' : ''}?`)) {
    items = items.filter(item => !selectedItemIds.has(item.id));
    selectedItemIds.clear();
    saveData();
    renderAll();
    showToast(`Deleted ${count} items.`);
  }
}

// Quick Tag Operations directly on Table Rows
function quickRemoveTagFromItem(itemId, tagName, e) {
  if (e) e.stopPropagation();
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  item.tags = (item.tags || []).filter(t => t.toLowerCase() !== tagName.toLowerCase());
  saveData();
  renderAll();
  showToast(`Removed #${tagName} from "${item.title.slice(0, 24)}..."`);
}

function promptQuickAddTag(itemId, e) {
  if (e) e.stopPropagation();
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const newTag = prompt(`Add tag to "${item.title.slice(0, 30)}...":`);
  if (newTag && newTag.trim()) {
    const cleanTag = newTag.trim().toLowerCase().replace(/^#/, '');
    item.tags = item.tags || [];
    if (!item.tags.includes(cleanTag)) {
      item.tags.push(cleanTag);
      saveData();
      renderAll();
      showToast(`Added #${cleanTag}`);
    }
  }
}

// ===================================================================
// TAB 2: ITEM EDIT DRAWER (DEEP ITEM & TAG & REF EDITOR)
// ===================================================================
function openItemEditDrawer(itemId) {
  const index = items.findIndex(i => i.id === itemId);
  if (index === -1) return;

  currentEditingIndex = index;
  const item = items[index];

  drawerItemId.value = item.id;
  drawerItemAsin.textContent = `ASIN: ${item.asin || item.id}`;
  drawerItemTitle.textContent = item.title;
  
  drawerImagePreview.src = item.image || "https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png";
  drawerInputImage.value = item.image || "";
  drawerInputTitle.value = item.title || "";
  drawerInputCategory.value = item.category || "General";
  drawerInputPrice.value = item.price || (item.price_raw ? `$${item.price_raw.toFixed(2)}` : "");
  drawerSelectPriority.value = item.priority || "Medium";
  drawerSelectStatus.value = item.status || "Wanted";
  drawerInputDescription.value = item.description || "";
  drawerInputNotes.value = item.notes || "";
  drawerInputProductUrl.value = item.product_url || "";
  drawerBtnTestPrimaryUrl.href = item.product_url || "#";

  // Setup Drawer Tags State
  drawerCurrentTags = [...(item.tags || [])];
  renderDrawerActiveTags();
  renderDrawerSuggestedTags();

  // Setup Drawer Reference Links State
  drawerCurrentRefLinks = JSON.parse(JSON.stringify(item.reference_links || []));
  renderDrawerCustomRefLinks();

  adminEditDrawerOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
  feather.replace();
}

function closeItemEditDrawer() {
  adminEditDrawerOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
  currentEditingIndex = -1;
}

// Live Image URL Preview
drawerInputImage.addEventListener("input", () => {
  const val = drawerInputImage.value.trim();
  drawerImagePreview.src = val || "https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png";
});

// Primary URL test link
drawerInputProductUrl.addEventListener("input", () => {
  drawerBtnTestPrimaryUrl.href = drawerInputProductUrl.value.trim() || "#";
});

// Drawer Tags Rendering & Toggling
function renderDrawerActiveTags() {
  if (drawerCurrentTags.length === 0) {
    drawerActiveTagsContainer.innerHTML = `<span style="color:var(--text-tertiary); font-size:0.75rem; padding:0.25rem;">No tags assigned yet. Type below or pick from repository.</span>`;
    return;
  }

  drawerActiveTagsContainer.innerHTML = drawerCurrentTags.map(t => `
    <span class="admin-tag-chip font-mono">
      #${escapeHtml(t)}
      <button type="button" class="tag-remove-btn" onclick="removeDrawerTag('${escapeHtml(t)}')">&times;</button>
    </span>
  `).join('');
}

function renderDrawerSuggestedTags() {
  const allTags = getAllUniqueTags();
  if (allTags.length === 0) {
    drawerSuggestedTagsCloud.innerHTML = `<span style="color:var(--text-tertiary); font-size:0.75rem;">No existing tags in catalog. Create one!</span>`;
    return;
  }

  drawerSuggestedTagsCloud.innerHTML = allTags.map(t => {
    const isSelected = drawerCurrentTags.includes(t);
    return `
      <button type="button" class="suggested-tag-btn ${isSelected ? 'active' : ''}" onclick="toggleDrawerTag('${escapeHtml(t)}')">
        #${escapeHtml(t)}
      </button>
    `;
  }).join('');
}

function toggleDrawerTag(tag) {
  const clean = tag.trim().toLowerCase().replace(/^#/, '');
  if (drawerCurrentTags.includes(clean)) {
    drawerCurrentTags = drawerCurrentTags.filter(t => t !== clean);
  } else {
    drawerCurrentTags.push(clean);
  }
  renderDrawerActiveTags();
  renderDrawerSuggestedTags();
}

function removeDrawerTag(tag) {
  drawerCurrentTags = drawerCurrentTags.filter(t => t !== tag);
  renderDrawerActiveTags();
  renderDrawerSuggestedTags();
}

function addDrawerTagFromInput() {
  const raw = drawerNewTagInput.value.trim();
  if (!raw) return;

  const newTags = raw.split(",").map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
  newTags.forEach(t => {
    if (!drawerCurrentTags.includes(t)) {
      drawerCurrentTags.push(t);
    }
  });

  drawerNewTagInput.value = "";
  renderDrawerActiveTags();
  renderDrawerSuggestedTags();
}

drawerNewTagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addDrawerTagFromInput();
  }
});
btnDrawerAddTag.addEventListener("click", addDrawerTagFromInput);

// Reference Links in Drawer
function renderDrawerCustomRefLinks() {
  drawerCustomRefLinksContainer.innerHTML = drawerCurrentRefLinks.map((ref, idx) => `
    <div class="custom-ref-link-item" data-idx="${idx}">
      <input type="text" class="form-input text-xs font-mono" style="width:130px;" placeholder="Label (e.g. Video)" value="${escapeHtml(ref.label || '')}" oninput="updateDrawerRefLink(${idx}, 'label', this.value)">
      <input type="url" class="form-input text-xs font-mono flex-1" placeholder="https://..." value="${escapeHtml(ref.url || '')}" oninput="updateDrawerRefLink(${idx}, 'url', this.value)">
      <a href="${escapeHtml(ref.url || '#')}" target="_blank" rel="noopener" class="btn btn-sm btn-icon" title="Test Link"><i data-feather="external-link"></i></a>
      <button type="button" class="btn btn-sm btn-icon btn-danger" onclick="removeDrawerRefLink(${idx})" title="Delete Link"><i data-feather="trash-2"></i></button>
    </div>
  `).join('');
  feather.replace();
}

function addCustomRefLink() {
  drawerCurrentRefLinks.push({ label: "Reference", url: "" });
  renderDrawerCustomRefLinks();
}

function updateDrawerRefLink(idx, field, value) {
  if (drawerCurrentRefLinks[idx]) {
    drawerCurrentRefLinks[idx][field] = value;
  }
}

function removeDrawerRefLink(idx) {
  drawerCurrentRefLinks.splice(idx, 1);
  renderDrawerCustomRefLinks();
}

btnAddCustomRefLink.addEventListener("click", addCustomRefLink);

// Format description helpers
document.getElementById("btnDescFormatBold").addEventListener("click", () => {
  const textarea = drawerInputDescription;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const sel = textarea.value.substring(start, end) || "bold text";
  textarea.value = textarea.value.substring(0, start) + `**${sel}**` + textarea.value.substring(end);
  textarea.focus();
});

document.getElementById("btnDescFormatList").addEventListener("click", () => {
  const textarea = drawerInputDescription;
  const start = textarea.selectionStart;
  const text = textarea.value;
  const insertion = "\n• ";
  textarea.value = text.substring(0, start) + insertion + text.substring(start);
  textarea.focus();
});

document.getElementById("btnDescClear").addEventListener("click", () => {
  if (confirm("Clear description?")) drawerInputDescription.value = "";
});

// Save Drawer Item Changes
function saveDrawerItemChanges(keepDrawerOpen = false, moveDirection = 0) {
  if (currentEditingIndex === -1) return;

  const item = items[currentEditingIndex];
  const priceStr = drawerInputPrice.value.trim();
  const priceRaw = extractPrice(priceStr);

  item.title = drawerInputTitle.value.trim() || item.title;
  item.category = drawerInputCategory.value.trim() || "General";
  item.price = priceStr || (priceRaw > 0 ? `$${priceRaw.toFixed(2)}` : "$0.00");
  item.price_raw = priceRaw;
  item.priority = drawerSelectPriority.value;
  item.status = drawerSelectStatus.value;
  item.description = drawerInputDescription.value.trim();
  item.notes = drawerInputNotes.value.trim();
  item.image = drawerInputImage.value.trim() || item.image;
  item.product_url = drawerInputProductUrl.value.trim() || item.product_url;
  item.tags = [...drawerCurrentTags];
  item.reference_links = drawerCurrentRefLinks.filter(r => r.url && r.url.trim());

  saveData();
  showToast(`Saved changes for "${item.title.slice(0, 24)}..."`);

  if (moveDirection !== 0) {
    const nextIdx = currentEditingIndex + moveDirection;
    if (nextIdx >= 0 && nextIdx < items.length) {
      openItemEditDrawer(items[nextIdx].id);
    } else {
      showToast("Reached end of list.");
      closeItemEditDrawer();
      renderAll();
    }
  } else if (!keepDrawerOpen) {
    closeItemEditDrawer();
    renderAll();
  } else {
    renderAll();
  }
}

// Delete item
function deleteItemSingle(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  if (confirm(`Permanently delete "${item.title}" from your catalog?`)) {
    items = items.filter(i => i.id !== itemId);
    selectedItemIds.delete(itemId);
    saveData();
    closeItemEditDrawer();
    renderAll();
    showToast(`Item removed from catalog.`);
  }
}

// Duplicate Item
function duplicateItem(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const newItem = JSON.parse(JSON.stringify(item));
  newItem.id = "CUSTOM_" + Date.now();
  newItem.asin = newItem.id;
  newItem.title = `[Copy] ${newItem.title}`;
  items.unshift(newItem);

  saveData();
  renderAll();
  openItemEditDrawer(newItem.id);
  showToast(`Duplicated item.`);
}

// Add New Item
function createNewBlankItem() {
  const newItem = {
    id: "CUSTOM_" + Date.now(),
    asin: "CUSTOM_" + Date.now(),
    title: "New Wishlist Item",
    price: "$0.00",
    price_raw: 0,
    image: "https://images-na.ssl-images-amazon.com/images/G/01/wishlist/no-image-avail._CB485923985_.png",
    product_url: "",
    category: "General",
    tags: ["new"],
    description: "",
    notes: "",
    priority: "Medium",
    status: "Wanted",
    reference_links: []
  };

  items.unshift(newItem);
  saveData();
  renderAll();
  openItemEditDrawer(newItem.id);
  showToast("Created new item. Ready to edit!");
}

// ===================================================================
// TAB 3: TAG TAXONOMY & GLOBAL TAG MANAGER
// ===================================================================
function renderTagsTaxonomy() {
  const allTags = getAllUniqueTags();
  const counts = getTagUsageCounts();

  let filteredTags = allTags;
  if (tagSearchQuery) {
    filteredTags = allTags.filter(t => t.includes(tagSearchQuery.toLowerCase()));
  }

  tagsSummaryCount.textContent = `${allTags.length} UNIQUE TAGS`;

  if (filteredTags.length === 0) {
    tagsTaxonomyGrid.innerHTML = `<div style="grid-column: 1/-1; padding:2rem; text-align:center; color:var(--text-secondary);">No tags found matching query.</div>`;
    return;
  }

  tagsTaxonomyGrid.innerHTML = filteredTags.map(tag => {
    const count = counts[tag] || 0;
    return `
      <div class="tag-card">
        <div class="tag-card-top">
          <span class="tag-card-name">#${escapeHtml(tag)}</span>
          <span class="tag-card-badge">${count} item${count === 1 ? '' : 's'}</span>
        </div>
        <div class="tag-card-actions">
          <button type="button" class="btn btn-sm" onclick="filterItemsByTag('${escapeHtml(tag)}')">
            <i data-feather="filter"></i> Filter
          </button>
          <button type="button" class="btn btn-sm" onclick="openGlobalTagRenameModal('${escapeHtml(tag)}', ${count})">
            <i data-feather="edit-2"></i> Rename
          </button>
          <button type="button" class="btn btn-sm btn-danger" onclick="deleteGlobalTag('${escapeHtml(tag)}', ${count})">
            <i data-feather="trash-2"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  feather.replace();
}

function filterItemsByTag(tag) {
  // Switch to items tab and set filter
  switchTab("items-tab");
  adminTagFilter.value = tag;
  filterTag = tag;
  filterAndSortItems();
  renderItemsTable();
}

function addNewGlobalTags() {
  const val = newGlobalTagInput.value.trim();
  if (!val) return;

  const newTags = val.split(",").map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
  if (newTags.length === 0) return;

  // Prompt user which item(s) to attach to or attach to selected
  if (selectedItemIds.size > 0) {
    items.forEach(item => {
      if (selectedItemIds.has(item.id)) {
        item.tags = item.tags || [];
        newTags.forEach(t => {
          if (!item.tags.includes(t)) item.tags.push(t);
        });
      }
    });
    showToast(`Added ${newTags.map(t=>`#${t}`).join(', ')} to ${selectedItemIds.size} selected items!`);
  } else {
    // If no items selected, add to first item or assign dynamically
    if (items.length > 0) {
      items[0].tags = items[0].tags || [];
      newTags.forEach(t => {
        if (!items[0].tags.includes(t)) items[0].tags.push(t);
      });
      showToast(`Created tag(s) in catalog taxonomy: ${newTags.map(t=>`#${t}`).join(', ')}`);
    }
  }

  newGlobalTagInput.value = "";
  saveData();
  renderAll();
}

function openGlobalTagRenameModal(tagName, count) {
  modalOriginalTagName.value = tagName;
  modalDisplayCurrentTag.value = `#${tagName}`;
  modalNewTagNameInput.value = tagName;
  modalTagUsageNote.textContent = `This will rename #${tagName} across ${count} item${count === 1 ? '' : 's'}.`;
  globalTagModalOverlay.classList.add("active");
  modalNewTagNameInput.focus();
}

function submitGlobalTagRename() {
  const oldTag = modalOriginalTagName.value;
  const newTag = modalNewTagNameInput.value.trim().toLowerCase().replace(/^#/, '');

  if (!newTag) {
    alert("Please enter a valid new tag name.");
    return;
  }

  let count = 0;
  items.forEach(item => {
    if (item.tags && item.tags.includes(oldTag)) {
      item.tags = item.tags.map(t => t.toLowerCase() === oldTag.toLowerCase() ? newTag : t);
      // Remove duplicate tags if any
      item.tags = Array.from(new Set(item.tags));
      count++;
    }
  });

  saveData();
  globalTagModalOverlay.classList.remove("active");
  renderAll();
  showToast(`Renamed #${oldTag} to #${newTag} on ${count} items!`);
}

function deleteGlobalTag(tagName, count) {
  if (confirm(`Remove tag #${tagName} from all ${count} items?`)) {
    items.forEach(item => {
      if (item.tags) {
        item.tags = item.tags.filter(t => t.toLowerCase() !== tagName.toLowerCase());
      }
    });
    saveData();
    renderAll();
    showToast(`Deleted #${tagName} globally.`);
  }
}

// ===================================================================
// TAB 3: REFERENCE LINKS TABLE RENDERER
// ===================================================================
function renderReferenceLinksTable() {
  let html = "";
  items.forEach(item => {
    let customRefsHtml = "";
    if (item.reference_links && item.reference_links.length > 0) {
      customRefsHtml = item.reference_links.map(ref => `
        <div style="display:inline-flex; align-items:center; gap:0.35rem; margin-right:0.5rem; margin-bottom:0.25rem;">
          <span class="badge font-mono text-xs">${escapeHtml(ref.label || 'Ref')}</span>
          <a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener" class="font-mono text-xs" style="color:var(--text-primary); text-decoration:underline;">${escapeHtml(ref.url.length > 40 ? ref.url.slice(0, 38) + '...' : ref.url)}</a>
        </div>
      `).join('');
    } else {
      customRefsHtml = '<span style="color:var(--text-tertiary); font-size:0.75rem;">None</span>';
    }

    html += `
      <tr>
        <td>
          <img src="${escapeHtml(item.image)}" alt="" class="table-item-thumb">
        </td>
        <td>
          <div class="font-bold text-xs">${escapeHtml(item.title)}</div>
          <span class="font-mono text-xs text-secondary">ASIN: ${escapeHtml(item.asin)}</span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="url" class="form-input text-xs font-mono flex-1" value="${escapeHtml(item.product_url || '')}" onchange="updateItemPrimaryUrl('${item.id}', this.value)">
            <a href="${escapeHtml(item.product_url || '#')}" target="_blank" rel="noopener" class="btn btn-sm btn-icon"><i data-feather="external-link"></i></a>
          </div>
        </td>
        <td>
          ${customRefsHtml}
        </td>
        <td>
          <button type="button" class="btn btn-sm" onclick="openItemEditDrawer('${item.id}')">
            <i data-feather="edit-2"></i> Edit
          </button>
        </td>
      </tr>
    `;
  });

  referenceLinksTableBody.innerHTML = html;
  feather.replace();
}

function updateItemPrimaryUrl(itemId, newUrl) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  item.product_url = newUrl.trim();
  saveData();
  showToast("Updated primary link.");
}

// ===================================================================
// TAB 4: BATCH TOOLS & CATEGORIES
// ===================================================================
function renderCategoryBatchManager() {
  const counts = {};
  items.forEach(i => counts[i.category] = (counts[i.category] || 0) + 1);

  const categories = Object.keys(counts).sort();
  categoryBatchList.innerHTML = categories.map(cat => `
    <div class="category-batch-item">
      <div>
        <strong>${escapeHtml(cat)}</strong>
        <span class="text-tertiary font-mono">(${counts[cat]} items)</span>
      </div>
      <div style="display:flex; gap:0.35rem;">
        <button type="button" class="btn btn-sm" onclick="batchRenameCategory('${escapeHtml(cat)}')">Rename</button>
      </div>
    </div>
  `).join('');
}

function batchRenameCategory(oldCat) {
  const newCat = prompt(`Rename category "${oldCat}" to:`, oldCat);
  if (newCat && newCat.trim() && newCat !== oldCat) {
    let count = 0;
    items.forEach(i => {
      if (i.category === oldCat) {
        i.category = newCat.trim();
        count++;
      }
    });
    saveData();
    renderAll();
    showToast(`Renamed category on ${count} items!`);
  }
}

// ===================================================================
// EXPORT & IMPORT
// ===================================================================
function exportAdminJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `wishlist_catalog_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Exported catalog JSON backup!");
}

function exportAdminMarkdown() {
  let md = `# WISHLIST // ARCHIVE CATALOG REPORT\n`;
  md += `Exported: ${new Date().toLocaleString()}\n`;
  md += `Total Items: ${items.length}\n\n`;

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
      if (i.tags && i.tags.length) md += `- **Tags:** \`${i.tags.join('`, `')}\`\n`;
      if (i.description) md += `- **Description:** ${i.description}\n`;
      if (i.notes) md += `- **Notes:** ${i.notes}\n`;
      if (i.reference_links && i.reference_links.length) {
        md += `- **Reference Links:**\n`;
        i.reference_links.forEach(r => md += `  - [${r.label || 'Link'}](${r.url})\n`);
      }
      md += `\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wishlist_catalog_${new Date().toISOString().slice(0,10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported Markdown catalog!");
}

function exportAdminCSV() {
  let csv = "ASIN,Title,Category,Price,Priority,Status,Tags,Product_URL,Description,Notes\n";
  items.forEach(i => {
    const row = [
      `"${(i.asin || '').replace(/"/g, '""')}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${(i.price || '').replace(/"/g, '""')}"`,
      `"${(i.priority || '').replace(/"/g, '""')}"`,
      `"${(i.status || '').replace(/"/g, '""')}"`,
      `"${(i.tags || []).join('; ')}"`,
      `"${(i.product_url || '').replace(/"/g, '""')}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wishlist_catalog_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported CSV spreadsheet!");
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      if (Array.isArray(imported)) {
        if (confirm(`Import ${imported.length} items? This will replace your current catalog.`)) {
          items = imported;
          saveData();
          renderAll();
          showToast(`Successfully imported ${imported.length} items!`);
        }
      } else {
        alert("Invalid file format. Must be a JSON array of items.");
      }
    } catch (err) {
      alert("Error parsing JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}

function resetAdminDefaults() {
  if (confirm("WARNING: This will reset your entire catalog to the original Amazon wishlist defaults. All custom descriptions, notes, and tags will be restored. Continue?")) {
    items = [...window.INITIAL_WISHLIST];
    saveData();
    renderAll();
    showToast("Catalog reset to defaults.");
  }
}

// ===================================================================
// TAB SWITCHING & THEME
// ===================================================================
function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
  document.querySelectorAll(".admin-tab-content").forEach(content => {
    content.classList.toggle("active", content.id === tabId);
  });
  feather.replace();
}

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

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i data-feather="check-circle" style="width:16px;height:16px;"></i> <span>${escapeHtml(msg)}</span>`;
  toastContainer.appendChild(toast);
  feather.replace();

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

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

// ===================================================================
// EVENT LISTENERS
// ===================================================================
function setupEventListeners() {
  // Tab buttons
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
  });

  // Search & Filters
  adminSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    filterAndSortItems();
    renderItemsTable();
  });

  adminCategoryFilter.addEventListener("change", (e) => {
    filterCategory = e.target.value;
    filterAndSortItems();
    renderItemsTable();
  });

  adminTagFilter.addEventListener("change", (e) => {
    filterTag = e.target.value;
    filterAndSortItems();
    renderItemsTable();
  });

  adminPriorityFilter.addEventListener("change", (e) => {
    filterPriority = e.target.value;
    filterAndSortItems();
    renderItemsTable();
  });

  adminStatusFilter.addEventListener("change", (e) => {
    filterStatus = e.target.value;
    filterAndSortItems();
    renderItemsTable();
  });

  adminSortSelect.addEventListener("change", (e) => {
    sortBy = e.target.value;
    filterAndSortItems();
    renderItemsTable();
  });

  document.getElementById("btnClearAdminFilters")?.addEventListener("click", () => {
    adminSearchInput.value = "";
    adminCategoryFilter.value = "ALL";
    adminTagFilter.value = "ALL";
    adminPriorityFilter.value = "ALL";
    adminStatusFilter.value = "ALL";
    adminSortSelect.value = "default";
    searchQuery = "";
    filterCategory = "ALL";
    filterTag = "ALL";
    filterPriority = "ALL";
    filterStatus = "ALL";
    sortBy = "default";
    filterAndSortItems();
    renderItemsTable();
  });

  // Select all
  selectAllCheckbox.addEventListener("change", (e) => toggleSelectAll(e.target.checked));

  // Bulk buttons
  document.getElementById("btnBulkAddTag").addEventListener("click", () => openBulkTagModal("add-tag"));
  document.getElementById("btnBulkRemoveTag").addEventListener("click", () => openBulkTagModal("remove-tag"));
  document.getElementById("btnBulkSetCategory").addEventListener("click", () => openBulkTagModal("set-category"));
  document.getElementById("btnBulkSetPriority").addEventListener("click", () => openBulkTagModal("set-priority"));
  document.getElementById("btnBulkDelete").addEventListener("click", bulkDeleteSelected);
  document.getElementById("btnBulkDeselectAll").addEventListener("click", deselectAll);

  // Bulk Modal Submit / Close
  btnSubmitBulkTagAction.addEventListener("click", applyBulkAction);
  btnCloseBulkTagModal.addEventListener("click", () => bulkTagModalOverlay.classList.remove("active"));
  btnCancelBulkTagModal.addEventListener("click", () => bulkTagModalOverlay.classList.remove("active"));

  // Drawer Controls
  btnCloseDrawer.addEventListener("click", closeItemEditDrawer);
  btnDrawerCancel.addEventListener("click", closeItemEditDrawer);
  btnDrawerSave.addEventListener("click", () => saveDrawerItemChanges(false, 0));
  btnDrawerSaveAndNext.addEventListener("click", () => saveDrawerItemChanges(true, 1));
  btnDrawerSaveAndPrev.addEventListener("click", () => saveDrawerItemChanges(true, -1));
  btnDrawerDeleteItem.addEventListener("click", () => {
    const id = drawerItemId.value;
    if (id) deleteItemSingle(id);
  });

  // Global Tag Creation & Rename Modal
  btnAddGlobalTagSubmit.addEventListener("click", addNewGlobalTags);
  newGlobalTagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewGlobalTags();
    }
  });

  tagSearchInput.addEventListener("input", (e) => {
    tagSearchQuery = e.target.value;
    renderTagsTaxonomy();
  });

  btnSubmitGlobalTagRename.addEventListener("click", submitGlobalTagRename);
  btnCloseGlobalTagModal.addEventListener("click", () => globalTagModalOverlay.classList.remove("active"));
  btnCancelGlobalTagModal.addEventListener("click", () => globalTagModalOverlay.classList.remove("active"));

  // New Item & Backups
  document.getElementById("btnAdminAddNew").addEventListener("click", createNewBlankItem);
  btnAdminExportJSON.addEventListener("click", exportAdminJSON);
  btnAdminExportMD.addEventListener("click", exportAdminMarkdown);
  btnAdminExportCSV.addEventListener("click", exportAdminCSV);
  btnAdminTriggerImport.addEventListener("click", () => adminImportFileInput.click());
  adminImportFileInput.addEventListener("change", handleImportFile);
  btnAdminResetDefault.addEventListener("click", resetAdminDefaults);
  document.getElementById("btnAdminExportImport").addEventListener("click", () => switchTab("batch-tab"));
  document.getElementById("btnQuickSaveDisk").addEventListener("click", () => {
    saveData();
    showToast("Catalog synced to localStorage!");
  });

  // Theme toggle
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Ctrl+S / Cmd+S in drawer saves
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      if (adminEditDrawerOverlay.classList.contains("active")) {
        e.preventDefault();
        saveDrawerItemChanges(false, 0);
      }
    }
    // Escape closes modals/drawers
    if (e.key === "Escape") {
      if (adminEditDrawerOverlay.classList.contains("active")) closeItemEditDrawer();
      if (globalTagModalOverlay.classList.contains("active")) globalTagModalOverlay.classList.remove("active");
      if (bulkTagModalOverlay.classList.contains("active")) bulkTagModalOverlay.classList.remove("active");
    }
    // '/' focuses search when not in input
    if (e.key === "/" && document.activeElement !== adminSearchInput && !adminEditDrawerOverlay.classList.contains("active")) {
      e.preventDefault();
      adminSearchInput.focus();
    }
  });
}

// Start Admin app
document.addEventListener("DOMContentLoaded", initAdmin);
