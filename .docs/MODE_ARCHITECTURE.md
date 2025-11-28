# Mode-Based Architecture

## Overview

Edithor now uses a modular mode-based architecture that allows for multiple text processing modes to be added easily. The current "Smart Chunking" mode has been refactored into its own component, and a mode selector has been added to the main page.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Page (+page.svelte)                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ModeSelector Component                  │   │
│  │  - Displays available modes                          │   │
│  │  - Handles mode selection                            │   │
│  │  - Shows active mode indicator                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Selected Mode Component                    │   │
│  │                                                       │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │        ChunkingMode (default)                 │  │   │
│  │  │  - TextInput                                  │  │   │
│  │  │  - ChunkSettings                              │  │   │
│  │  │  - ChunkPreview                               │  │   │
│  │  │  - ExportOptions                              │  │   │
│  │  │  - Instructions                               │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  [Future modes will be added here]                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Main Page (`src/routes/+page.svelte`)

**Responsibilities:**
- Layout and header
- Mode selection state management
- Rendering appropriate mode component
- Footer with privacy notice

**State:**
```typescript
let selectedMode = $state('chunking'); // Current active mode
```

**Functions:**
```typescript
function handleModeChange(mode: string) {
  selectedMode = mode;
}
```

### ModeSelector (`src/lib/components/ModeSelector.svelte`)

**Responsibilities:**
- Display available modes as cards
- Visual indication of selected mode
- Emit mode change events to parent

**Props:**
```typescript
interface Props {
  selectedMode: string;        // Currently selected mode ID
  onModeChange: (mode: string) => void; // Callback when mode changes
}
```

**Mode Definition:**
```typescript
const modes = [
  {
    id: "chunking",
    title: "Smart Chunking",
    description: "Split text intelligently while preserving sentence boundaries",
    icon: "✂️"
  }
  // Add more modes here
];
```

