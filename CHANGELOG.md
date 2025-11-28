# Changelog

All notable changes to Edithor will be documented in this file.

## [Unreleased] - 2025-01-XX

### Added
- **Separate Routes for Each Mode**: Each mode now has its own dedicated route
  - `/` - Landing page with mode selection cards
  - `/chunking` - Text Chunking mode
  - `/refactoring` - Segment Refactoring mode
  - Added lucide-svelte icons for visual mode representation
  - Mode selection links styled as buttons using exported `buttonVariants` function

### Changed
- **Improved Button Styling**: 
  - Refactor Segments button now matches the Process Text button style
  - Uses `variant="outline"` for consistency
  - Includes sparkle emoji (✨) for visual appeal
  - Centered alignment matching the chunking mode
  - Landing page navigation links now properly styled as buttons
  - Exported `buttonVariants` function from button component for reuse across the app

### Fixed
- **Fixed Tiny Segment Issue**: Resolved problem where refactoring could create unacceptably small segments (e.g., 54 characters)
  - Changed refactoring algorithm to combine ALL segment content before re-chunking
  - Previously: Each old segment was re-chunked individually, causing tiny leftover fragments
  - Now: All segments are merged into continuous text, then re-chunked as a whole
  - This ensures all output segments respect the character limit properly
  - Example: A 54-character fragment is now properly combined with surrounding text

### Technical Details

#### Route Architecture
```
src/routes/
  +page.svelte          # Landing page with mode cards (links styled as buttons)
  chunking/
    +page.svelte        # Chunking mode page
  refactoring/
    +page.svelte        # Refactoring mode page
```

#### Button Styling Architecture
The `buttonVariants` function is now exported from the button component using `context="module"`:
```javascript
// button.svelte
<script lang="ts" context="module">
  export const buttonVariants = tv({ ... });
</script>

// Can be imported and used anywhere:
import { buttonVariants } from '$lib/components/ui/button';
<a href="/path" class={buttonVariants({ variant: 'default' })}>Link</a>
```

#### Refactoring Algorithm Fix
**Before:**
```javascript
for (const segmentText of segmentContents) {
  const result = chunkText(segmentText, { maxCharacters: targetCharLimit });
  // Each segment re-chunked separately - causes tiny fragments
}
```

**After:**
```javascript
const combinedContent = segmentContents.join(' ');
const result = chunkText(combinedContent, { maxCharacters: targetCharLimit });
// All content combined first - prevents tiny fragments
```

### Removed
- Removed obsolete `ModeSelector.svelte` component (replaced by route-based navigation)

## [1.0.0] - Initial Release

### Features
- Text Chunking mode for splitting scripts into AI-voiceover-friendly segments
- Segment Refactoring mode for correcting AI-generated segment markers
- Character limit configuration with tolerance settings
- Export to multiple formats (TXT, ZIP)
- Sentence boundary preservation
- Client-side processing (privacy-focused)