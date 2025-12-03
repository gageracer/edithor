# Chunking v2 Migration - Visual Guide

## Before & After Comparison

### Home Page (`/`)

#### BEFORE (2 cards)
```
┌─────────────────────────────────────────────────────────────┐
│                        Edithor ✂️                           │
│              Smart text chunking for AI tools               │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────────┐
│  ✂️ Text Chunking        │  │  🔄 Segment Refactoring      │
│                          │  │                              │
│  • Preserves sentences   │  │  • Corrects numbering        │
│  • Character limits      │  │  • Updates counts            │
│  • Tolerance settings    │  │  • Preserves metadata        │
│  • Export formats        │  │  • Targeted sections         │
│                          │  │                              │
│  [Start Chunking]  ───>  │  │  [Start Refactoring]         │
│       /chunking          │  │       /refactoring           │
└──────────────────────────┘  └──────────────────────────────┘
```

#### AFTER (1 card, centered)
```
┌─────────────────────────────────────────────────────────────┐
│                        Edithor ✂️                           │
│              Smart text chunking for AI tools               │
└─────────────────────────────────────────────────────────────┘

            ┌──────────────────────────────┐
            │  ✂️ Text Chunking            │
            │                              │
            │  • Preserves sentences       │
            │  • Character limits          │
            │  • Tolerance settings        │
            │  • Export formats            │
            │                              │
            │  [Start Chunking]  ───>      │
            │     /chunking-v2             │
            └──────────────────────────────┘
```

---

### Chunking Route Changes

#### OLD `/chunking` (v1 interface)
```
┌─────────────────────────────────────────────────────────────┐
│  Text Chunking ✂️                                           │
│  Split your text into smart chunks                          │
│                                              ← Back to Home  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Legacy single-panel editor]                               │
│  - ChunkingMode.svelte component                            │
│  - Old chunking algorithm                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### NEW `/chunking` (redirect)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   Redirecting to new editor...              │
│                                                             │
│                   → /chunking-v2                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### NEW `/chunking-v2` (main interface)
```
┌─────────────────────────────────────────────────────────────┐
│  Text Chunking ✂️                        ← Back to Home     │
├─────────────────────────────────────────────────────────────┤
│  12,345 words │ 25 segments │ 490 avg │ 3 sessions │ etc.  │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  📝 EDITOR PANEL         │  🎯 FILTER PANEL                 │
│                          │                                  │
│  [Input text here]       │  [Live preview with highlight]   │
│                          │                                  │
│  • Real-time processing  │  • Segment boundaries            │
│  • CodeMirror editor     │  • Character counts              │
│  • Syntax highlighting   │  • Color-coded chunks            │
│                          │                                  │
├──────────────────────────┴──────────────────────────────────┤
│  📚 HISTORY TABS                                            │
│  [Session 1] [Session 2] [Session 3] ...                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Route Flow Diagram

```
                    USER ENTERS APP
                          │
                          ↓
                    ┌──────────┐
                    │    /     │  (Home Page)
                    └──────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ↓                ↓                ↓
    OLD LINK         NEW LINK         DIRECT URL
   /chunking       /chunking-v2      /refactoring
         │                │                │
         ↓                │                ↓
   ┌──────────┐          │           ┌──────────┐
   │ REDIRECT │          │           │  HIDDEN  │
   └──────────┘          │           │  (works) │
         │                │           └──────────┘
         └────────────────┤
                          ↓
                    ┌──────────┐
                    │chunking  │  (v2 Editor)
                    │   -v2    │
                    └──────────┘
                          │
                          ↓
              ┌───────────────────────┐
              │ IMPROVED CHUNKING     │
              │ • Sentence preservation│
              │ • Hard limit enforce  │
              │ • Section processing  │
              └───────────────────────┘
```

---

## Navigation Structure

### BEFORE
```
Home (/)
├─ Chunking (/chunking) ───> v1 editor
└─ Refactoring (/refactoring) ───> refactoring tool
```

### AFTER
```
Home (/)
└─ Chunking (/chunking-v2) ───> v2 editor (main)
    
Hidden (accessible via direct URL):
├─ /chunking ───> redirects to /chunking-v2
├─ /refactoring ───> still works
└─ /history ───> still works
```

---

## Key Visual Changes

### 1. Home Page Simplification
- ❌ Removed: Segment Refactoring card
- ✅ Changed: Single centered card instead of 2-column grid
- ✅ Updated: Link points to `/chunking-v2`

### 2. Editor Header (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│  Text Chunking ✂️                        ← Back to Home     │
└─────────────────────────────────────────────────────────────┘
    ^                                           ^
    Title (left)                          Navigation (right)
```

### 3. Browser Tab Titles
- Home: "Edithor - Smart Text Chunking Tool"
- v2 Editor: "Text Chunking - Edithor" (UPDATED)
- Old chunking: "Redirecting..." (NEW)

---

## User Experience Flow

```
1. User opens app
   → Sees clean home page with ONE clear option

2. Clicks "Start Chunking"
   → Goes directly to /chunking-v2

3. Sees editor with header
   → "Text Chunking ✂️" + "← Back to Home" link

4. Processes text
   → Uses improved algorithm (sentence preservation)
   → Hard character limit enforcement
   → Section-based processing

5. Returns home
   → Clicks "← Back to Home" in header
```

---

## Hidden Features (Power Users)

Type these URLs directly to access:

- `/refactoring` - Segment refactoring tool
- `/history` - History management view
- `/chunking` - Redirects to v2 (preserves old bookmarks)

---

## Design Rationale

### Why Hide Refactoring?
- Chunking v2 handles the same use case better
- Section processing makes manual refactoring unnecessary
- Reduces cognitive load for new users
- Can be re-added to a "Pro Tools" menu later if needed

### Why Redirect Old Route?
- Preserves existing bookmarks
- Smooth migration path
- No broken links
- Better than 404 or confusion

### Why Add Header?
- Consistency with other pages
- Clear navigation back to home
- Establishes context ("Text Chunking")
- Professional polish

---

## Color Legend (for reference)

- ✅ New/Changed
- ❌ Removed
- 🔄 Modified
- 📝 Editor
- 🎯 Preview
- 📚 History
- ✂️ Chunking
- 🔄 Refactoring (hidden)
