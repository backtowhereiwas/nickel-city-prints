let designs = [];
let categoryName = "";
let collectionName = "";
let search = "";

const grid = document.querySelector("#grid");
const template = document.querySelector("#designTemplate");
const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultCount = document.querySelector("#resultCount");
const pageTitle = document.querySelector("#pageTitle");
const backLink = document.querySelector("#backLink");
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

function render() {
  const matches = designs.filter(design =>
    design.category === categoryName &&
    design.collection === collectionName &&
    normalize(design.title).includes(search)
  );

  grid.innerHTML = "";
  resultCount.textContent = `${matches.length} design${matches.length === 1 ? "" : "s"} shown`;

  if (matches.length === 0) {
    grid.innerHTML = `<p class="empty">No designs matched this folder/search.</p>`;
    return;
  }

  for (const design of matches) {
    const node = template.content.cloneNode(true);
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
  collectionName = getParam("collection");

  pageTitle.textContent = collectionName || "Collection";
  document.title = `${collectionName || "Collection"} | Hueforge Gallery`;
  backLink.href = `category.html?category=${encodeURIComponent(categoryName)}`;
  backLink.textContent = `← Back to ${categoryName || "category"}`;

  try {
    const response = await fetch("gallery.json");
    designs = await response.json();
    render();
  } catch (error) {
    console.error(error);
    resultCount.textContent = "Could not load gallery. Run the generator first.";
  }
}

init();