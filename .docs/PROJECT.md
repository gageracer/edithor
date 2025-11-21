# Edithor - Project Documentation

## Overview

**Edithor** is a web-based text chunking application designed to split long voiceover scripts into consumable chunks for AI voiceover tools. The key differentiator is intelligent sentence-boundary detection to ensure no sentences are cut in the middle.

## Problem Statement

AI voiceover tools often have character or word limits for processing text. When users manually split scripts, they risk:
- Breaking sentences mid-thought
- Losing context between chunks
- Spending time on tedious manual splitting

Edithor automates this process while maintaining semantic integrity.

## User Flow

```
1. Landing Page
   ↓
2. Input Method Selection
   ├─→ Paste Text (textarea)
   └─→ Upload File (.txt)
   ↓
3. Configure Chunk Settings
   - Set character limit (default: 500)
   ↓
4. Process & Preview
   - View chunked results
   - See chunk count and stats
   ↓
5. Export
   ├─→ Single File (with "Chunk {n}" headers)
   └─→ Multiple Files (ZIP download)
```

## Core Features

### 1. Input Methods
- **Text Area**: Direct paste/type support
- **File Upload**: `.txt` file support with FileReader API

### 2. Smart Chunking Algorithm
- Target character limit (configurable)
- Sentence boundary detection (. ! ? followed by space/newline)
- Rules:
  - If adding next sentence exceeds limit, start new chunk
  - Never break sentences mid-way
  - Preserve paragraph breaks where possible
  
### 3. Preview System
- Display all chunks in collapsible/expandable cards
- Show chunk number, character count per chunk
- Total stats (total chunks, total characters)

### 4. Export Options
- **Single File**: 
  - Format: "Chunk 1\n[text]\n\nChunk 2\n[text]..."
  - Download as `script-chunked.txt`
  
- **Multiple Files**:
  - Individual files: `chunk-1.txt`, `chunk-2.txt`, etc.
  - Bundled in ZIP using JSZip library
  - Download as `script-chunks.zip`

### 5. UI/UX
- Dark theme by default
- shadcn-svelte components for consistency
- Responsive design (mobile-friendly)
- Clear visual feedback for actions

## Technical Architecture

### Tech Stack
- **Frontend**: SvelteKit 2 + Svelte 5
- **Styling**: Tailwind CSS 4 + shadcn-svelte
- **Language**: TypeScript
- **Bundler**: Vite

### Key Libraries
- `jszip`: For creating ZIP archives
- `file-saver`: For triggering downloads
- shadcn-svelte components: Button, Card, Textarea, Label, Slider, Input

### File Structure
```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── TextInput.svelte # Input component
│   │   ├── ChunkSettings.svelte
│   │   ├── ChunkPreview.svelte
│   │   └── ExportOptions.svelte
│   ├── utils/
│   │   ├── chunker.ts       # Core chunking logic
│   │   └── fileHandler.ts   # File I/O operations
│   └── types/
│       └── index.ts         # TypeScript interfaces
└── routes/
    └── +page.svelte         # Main application page
```

## Data Models

### Chunk Interface
```typescript
interface Chunk {
  id: number;
  content: string;
  characterCount: number;
  sentenceCount: number;
}
```

### ChunkSettings Interface
```typescript
interface ChunkSettings {
  maxCharacters: number;
  preserveParagraphs: boolean;
  customDelimiters?: string[];
}
```

### ChunkStats Interface
```typescript
interface ChunkStats {
  totalChunks: number;
  totalCharacters: number;
  averageChunkSize: number;
  largestChunk: number;
  smallestChunk: number;
}
```

## Implementation Plan

### Phase 1: Setup & UI Foundation ⚙️
- [ ] Install shadcn-svelte and configure
- [ ] Set up dark theme as default
- [ ] Create basic page layout
- [ ] Implement TextInput component (textarea + file upload)

**Estimated Time**: 2-3 hours

### Phase 2: Core Chunking Logic 🧠
- [ ] Write sentence detection algorithm
- [ ] Implement chunk splitting with limit
- [ ] Add unit tests for chunker utility
- [ ] Handle edge cases (very long sentences, no punctuation)

**Estimated Time**: 3-4 hours

### Phase 3: Preview System 👁️
- [ ] Create ChunkPreview component
- [ ] Display chunks with metadata
- [ ] Add collapsible sections for large chunk counts
- [ ] Show statistics (total chunks, avg size, etc.)

