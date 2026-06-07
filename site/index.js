let categories = [];
let search = "";

const grid = document.querySelector("#grid");
const template = document.querySelector("#cardTemplate");
const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultCount = document.querySelector("#resultCount");

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function render() {
  const matches = categories.filter(category => normalize(category.name).includes(search));

  grid.innerHTML = "";
  resultCount.textContent = `${matches.length} of ${categories.length} categories shown`;

  if (matches.length === 0) {
    grid.innerHTML = `<p class="empty">No categories matched your search.</p>`;
    return;
  }

  for (const category of matches) {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".card");
    const img = node.querySelector(".preview");

    card.href = `category.html?category=${encodeURIComponent(category.name)}`;
    img.src = category.preview;
    img.alt = `${category.name} preview`;

    node.querySelector("h2").textContent = category.name;

    if (category.hasCollections) {
      node.querySelector(".meta").textContent =
        `${category.collectionCount} folder${category.collectionCount === 1 ? "" : "s"} · ${category.count} design${category.count === 1 ? "" : "s"}`;
    } else {
      node.querySelector(".meta").textContent =
        `${category.count} design${category.count === 1 ? "" : "s"}`;
    }

    grid.appendChild(card);
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

async function init() {
  try {
    const response = await fetch("categories.json");
    categories = await response.json();
    render();
  } catch (error) {
    console.error(error);
    resultCount.textContent = "Could not load categories. Run the generator first.";
  }
}

init();