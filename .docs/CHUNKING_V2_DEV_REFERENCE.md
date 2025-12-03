# Chunking v2 - Developer Quick Reference

## 🎯 Quick Summary

The chunking functionality has been migrated to `/chunking` route. The v2 editor is now the main interface with improved chunking algorithm (sentence preservation, hard character limits, section-based processing).

---

## 📁 Files Changed

### Modified Files
```
src/routes/+page.svelte                              # Home page - removed refactoring card
src/routes/chunking/+page.svelte                     # Old route - now redirects to v2
src/routes/chunking/+page.svelte                  # Updated metadata/title
src/lib/components/editor/ChunkEditorLayout.svelte   # Added header with navigation
```

### New Documentation
```
.docs/CHUNKING_V2_MIGRATION.md           # Full migration summary
.docs/MIGRATION_VISUAL_GUIDE.md          # Visual before/after
.docs/CHUNKING_V2_DEV_REFERENCE.md       # This file
```

---

## 🔀 Route Mapping

| URL            | Destination        | Status       |
|----------------|-------------------|--------------|
| `/`            | Home page         | ✅ Updated   |
| `/chunking` | Main editor (v2)  | ✅ Primary   |
| `/chunking`    | → `/chunking`  | 🔄 Redirect  |
| `/refactoring` | Refactoring tool  | 🔒 Hidden    |
| `/history`     | History view      | 🔒 Hidden    |

---

## 🏗️ Component Structure

```
ChunkEditorLayout.svelte (v2 editor)
├─ Header (NEW)
│  ├─ Title: "Text Chunking ✂️"
│  └─ Back link: "← Back to Home"
├─ StatsBar
│  └─ Stats: words, segments, avg size, sessions, chars
├─ Main Grid (2 columns on lg+)
│  ├─ EditorPanel (left)
│  │  ├─ ConfigurationForm
│  │  └─ CodeMirrorEditor
│  └─ FilterPanel (right)
│     ├─ Highlight controls
│     └─ Chunk preview
└─ HistoryTabs (bottom)
   └─ Session history navigation
```

---

## 🔧 Key Architecture Decisions

### 1. Section-Based Processing
- Extract text between start/end markers
- Remove old segment markers
- Normalize content (preserve paragraphs)
- Chunk as single block
- Format output with correct counts

### 2. Hard Character Limit
- `fallbackSplit = false` by default
- Never exceed `maxCharacters`
- Error with preview if continuous text too long
- User must fix input or increase limit

### 3. Sentence Preservation
- Detect sentence boundaries (periods, quotes, etc.)
- Pack sentences greedily until limit would be exceeded
- Keep sentences intact (don't split mid-sentence)

---

## 🧪 Testing

### Build & Run
```bash
# Build (checks compilation)
bun run build

# Dev server (requires Node 20.19+ or 22.12+)
bun run dev

# Preview production build
bun run preview
```

### Manual Test Flow
1. Navigate to `http://localhost:5173/`
2. Click "Start Chunking" → should go to `/chunking`
3. Verify header shows "Text Chunking ✂️" + back link
4. Load `example/writing1.md`
5. Configure:
   - Start: `### Voice Script Segments`
   - End: `### Storyboard Images`
   - Pattern: `%o{**}Segment %n:%o{**} (%d characters)`
   - Limit: `490`
6. Process and verify:
   - No segments exceed 490 characters
   - Sentences are not split mid-sentence
   - Counts match actual content

### E2E Tests
```bash
# Run all E2E tests
bun run test:e2e

# Run specific suite
bun run test:e2e -- editor-v2

# Run with UI
bun run test:e2e -- --ui
```

### Unit Tests
```bash
# Run unit tests
bun test

# Run specific test file
bun test src/lib/utils/chunker.test.ts

# Watch mode
bun test --watch
```

---

## 🐛 Known Issues

### TypeScript Errors
- Pre-existing environment issues (Node version)
- `svelteHTML` errors (type definitions)
- `lucide-svelte` module resolution
- **Not related to migration changes**
- App builds and runs correctly despite these

### Node Version Warning
```
You are using Node.js 20.17.0.
Vite requires Node.js version 20.19+ or 22.12+.
```
- Build succeeds but with warning
- Dev/preview may have issues
- Recommend upgrading Node for best experience

---

## 📝 Code Patterns

### Adding New Routes
```svelte
<!-- src/routes/my-route/+page.svelte -->
<script lang="ts">
  import MyComponent from '$lib/components/MyComponent.svelte';
</script>

<svelte:head>
  <title>My Route - Edithor</title>
  <meta name="description" content="Description here" />
</svelte:head>

<MyComponent />
```

### Creating Redirects
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    goto('/new-route', { replaceState: true });
  });
