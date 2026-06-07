from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass, asdict
from pathlib import Path


RENDER_EXT = ".png"
PRINTED_EXTENSIONS = {".jpg", ".jpeg"}

SITE_DIR = Path("site")
PREVIEW_DIR = SITE_DIR / "assets" / "previews"
PRINTED_DIR = SITE_DIR / "assets" / "printed"


@dataclass
class Design:
    id: str
    title: str
    category: str
    collection: str | None
    folder: str
    preview: str
    printed: str | None


def slugify(value: str) -> str:
    chars = []
    for char in value.lower().strip():
        if char.isalnum():
            chars.append(char)
        elif char in {" ", "-", "_", ".", "&"}:
            chars.append("-")

    slug = "".join(chars)
    while "--" in slug:
        slug = slug.replace("--", "-")

    return slug.strip("-") or "item"


def clean_title(value: str) -> str:
    name = value.replace("_", " ").replace("-", " ").strip()
    return " ".join(name.split()) or "Untitled Design"


def normalized_stem(path: Path) -> str:
    return path.stem.casefold()


def copy_asset(source: Path, output_dir: Path, design_id: str, suffix_override: str | None = None) -> str:
    output_dir.mkdir(parents=True, exist_ok=True)
    suffix = suffix_override or source.suffix.lower()
    copied_name = f"{design_id}{suffix}"
    copied_path = output_dir / copied_name
    shutil.copy2(source, copied_path)
    return f"assets/{output_dir.name}/{copied_name}"


def direct_subfolders(folder: Path) -> list[Path]:
    return sorted([p for p in folder.iterdir() if p.is_dir()], key=lambda p: p.name.casefold())


def direct_png_files(folder: Path) -> list[Path]:
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() == RENDER_EXT],
        key=lambda p: p.name.casefold(),
    )


def direct_jpg_files(folder: Path) -> list[Path]:
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in PRINTED_EXTENSIONS],
        key=lambda p: p.name.casefold(),
    )


def unique_design_id(category: str, collection: str | None, stem: str, used_ids: set[str]) -> str:
    parts = [category]
    if collection:
        parts.append(collection)
    parts.append(stem)

    base_id = slugify("-".join(parts))
    design_id = base_id
    counter = 2

    while design_id in used_ids:
        design_id = f"{base_id}-{counter}"
        counter += 1

    used_ids.add(design_id)
    return design_id


def create_designs_from_folder(
    folder: Path,
    category: str,
    collection: str | None,
    root: Path,
    used_ids: set[str],
) -> list[Design]:
    designs: list[Design] = []

    png_files = direct_png_files(folder)
    jpg_files = direct_jpg_files(folder)

    png_by_stem = {normalized_stem(p): p for p in png_files}
    jpg_by_stem: dict[str, Path] = {}

    for jpg in jpg_files:
        # First match wins. This avoids weirdness if both .jpg and .jpeg exist.
        jpg_by_stem.setdefault(normalized_stem(jpg), jpg)

    all_stems = sorted(set(png_by_stem.keys()) | set(jpg_by_stem.keys()))

    for stem_key in all_stems:
        png = png_by_stem.get(stem_key)
        jpg = jpg_by_stem.get(stem_key)

        # Preferred behavior:
        # - PNG exists: use PNG as preview, matching JPG as clicked printed view when available.
        # - JPG-only exists: use JPG as both preview and clicked printed view.
        source_for_title = png or jpg
        if not source_for_title:
            continue

        design_id = unique_design_id(category, collection, source_for_title.stem, used_ids)

        if png:
            preview_path = copy_asset(png, PREVIEW_DIR, design_id)
            printed_path = copy_asset(jpg, PRINTED_DIR, design_id) if jpg else None
        else:
            # JPG fallback: use actual printed photo as both card preview and clicked view.
            preview_path = copy_asset(jpg, PREVIEW_DIR, design_id)
            printed_path = copy_asset(jpg, PRINTED_DIR, design_id)

        designs.append(Design(
            id=design_id,
            title=clean_title(source_for_title.stem),
            category=category,
            collection=collection,
            folder=str(folder.relative_to(root)),
            preview=preview_path,
            printed=printed_path,
        ))

    return designs


