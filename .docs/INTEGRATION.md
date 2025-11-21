# Integration Documentation

## Overview

This document describes how all components of Edithor are integrated together to create a fully functional text chunking application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Main Page                            │
│                    (routes/+page.svelte)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
┌───────────────────┐  ┌─────────────┐  ┌──────────────┐
│   TextInput       │  │ChunkSettings│  │ChunkPreview  │
│   Component       │  │  Component  │  │  Component   │
└───────────────────┘  └─────────────┘  └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Chunker Utility  │
                    │  (utils/chunker) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ExportOptions     │
                    │  Component       │
                    └──────────────────┘
```

## Data Flow

### 1. Input Stage

**User Action**: Paste text or upload file

```typescript
// TextInput.svelte
value = "User's text here...";
onTextChange?.(value); // Notify parent
```

**Main Page Response**:
```typescript
function handleTextChange(text: string) {
  inputText = text;
  // Reset previous results
  hasProcessed = false;
  chunks = [];
  stats = undefined;
}
```

### 2. Configuration Stage

**User Action**: Set character limit

```typescript
// ChunkSettings.svelte
maxCharacters = 500; // Bindable property
```

**Validation**:
- Min: 50 characters
- Max: 2000 characters
- Default: 500 characters

### 3. Processing Stage

**User Action**: Click "Process Text" button

```typescript
// Main Page
function handleProcess() {
  // 1. Validate input
  if (!inputText.trim()) {
    alert("Please enter some text to process.");
    return;
  }

  // 2. Call chunker
  const result = chunkText(inputText, { maxCharacters });
  
  // 3. Update state
  chunks = result.chunks;
  stats = result.stats;
  hasProcessed = true;

  // 4. Scroll to results
  document.getElementById("preview-section")?.scrollIntoView({
    behavior: "smooth"
  });
}
```

**Chunker Logic**:
```typescript
// utils/chunker.ts
export function chunkText(text: string, settings: ChunkSettings): ChunkResult {
  // 1. Detect sentences
  const sentences = detectSentences(text);
  
  // 2. Group into chunks
  const chunks: Chunk[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxCharacters) {
      currentChunk += sentence;
    } else {
      chunks.push(createChunk(id++, currentChunk));
      currentChunk = sentence;
    }
  }
  
  // 3. Calculate statistics
  const stats = calculateStats(chunks);
  
  return { chunks, stats };
}
```

### 4. Preview Stage

**Rendering**:

```svelte
<!-- ChunkPreview.svelte -->
{#if hasChunks && stats}
  <!-- Statistics Cards -->
  <div class="grid grid-cols-5 gap-4">
    <StatCard value={stats.totalChunks} label="Total Chunks" />
    <StatCard value={stats.averageChunkSize} label="Avg Size" />
    <!-- ... more stats ... -->
  </div>

  <!-- Chunk Cards -->
  {#each chunks as chunk}
    <ChunkCard {chunk} />
  {/each}
{/if}
```

### 5. Export Stage

**Single File Download**:

```typescript
// ExportOptions.svelte
function downloadSingleFile() {
  // 1. Format chunks
  const content = exportAsSingleFile(chunks);
  // Format: "Chunk 1\n[text]\n\nChunk 2\n[text]..."
  
  // 2. Create blob
  const blob = new Blob([content], { type: "text/plain" });
  
  // 3. Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "script-chunked.txt";
  link.click();
  URL.revokeObjectURL(url);
}
```

**ZIP Download**:

```typescript
async function downloadZip() {
  // 1. Create ZIP instance
  const zip = new JSZip();
  
  // 2. Prepare files
  const files = prepareMultipleFiles(chunks);
  // Returns: [{ filename: "chunk-1.txt", content: "..." }, ...]
  
  // 3. Add to ZIP
  files.forEach(({ filename, content }) => {
    zip.file(filename, content);
  });
  
  // 4. Generate and download
  const zipBlob = await zip.generateAsync({ type: "blob" });
  // ... trigger download
}
```

## Component Communication

### Parent → Child (Props)

```typescript
// Main page passes data down
<TextInput bind:value={inputText} onTextChange={handleTextChange} />
<ChunkSettings bind:maxCharacters onProcess={handleProcess} disabled={!canProcess} />
<ChunkPreview {chunks} {stats} />
<ExportOptions {chunks} disabled={chunks.length === 0} />
```

### Child → Parent (Callbacks)

```typescript
// TextInput notifies parent of changes
interface Props {
  onTextChange?: (text: string) => void;
}

// Usage
onTextChange?.(newValue);
```

### Reactive State

```typescript
// Main page reactive variables
let inputText = $state("");
let maxCharacters = $state(500);
let chunks = $state<Chunk[]>([]);
let stats = $state<ChunkStats | undefined>(undefined);
let hasProcessed = $state(false);

// Derived values
let canProcess = $derived(inputText.trim().length > 0);
```

## State Management

### Application States

1. **Initial State**
   - No text entered
   - Shows instructions
   - Process button disabled

2. **Text Entered State**
   - Text present in textarea
   - Process button enabled
   - Preview section hidden

3. **Processing State** (brief)
   - Chunker running
   - Button shows loading state

4. **Processed State**
   - Chunks displayed
   - Statistics shown
   - Export buttons enabled

5. **Text Modified State**
   - Previous results cleared
   - Returns to "Text Entered State"

### State Transitions

```
Initial → [User enters text] → Text Entered
Text Entered → [Click Process] → Processing → Processed
Processed → [Modify text] → Text Entered
```

## Error Handling

### Input Validation

```typescript
// Empty text check
if (!inputText.trim()) {
  alert("Please enter some text to process.");
  return;
}

// File type validation
if (!file.type.startsWith('text/')) {
  alert('Please upload a text file (.txt)');
  return;
}

// File size limit
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  alert('File is too large. Maximum size is 5MB.');
  return;
}
```

### Processing Errors

```typescript
try {
  const result = chunkText(inputText, { maxCharacters });
  chunks = result.chunks;
  stats = result.stats;
} catch (error) {
  console.error("Error processing text:", error);
  alert("Failed to process text. Please try again.");
}
```

### Download Errors

```typescript
try {
  // Download logic
  const blob = new Blob([content], { type: "text/plain" });
  // ... download
} catch (error) {
  console.error("Error downloading file:", error);
  alert("Failed to download file. Please try again.");
}
```

## Performance Optimizations

### 1. Derived Values

```typescript
// Only recalculate when dependencies change
let canProcess = $derived(inputText.trim().length > 0);
let hasChunks = $derived(chunks.length > 0);
```

### 2. Conditional Rendering

```typescript
// Only render preview when chunks exist
{#if hasProcessed || chunks.length > 0}
  <ChunkPreview {chunks} {stats} />
{/if}
```

### 3. Scroll Behavior

```typescript
// Smooth scroll to results after processing
setTimeout(() => {
  document.getElementById("preview-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}, 100);
```

### 4. Virtual Scrolling Ready

```svelte
<!-- Preview has max height with scroll -->
<div class="max-h-[600px] overflow-y-auto">
  {#each chunks as chunk}
    <ChunkCard {chunk} />
  {/each}
</div>
```

## File Upload Flow

```
User clicks "Upload File"
       ↓
Hidden input[type="file"] triggered
       ↓
File selected
       ↓
Validate file type (.txt only)
       ↓
Validate file size (max 5MB)
       ↓
FileReader reads as text
       ↓
Text set to textarea value
       ↓
onTextChange callback fired
       ↓
Previous results cleared
```

## Export Flow

### Single File

```
User clicks "Download Single File"
       ↓
exportAsSingleFile() formats chunks
       ↓
Create text/plain Blob
       ↓
Create object URL
       ↓
Create temporary <a> element
       ↓
Trigger download
       ↓
Clean up (remove link, revoke URL)
```

### ZIP Archive

```
User clicks "Download ZIP"
       ↓
Create JSZip instance
       ↓
prepareMultipleFiles() creates file array
       ↓
Add each file to ZIP
       ↓
Generate ZIP blob (async)
       ↓
Create object URL
       ↓
Trigger download
       ↓
Clean up
```

## Security Considerations

### Client-Side Only

- All processing happens in the browser
- No data sent to any server
- No tracking or analytics
- Privacy-first approach

### File Upload Safety

```typescript
// Type checking
if (!file.type.startsWith('text/')) {
  // Reject non-text files
}

// Size limiting
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  // Reject large files
}
```

### XSS Prevention

```svelte
<!-- Text is automatically escaped by Svelte -->
<p>{chunk.content}</p>

<!-- Whitespace preserved without HTML injection -->
<p class="whitespace-pre-wrap">{chunk.content}</p>
```

## Testing Integration

### Unit Tests

✅ Chunker utility (46 tests)
- Sentence detection
- Chunk creation
- Statistics calculation
- Export formatting

### Integration Tests

Recommended tests to add:

```typescript
// Test file upload
it('should load file content into textarea', async () => {
  const file = new File(['test content'], 'test.txt');
  // ... trigger upload
  expect(inputText).toBe('test content');
});

// Test processing flow
it('should process text and show results', () => {
  inputText = "Test sentence.";
  handleProcess();
  expect(chunks.length).toBeGreaterThan(0);
  expect(hasProcessed).toBe(true);
});

// Test download functions
it('should create downloadable file', () => {
  chunks = [/* test chunks */];
  downloadSingleFile();
  // Verify blob creation and download
});
```

## Future Enhancements

### Planned Features

1. **Real-time Preview**
   - Show chunk count as user types
   - Character count per sentence
   - Visual sentence boundaries

2. **Advanced Settings**
   - Custom delimiters
   - Paragraph preservation mode
   - Word-based limits

3. **Export Options**
   - JSON format
   - CSV format
   - Copy to clipboard

4. **UI Improvements**
   - Dark/light theme toggle
   - Keyboard shortcuts
   - Undo/redo functionality

5. **File Support**
   - PDF import
   - DOCX import
   - Multiple file batch processing

## Troubleshooting

### Common Issues

**Issue**: Chunks are too large
- **Solution**: Reduce the character limit or check for very long sentences

**Issue**: File upload not working
- **Solution**: Ensure file is .txt format and under 5MB

**Issue**: Download not triggering
- **Solution**: Check browser download settings and popup blockers

**Issue**: Sentences being split incorrectly
- **Solution**: Check for unusual punctuation or abbreviations

## Development Workflow

### Adding a New Feature

1. **Update types** (if needed)
   - Add interfaces to `src/lib/types/index.ts`

2. **Implement logic**
   - Add utility functions to `src/lib/utils/`
   - Write tests

3. **Create/update component**
   - Build Svelte component in `src/lib/components/`
   - Use existing UI components

4. **Integrate with main page**
   - Import component
   - Add state management
   - Wire up callbacks

5. **Test**
   - Run unit tests
   - Manual testing in browser
   - Check responsiveness

6. **Document**
   - Update this file
   - Add component documentation

---

**Last Updated**: Phase 3 Implementation  
**Status**: ✅ Fully Integrated and Functional  
**Next Phase**: Phase 4 - Polish & Testing
