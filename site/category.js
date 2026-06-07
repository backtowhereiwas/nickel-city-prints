let categoryName = "";
let search = "";
let categories = [];
let collections = [];
let designs = [];
let currentCategory = null;

const grid = document.querySelector("#grid");
const collectionTemplate = document.querySelector("#collectionTemplate");
const designTemplate = document.querySelector("#designTemplate");
const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultCount = document.querySelector("#resultCount");
const pageTitle = document.querySelector("#pageTitle");
const pageSubtitle = document.querySelector("#pageSubtitle");
const dialog = document.querySelector("#designDialog");
const dialogImage = document.querySelector("#dialogImage");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogMeta = document.querySelector("#dialogMeta");
const closeDialog = document.querySelector("#closeDialog");

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function openDesign(design) {
  dialogTitle.textContent = design.title;

  if (design.printed) {
    dialogImage.src = design.printed;
    dialogMeta.textContent = "Actual printed photo";
  } else {
    dialogImage.src = design.preview;
    dialogMeta.textContent = "No matching printed JPG photo yet — showing the render instead.";
  }

  dialogImage.alt = design.title;
  dialog.showModal();
}

function renderCollections() {
  const matches = collections.filter(collection =>
    collection.category === categoryName &&
    normalize(collection.name).includes(search)
  );

  grid.classList.remove("galleryGrid");
  grid.innerHTML = "";
  resultCount.textContent = `${matches.length} folder${matches.length === 1 ? "" : "s"} shown`;

  if (matches.length === 0) {
    grid.innerHTML = `<p class="empty">No folders matched this category/search.</p>`;
    return;
  }

  for (const collection of matches) {
    const node = collectionTemplate.content.cloneNode(true);
    const card = node.querySelector(".card");
    const img = node.querySelector(".preview");

    card.href = `collection.html?category=${encodeURIComponent(collection.category)}&collection=${encodeURIComponent(collection.name)}`;
    img.src = collection.preview;
    img.alt = `${collection.name} preview`;
    node.querySelector("h2").textContent = collection.name;
    node.querySelector(".meta").textContent =
      `${collection.count} design${collection.count === 1 ? "" : "s"}`;

    grid.appendChild(card);
  }
}

function renderDirectDesigns() {
  const matches = designs.filter(design =>
    design.category === categoryName &&
    !design.collection &&
    normalize(design.title).includes(search)
  );

  grid.classList.add("galleryGrid");
  grid.innerHTML = "";
  resultCount.textContent = `${matches.length} design${matches.length === 1 ? "" : "s"} shown`;

  if (matches.length === 0) {
    grid.innerHTML = `<p class="empty">No designs matched this category/search.</p>`;
    return;
  }

  for (const design of matches) {
    const node = designTemplate.content.cloneNode(true);
    const button = node.querySelector(".imageButton");
    const img = node.querySelector(".preview");
    const meta = node.querySelector(".meta");

    img.src = design.preview;
    img.alt = `${design.title} render`;
    node.querySelector("h2").textContent = design.title;
    meta.textContent = design.printed ? "Click to view printed photo" : "Printed photo coming soon";
    if (!design.printed) meta.classList.add("warning");

    button.addEventListener("click", () => openDesign(design));
    grid.appendChild(node);
  }
}

function render() {
  if (!currentCategory) {
    resultCount.textContent = "Category not found.";
    return;
  }

  if (currentCategory.hasCollections) {
    renderCollections();
  } else {
    renderDirectDesigns();
  }
}

searchInput.addEventListener("input", () => {
  search = normalize(searchInput.value);
  render();
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  search = "";
  render();
});

closeDialog.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

async function init() {
  categoryName = getParam("category");
  pageTitle.textContent = categoryName || "Category";
  document.title = `${categoryName || "Category"} | Hueforge Gallery`;

  try {
    const [categoriesResponse, collectionsResponse, designsResponse] = await Promise.all([
      fetch("categories.json"),
      fetch("collections.json"),
      fetch("gallery.json"),
    ]);

    categories = await categoriesResponse.json();
    collections = await collectionsResponse.json();
    designs = await designsResponse.json();

    currentCategory = categories.find(category => category.name === categoryName);

    if (currentCategory?.hasCollections) {
      pageSubtitle.textContent = "Choose a folder to view the available designs.";
      searchInput.placeholder = "Search folders...";
    } else {
      pageSubtitle.textContent = "Click a design to see the actual printed-photo view.";
      searchInput.placeholder = "Search designs...";
    }

    render();
  } catch (error) {
    console.error(error);
    resultCount.textContent = "Could not load gallery. Run the generator first.";
  }
}

init();