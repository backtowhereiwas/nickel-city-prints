# Hueforge Render + Printed Photo Gallery

This version is customer-facing.

It uses:

```text
.png = artist render / thumbnail card
.jpg = actual printed photo shown after clicking
```

Printable files such as `.stl`, `.3mf`, `.zip`, `.obj`, etc. are ignored completely.

## Filename rules

Best case:

```text
Abu 1.png
Abu 1.jpg
```

Result:

```text
Abu 1.png = thumbnail
Abu 1.jpg = clicked printed-photo view
```

JPG-only fallback:

```text
Some Design.jpg
```

Result:

```text
Some Design.jpg = thumbnail
Some Design.jpg = clicked printed-photo view
```

If a `.png` exists but no matching `.jpg` exists, the card still appears, but the clicked view shows the PNG render and notes that no printed photo is available yet.

## Supported folder patterns

Top-level folder with images directly:

```text
Hueforge
  Pokemon
    Pikachu 1.png
    Pikachu 1.jpg
    Charizard 1.jpg
```

Top-level folder with second-level folders:

```text
Hueforge
  Movies & Cartoons
    Aladdin
      Abu 1.png
      Abu 1.jpg
      Genie 1.jpg
```

## Generate the gallery

From this project folder:

```cmd
python generate_catalog.py "D:\3D Print Files\Hueforge"
```

## Run locally

```cmd
cd site
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```