**Features:**
- Grid layout (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
- Hover effects for better UX
- Checkmark indicator on selected mode
- Click to select any mode

### ChunkingMode (`src/lib/components/ChunkingMode.svelte`)

**Responsibilities:**
- All functionality of the original chunking feature
- Self-contained with its own state management
- Input, settings, preview, and export

**State:**
```typescript
let inputText = $state("");
let maxCharacters = $state(500);
let chunks = $state<Chunk[]>([]);
let stats = $state<ChunkStats | undefined>(undefined);
let hasProcessed = $state(false);
```

**Features:**
- TextInput with file upload
- ChunkSettings with validation
- ChunkPreview with statistics
- ExportOptions (single file / ZIP)
- Instructions for new users

## Adding a New Mode

### Step 1: Create Mode Component

Create a new file: `src/lib/components/[YourMode]Mode.svelte`

```svelte
<script lang="ts">
  // Your mode's state and logic here
  let inputText = $state("");
  
  function handleProcess() {
    // Your processing logic
  }
</script>

<div class="space-y-8">
  <!-- Your mode's UI here -->
  <Card>
    <CardHeader>
      <CardTitle>Your Mode Title</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Content -->
    </CardContent>
  </Card>
</div>
```

### Step 2: Register Mode in ModeSelector

Edit `src/lib/components/ModeSelector.svelte`:

```typescript
const modes = [
  {
    id: "chunking",
    title: "Smart Chunking",
    description: "Split text intelligently while preserving sentence boundaries",
    icon: "✂️"
  },
  {
    id: "your-mode",
    title: "Your Mode",
    description: "Description of what your mode does",
    icon: "🎯" // Choose an appropriate emoji
  }
];
```

### Step 3: Add Mode to Main Page

Edit `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import ChunkingMode from '$lib/components/ChunkingMode.svelte';
  import YourMode from '$lib/components/YourMode.svelte';
  
  // ... existing code
</script>

<!-- Render selected mode -->
{#if selectedMode === 'chunking'}
  <ChunkingMode />
{:else if selectedMode === 'your-mode'}
  <YourMode />
{/if}
```

### Step 4: Test Your Mode

1. Run dev server: `bun run dev`
2. Navigate to http://localhost:5173
3. Select your new mode from the mode selector
4. Test functionality
5. Add unit tests if applicable

## Design Principles

### 1. Self-Contained Modes

Each mode component should be fully self-contained:
- Manages its own state
- Handles its own logic
- Includes its own UI elements
- No shared state between modes

### 2. Consistent Layout

All modes should follow the same spacing pattern:
```svelte
<div class="space-y-8">
  <!-- Cards with consistent spacing -->
</div>
```

### 3. Reusable Components

Modes should reuse existing UI components:
- `Card`, `CardHeader`, `CardTitle`, etc.
- `Button`, `Input`, `Label`, `Textarea`
- Any other shadcn-svelte components

### 4. Clear User Feedback

Each mode should provide:
- Clear instructions
- Input validation
- Processing feedback
- Error messages
- Success indicators

## State Management

### Mode Selection State

Managed at the **main page** level:
```typescript
let selectedMode = $state('chunking');
```

**Why?**
- Centralized control
- Easy to persist (localStorage in future)
- Simple routing integration (if needed)

### Mode-Specific State

Managed **within each mode component**:
```typescript
// Inside ChunkingMode.svelte
let inputText = $state("");
let chunks = $state<Chunk[]>([]);
```

**Why?**
- Encapsulation
- No state leaking between modes
- Each mode resets when switching

## Future Enhancements

### Planned Features

1. **Mode Persistence**
   - Save selected mode to localStorage
   - Auto-restore on page reload

2. **Mode-Specific URLs**
   - `/chunking` for chunking mode
   - `/your-mode` for new modes
   - Shareable direct links

3. **Mode Presets**
   - Save mode-specific settings
   - Quick load saved configurations

4. **Mode Categories**
   - Group related modes
   - Tabbed interface for many modes

### Potential New Modes

1. **Text Comparison Mode** 📊
   - Compare two versions of text
   - Highlight differences
   - Export comparison report

2. **Word Counter Mode** 📈
   - Advanced text analytics
   - Reading time estimation
   - Keyword density analysis

3. **Format Converter Mode** 🔄
   - Convert between formats
   - Markdown ↔ Plain text
   - RTF ↔ Plain text

4. **Pronunciation Helper Mode** 🗣️
   - Add phonetic transcriptions
   - Mark difficult words
   - Generate pronunciation guide

5. **Script Timer Mode** ⏱️
   - Estimate reading time
   - Add timing markers
   - Calculate pace

## Best Practices

### Do's ✅

- Keep modes self-contained
- Use consistent card-based layouts
- Provide clear instructions
- Handle errors gracefully
- Add loading states for async operations
- Use semantic HTML
- Follow accessibility guidelines

### Don'ts ❌

- Share state between modes
- Hard-code mode IDs in multiple places
- Forget to update mode selector when adding modes
- Mix mode logic in main page
- Skip error handling
- Ignore responsive design
- Forget to test mode switching

## Testing

### Unit Tests

Test mode-specific logic:
```typescript
// src/lib/components/YourMode.test.ts
import { describe, it, expect } from 'vitest';

describe('YourMode', () => {
  it('should process input correctly', () => {
    // Test logic
  });
});
```

### E2E Tests

Test mode selection and switching:
```typescript
// e2e/modes.spec.ts
import { test, expect } from '@playwright/test';

test('should switch between modes', async ({ page }) => {
  await page.goto('/');
  
  // Click on your mode
  await page.click('text=Your Mode');
  
  // Verify mode is active
  await expect(page.getByText('Your Mode Content')).toBeVisible();
});
```

## Migration Notes

### Previous Architecture

All functionality was in `+page.svelte`:
- 150+ lines of code
- Difficult to extend
- Hard to maintain multiple features

### Current Architecture

Modular and scalable:
- Main page: ~50 lines (layout only)
- ChunkingMode: 150 lines (isolated)
- ModeSelector: 55 lines (reusable)
- Easy to add new modes
- Clear separation of concerns

### Breaking Changes

**None!** The refactoring maintains:
- ✅ Same user experience
- ✅ Same functionality
- ✅ Same API
- ✅ All tests passing (50/50)
- ✅ Build successful

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── ChunkingMode.svelte      # Chunking functionality
│   │   ├── ModeSelector.svelte      # Mode selection UI
│   │   ├── TextInput.svelte         # (used by ChunkingMode)
│   │   ├── ChunkSettings.svelte     # (used by ChunkingMode)
│   │   ├── ChunkPreview.svelte      # (used by ChunkingMode)
│   │   └── ExportOptions.svelte     # (used by ChunkingMode)
│   ├── utils/
│   │   └── chunker.ts               # Core chunking logic
│   └── types/
│       └── index.ts                 # TypeScript types
└── routes/
    └── +page.svelte                 # Main app (mode orchestration)
```

## Summary

The new mode-based architecture provides:

- ✅ **Modularity**: Easy to add new modes
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Can support many modes without complexity
- ✅ **Testability**: Each mode can be tested independently
- ✅ **User Experience**: Smooth mode switching
- ✅ **Developer Experience**: Clear patterns to follow

This architecture sets Edithor up for future growth while maintaining the simplicity and performance of the current implementation.

---

**Status**: ✅ Implemented  
**Version**: 2.0.0  
**Date**: Current  
**Breaking Changes**: None