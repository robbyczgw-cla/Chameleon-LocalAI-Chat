# PWA Icons Guide

Für die vollständige PWA-Funktionalität benötigst du folgende Icon-Dateien im `/public` Ordner:

## Erforderliche Icons

### 1. **icon-192.png** (192x192px)
- Standard-Icon für Android und Progressive Web Apps
- Format: PNG
- Größe: 192x192 Pixel
- Hintergrund: Kann transparent sein oder Markenfarbe (#f97316)

### 2. **icon-512.png** (512x512px)
- Hochauflösendes Icon für bessere Qualität
- Format: PNG
- Größe: 512x512 Pixel
- Hintergrund: Kann transparent sein oder Markenfarbe (#f97316)

### 3. **apple-touch-icon.png** (180x180px)
- Speziell für iOS/Safari
- Format: PNG
- Größe: 180x180 Pixel
- Hintergrund: NICHT transparent (iOS unterstützt keine Transparenz)
- Empfohlen: Abgerundete Ecken nicht notwendig (iOS macht das automatisch)

### 4. **favicon.ico** (Optional)
- Klassisches Favicon für Browser-Tabs
- Format: ICO
- Größe: 32x32, 48x48, 64x64 (Multi-Size ICO)

## Design-Richtlinien

### Empfohlenes Design:
- **Hauptfarbe**: Orange (#f97316) - Brand Color
- **Akzentfarbe**: Violet (#7c3aed)
- **Icon-Motiv**: Sparkles (✨) oder Chat-Bubble mit KI-Symbol
- **Stil**: Modern, gradientenbasiert, flaches Design

### Beispiel-Icon-Ideen:
1. **Sparkles Icon**: ✨ auf orangem Hintergrund mit Gradient
2. **Chat Bubble**: Sprechblase mit kleinem Gehirn/Chip-Symbol
3. **AI Robot**: Minimalistischer Roboter-Kopf
4. **Gradient Circle**: Abstrakter Kreis mit orange-violet Gradient

## Tools zum Erstellen:

### Online-Tools:
- **Figma/Canva**: Design erstellen
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator

### Command Line (wenn du ein SVG hast):
```bash
# Mit ImageMagick Icons generieren
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 180x180 apple-touch-icon.png
```

## Quick Start mit Placeholder:

Wenn du schnell starten willst, kannst du temporär diese einfachen Icons verwenden:

1. Erstelle ein 512x512px Bild mit:
   - Orange Background (#f97316)
   - Großes ✨ Emoji in der Mitte
   - Oder Text "AI" in weißer Schrift

2. Resize es für die anderen Größen

3. Die App funktioniert auch ohne Icons, zeigt aber dann nur Standard-Browser-Icons

## Screenshots (Optional aber empfohlen):

Für ein besseres PWA-Installationserlebnis:

### screenshot-wide.png (1280x720px)
- Desktop-Screenshot der App
- Zeigt den Advanced Mode mit Chat

### screenshot-narrow.png (720x1280px)
- Mobile-Screenshot der App
- Zeigt den Simple Mode oder Chat-Ansicht

Diese werden im App-Store/Install-Dialog angezeigt!

---

**Status**: Icons sind aktuell **nicht vorhanden**. Die App läuft, aber Browser zeigen Placeholder-Icons.

**Nächster Schritt**: Erstelle die Icons mit deinem bevorzugten Design-Tool und platziere sie in `/public`.