</script>

<svelte:head>
  <title>Redirecting...</title>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 flex items-center justify-center">
  <p class="text-muted-foreground">Redirecting...</p>
</div>
```

### Adding Navigation Headers
```svelte
<div class="border-b bg-card px-6 py-3">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Page Title ✂️</h1>
    <a href="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
      ← Back to Home
    </a>
  </div>
</div>
```

---

## 🔍 Debugging Tips

### Check Route Resolution
```bash
# List all routes
find src/routes -name "+page.svelte" -o -name "+layout.svelte"
```

### Verify Build Output
```bash
# Check generated routes
ls -la .svelte-kit/output/server/entries/pages/
```

### Check Runtime Errors
1. Open browser DevTools
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Sources tab for source maps

### Test Redirects
```bash
# Using curl
curl -I http://localhost:5173/chunking
# Should show 200 with redirect in client

# Using browser
# 1. Open /chunking
# 2. Check address bar changes to /chunking
# 3. Check Network tab shows navigation
```

---

## 📚 Related Context Files

### Core Algorithm
```
src/lib/utils/chunker.ts               # chunkText() function
src/lib/contexts/editorContext.svelte.ts  # Section processing logic
```

### UI Components
```
src/lib/components/editor/              # All v2 editor components
src/lib/components/ChunkingMode.svelte  # Old v1 component (unused)
src/lib/components/RefactoringMode.svelte # Hidden refactoring component
```

### Tests
```
src/lib/utils/chunker.test.ts          # Unit tests for chunker
e2e/editor-v2.spec.ts                  # E2E tests for v2 editor
e2e/sentence-integrity.spec.ts         # Sentence preservation tests
```

### Documentation
```
.docs/v0.2/CHUNKING-BEHAVIOR.md        # Algorithm details
.docs/v0.2/CHUNKING-FIX-SUMMARY.md     # Sentence preservation fix
.docs/v0.2/v0.2-EDITOR_REDESIGN.md     # Full v2 architecture
```

---

## 🚀 Deployment Checklist

- [ ] Build succeeds (`bun run build`)
- [ ] No new TypeScript errors introduced
- [ ] All routes accessible
- [ ] Redirect works (`/chunking` → `/chunking`)
- [ ] Home page shows single card
- [ ] v2 editor has header with back link
- [ ] Test with real content (writing1.md)
- [ ] Verify character limits enforced
- [ ] Check browser tab titles correct
- [ ] Test on mobile/tablet layouts

---

## 💡 Future Improvements

### Potential Enhancements
- [ ] Add "Pro Tools" menu for refactoring/history
- [ ] Add keyboard shortcuts
- [ ] Add export format presets
- [ ] Add session naming/organization
- [ ] Add drag-and-drop file upload
- [ ] Add progress indicator for large files

### Technical Debt
- [ ] Fix Node version requirement
- [ ] Resolve TypeScript definition errors
- [ ] Add more unit tests for edge cases
- [ ] Improve error messages for long continuous text
- [ ] Add pre-flight validation for inputs

---

## 🆘 Need Help?

### Common Issues

**Q: Build fails with "cannot find module"**
```bash
# Clear cache and reinstall
rm -rf node_modules .svelte-kit
bun install
bun run build
```

**Q: Dev server won't start**
```bash
# Check Node version
node --version
# Upgrade if < 20.19 or < 22.12

# Try clean start
bun run dev
```

**Q: Changes not reflecting**
```bash
# Hard refresh in browser
Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows/Linux)

# Restart dev server
Ctrl+C
bun run dev
```

**Q: Route not found (404)**
```bash
# Check route file exists
ls src/routes/[route-name]/+page.svelte

# Check SvelteKit output
ls .svelte-kit/output/server/entries/pages/
```

### Debug Mode
```bash
# Verbose output
VITE_LOG_LEVEL=info bun run dev

# Show all routes
VITE_DEBUG=true bun run dev
```

---

## 📞 Contact & Resources

- Main thread: "Chunking / Formatting / uiresult.md fixes"
- Architecture: `.docs/v0.2/v0.2-EDITOR_REDESIGN.md`
- Chunking fix: `.docs/v0.2/CHUNKING-FIX-SUMMARY.md`
- SvelteKit docs: https://kit.svelte.dev/docs
- Vite docs: https://vitejs.dev/guide/

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for use  
**Migration:** Complete