**Estimated Time**: 2-3 hours

### Phase 4: Export Functionality 💾
- [ ] Single file export (plain text)
- [ ] Multiple file export (ZIP)
- [ ] Install and integrate JSZip
- [ ] Add download triggers

**Estimated Time**: 2-3 hours

### Phase 5: Polish & Testing ✨
- [ ] Responsive design tweaks
- [ ] Add loading states
- [ ] Error handling (file too large, invalid format)
- [ ] E2E tests with Playwright
- [ ] Performance optimization for large texts

**Estimated Time**: 3-4 hours

**Total Estimated Time**: 12-17 hours

## Algorithm Details

### Sentence Detection Logic

```typescript
function detectSentences(text: string): string[] {
  // Match sentences ending with . ! ? followed by space or newline
  const sentencePattern = /[^.!?]+[.!?]+(?=\s|$)/g;
  return text.match(sentencePattern) || [];
}
```

### Chunking Algorithm

```typescript
function chunkText(text: string, maxChars: number): Chunk[] {
  const sentences = detectSentences(text);
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let chunkId = 1;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // If single sentence exceeds limit, add it as its own chunk
    if (trimmedSentence.length > maxChars) {
      if (currentChunk) {
        chunks.push(createChunk(chunkId++, currentChunk));
        currentChunk = '';
      }
      chunks.push(createChunk(chunkId++, trimmedSentence));
      continue;
    }

    // Try adding sentence to current chunk
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;
    
    if (potentialChunk.length <= maxChars) {
      currentChunk = potentialChunk;
    } else {
      // Current chunk is full, start new one
      chunks.push(createChunk(chunkId++, currentChunk));
      currentChunk = trimmedSentence;
    }
  }

  // Add remaining chunk
  if (currentChunk) {
    chunks.push(createChunk(chunkId, currentChunk));
  }

  return chunks;
}
```

## Edge Cases to Handle

1. **Very long sentences**: Sentences exceeding the character limit should become their own chunk
2. **No punctuation**: Text without sentence delimiters should be split at word boundaries
3. **Multiple consecutive delimiters**: Handle "..." or "!!!" correctly
4. **Abbreviations**: Dr. Mrs. etc. should not trigger sentence breaks
5. **Empty input**: Handle gracefully with appropriate messaging
6. **Large files**: Show loading state and handle memory efficiently
7. **Special characters**: Unicode, emojis, etc. should be counted correctly

## Testing Strategy

### Unit Tests
- Sentence detection with various punctuation
- Chunk splitting with different limits
- Edge case handling (empty text, very long sentences)
- Character counting accuracy

### Integration Tests
- File upload and reading
- Chunk preview rendering
- Export functionality (single file and ZIP)

### E2E Tests (Playwright)
- Complete user flow: input → configure → preview → download
- File upload workflow
- Different export options
- Responsive design on mobile

## Performance Considerations

- **Large texts**: Use Web Workers for chunking if text > 100KB
- **Preview rendering**: Virtual scrolling for 100+ chunks
- **File handling**: Stream large files instead of loading entirely
- **ZIP creation**: Generate ZIP in chunks to avoid memory issues

## Future Enhancements (v2)

### Short-term
- [ ] Multiple file format support (PDF, DOCX)
- [ ] Custom sentence delimiter patterns
- [ ] Save/load chunking presets
- [ ] Export to JSON/CSV for API integration

### Long-term
- [ ] Chunk preview with TTS playback
- [ ] Cloud storage integration
- [ ] Collaboration features (share chunked scripts)
- [ ] API endpoint for programmatic access
- [ ] Browser extension for quick chunking

## Deployment

### Recommended Platforms
- **Vercel**: Zero-config deployment for SvelteKit
- **Netlify**: Easy CI/CD integration
- **Cloudflare Pages**: Fast global CDN

### Environment Variables
None required - fully client-side application

### Build Command
```sh
npm run build
```

### Output Directory
```
build/
```

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast for dark mode
- Focus indicators

## Security Considerations

- All processing happens client-side (no data sent to servers)
- File upload validation (size limits, file type checking)
- XSS prevention (sanitize file names for ZIP)
- No external API calls or tracking

---

**Project Start Date**: TBD  
**Target Launch**: TBD  
**Maintainer**: @canaygin