def scan_gallery(root: Path) -> list[Design]:
    if not root.exists():
        raise FileNotFoundError(f"Folder does not exist: {root}")

    if not root.is_dir():
        raise NotADirectoryError(f"Path is not a folder: {root}")

    for output_dir in (PREVIEW_DIR, PRINTED_DIR):
        output_dir.mkdir(parents=True, exist_ok=True)

        for old_file in output_dir.glob("*"):
            if old_file.is_file():
                old_file.unlink()

    designs: list[Design] = []
    used_ids: set[str] = set()

    for category_dir in direct_subfolders(root):
        category = category_dir.name
        subfolders = direct_subfolders(category_dir)

        if subfolders:
            for collection_dir in subfolders:
                designs.extend(create_designs_from_folder(
                    folder=collection_dir,
                    category=category,
                    collection=collection_dir.name,
                    root=root,
                    used_ids=used_ids,
                ))
        else:
            designs.extend(create_designs_from_folder(
                folder=category_dir,
                category=category,
                collection=None,
                root=root,
                used_ids=used_ids,
            ))

    return designs


def build_categories(designs: list[Design]) -> list[dict]:
    categories: dict[str, dict] = {}

    for design in designs:
        categories.setdefault(design.category, {
            "name": design.category,
            "slug": slugify(design.category),
            "count": 0,
            "collectionCount": 0,
            "preview": design.preview,
            "hasCollections": False,
            "collections": set(),
        })

        categories[design.category]["count"] += 1

        if design.collection:
            categories[design.category]["hasCollections"] = True
            categories[design.category]["collections"].add(design.collection)

    result = []

    for category in categories.values():
        category["collectionCount"] = len(category["collections"])
        del category["collections"]
        result.append(category)

    return sorted(result, key=lambda item: item["name"].casefold())


def build_collections(designs: list[Design]) -> list[dict]:
    collections: dict[tuple[str, str], dict] = {}

    for design in designs:
        if not design.collection:
            continue

        key = (design.category, design.collection)

        collections.setdefault(key, {
            "name": design.collection,
            "slug": slugify(design.collection),
            "category": design.category,
            "count": 0,
            "preview": design.preview,
        })

        collections[key]["count"] += 1

    return sorted(collections.values(), key=lambda item: (item["category"].casefold(), item["name"].casefold()))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a Hueforge gallery using PNG renders as thumbnails, matching JPG photos as detail images, and JPG-only files as both."
    )
    parser.add_argument("folder", help="Path to your Hueforge folder")
    args = parser.parse_args()

    root = Path(args.folder).expanduser().resolve()

    designs = scan_gallery(root)
    categories = build_categories(designs)
    collections = build_collections(designs)

    SITE_DIR.mkdir(exist_ok=True)

    (SITE_DIR / "gallery.json").write_text(
        json.dumps([asdict(design) for design in designs], indent=2),
        encoding="utf-8",
    )

    (SITE_DIR / "categories.json").write_text(
        json.dumps(categories, indent=2),
        encoding="utf-8",
    )

    (SITE_DIR / "collections.json").write_text(
        json.dumps(collections, indent=2),
        encoding="utf-8",
    )

    missing_printed = len([design for design in designs if not design.printed])

    print(f"Found {len(categories)} top-level categories.")
    print(f"Found {len(collections)} second-level folders/collections.")
    print(f"Found {len(designs)} designs from PNG/JPG image files.")
    print(f"Found {missing_printed} PNG-render designs missing a matching JPG printed-photo file.")
    print("JPG-only designs were used as both thumbnail and clicked printed view.")
    print("Wrote site\\gallery.json")
    print("Wrote site\\categories.json")
    print("Wrote site\\collections.json")


if __name__ == "__main__":
    main()