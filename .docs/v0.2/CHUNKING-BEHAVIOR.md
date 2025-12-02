# Structure-Preserving Chunking Behavior

**Date:** December 2, 2025  
**Version:** v0.2  
**Status:** ✅ Implemented

---

## 🎯 Overview

The v0.2 editor implements **structure-preserving chunking** that maintains document integrity while processing only specific sections. This allows you to have a large document with multiple stories or sections, where only designated segments are chunked.

---

## 📋 How It Works

### 1. Document Structure

Your document can contain:
- **Headers and sections** - Preserved as-is
- **Regular content** - Preserved as-is
- **Marked sections** - Identified by start/end markers
- **Segments within sections** - Only these are chunked

### 2. Processing Flow

```
1. Scan document for sections (start marker → end marker)
2. Within each section, find segment markers
3. Extract content from each segment
4. Chunk content if it exceeds character limit
5. Reconstruct document with chunked content in place
6. Preserve everything else unchanged
```

### 3. Three-Level Hierarchy

```
Document
├── Header/Content (preserved)
├── Section 1 (between start/end markers)
│   ├── Segment 1 marker (preserved)
│   │   └── Content (CHUNKED if > limit)
│   ├── Segment 2 marker (preserved)
│   │   └── Content (CHUNKED if > limit)
│   └── Non-segment content (preserved)
├── More content (preserved)
└── Section 2 (between start/end markers)
    ├── Segment 1 marker (preserved)
    │   └── Content (CHUNKED if > limit)
    └── Segment 2 marker (preserved)
        └── Content (CHUNKED if > limit)
```

---

## 🔧 Configuration

### Marker Pairs

Each marker pair defines a section:

```typescript
{
  id: 1,
  startMarker: '### Voice Script Segments',
  endMarker: '### Storyboard Images',
  patternTemplate: '**Segment %n:** (%d characters)',
  format: 'double-star'
}
```

**Fields:**
- `startMarker` - Where the section begins
- `endMarker` - Where the section ends
- `patternTemplate` - Regex pattern to find segments within section
- `%n` - Placeholder for segment number (e.g., 1, 2, 3)
- `%d` - Placeholder for character count (optional)

### Character Limit

- **Default:** 490 characters
- **Range:** 50-5000 characters
- **Applies to:** Segment content only (not markers)

---

## 📝 Example

### Input Document

```markdown
# My Document

This is an introduction.

## Story 1

### Voice Script Segments

**Segment 1:** (600 characters)
This is a very long segment that exceeds 490 characters. It contains
multiple sentences and paragraphs. The chunking system will break this
into smaller pieces while keeping the segment marker. Lorem ipsum dolor
sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur.

**Segment 2:** (200 characters)
This segment is shorter and won't need chunking. It will remain as a
single chunk since it's under the 490 character limit.

### Storyboard Images

Image descriptions here.

## Story 2

Another section...
```

### Output Document (with 490 char limit)

```markdown
# My Document

This is an introduction.

## Story 1

### Voice Script Segments

**Segment 1:** (600 characters)

Chunk 1:
This is a very long segment that exceeds 490 characters. It contains
multiple sentences and paragraphs. The chunking system will break this
into smaller pieces while keeping the segment marker. Lorem ipsum dolor
sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud

Chunk 2:
exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur.

**Segment 2:** (200 characters)

Chunk 1:
This segment is shorter and won't need chunking. It will remain as a
single chunk since it's under the 490 character limit.

### Storyboard Images

Image descriptions here.

## Story 2

Another section...
```

---

## ✨ Key Features

### 1. Structure Preservation

**Preserved:**
- ✅ All headers (H1, H2, H3, etc.)
- ✅ Content outside marked sections
- ✅ Segment markers themselves
- ✅ Content after end markers
- ✅ Document formatting

**Modified:**
- 🔄 Only segment content (between markers)
- 🔄 Only within marked sections

### 2. Independent Sections

Each section between start/end markers is processed independently:
- Story 1 segments: `**Segment 1:**`, `**Segment 2:**`, ...
- Story 2 segments: `**Segment 1:**`, `**Segment 2:**`, ... (numbering starts over)
- Story 3 segments: `**Segment 1:**`, `**Segment 2:**`, ... (independent again)

### 3. Fallback Behavior

**No sections found:**
- If no start/end markers exist in document
- Entire document is treated as plain text
- Chunked with default formatting: `**Segment N:**`

**No segments found within section:**
- Section content preserved as-is
- No chunking applied

---

## 🎨 Use Cases

### 1. Multiple Story Document

```
Document with 12 different stories
├── Story 1: 5 segments → chunked independently
├── Story 2: 8 segments → chunked independently
├── Story 3: 3 segments → chunked independently
└── ... (each maintains own numbering)
```

### 2. Long Form Writing

```
Novel with chapters
├── Chapter 1
│   ├── Scene segments → chunked
│   └── Scene descriptions → preserved
├── Chapter 2
│   ├── Scene segments → chunked
│   └── Scene descriptions → preserved
└── ...
```

### 3. Script Writing

```
Screenplay
├── Act 1
│   ├── Voice script segments → chunked
│   └── Storyboard images → preserved
├── Act 2
│   ├── Voice script segments → chunked
│   └── Storyboard images → preserved
└── ...
```

---

## 🔍 Technical Details

### Algorithm

```typescript
1. findSections(text)
   - Search for startMarker → endMarker pairs
   - Return array of section boundaries

2. For each section:
   - Extract text between boundaries
   - Find all segment markers using pattern
   - For each segment:
     a. Keep marker intact
     b. Extract content (marker end → next marker)
     c. Chunk content if > maxCharacters
     d. Format chunks as "Chunk N:\n{content}"
   - Reconstruct section with chunks

3. Rebuild document:
   - Content before sections
   - Processed sections
   - Content between sections
   - Content after sections
```

### Segment Pattern Matching

Pattern: `**Segment %n:** (%d characters)`

Matches:
- ✅ `**Segment 1:** (487 characters)`
- ✅ `**Segment 2:** (523 characters)`
- ✅ `**Segment 10:** (234 characters)`
- ✅ `**Segment 1:**` (without character count)

Does NOT match:
- ❌ `Segment 1:` (missing asterisks)
- ❌ `*Segment 1:*` (single asterisks)
- ❌ Plain text mentioning "Segment"

---

## 📊 Example Test Document

See: `.docs/v0.2/test-samples/structured-document.txt`

This document demonstrates:
- 3 independent story sections
- Each with their own segments
- Content preservation between sections
- Proper chunking within segments only

---

## ⚠️ Important Notes

### 1. Marker Pairs Must Be Complete

Both start and end markers are required:
```typescript
startMarker: '### Voice Script Segments'  ✅
endMarker: '### Storyboard Images'         ✅
```

Missing either will skip that section.

### 2. Segment Numbering

Segment numbers in markers are **for display only**:
- They help you visually organize segments
- The system finds ALL matches of the pattern
- Numbering can be sequential or custom
- Each section's segments are processed independently

### 3. Content Between Segments

Text between segment markers is:
- ✅ Preserved if it's whitespace/formatting
- ✅ Kept in output
- 🔄 Not chunked (only segment content is chunked)

### 4. Overlapping Sections

If sections overlap:
- First matching section is processed
- Subsequent sections within it are skipped
- Best practice: Don't overlap sections

---

## 🧪 Testing

### Manual Test

1. Open `/chunking-v2`
2. Paste content from `.docs/v0.2/test-samples/structured-document.txt`
3. Set character limit (e.g., 490)
4. Click "Process Chunks"
5. Verify:
   - Headers preserved
   - Sections identified correctly
   - Segments chunked within sections
   - Other content untouched

### E2E Tests

All tests passing (16/16):
- ✅ Structure preservation
- ✅ Segment detection
- ✅ Chunking logic
- ✅ Fallback behavior

---

## 📈 Performance

**Efficient for:**
- ✅ Documents with 10-50 sections
- ✅ Sections with 5-20 segments each
- ✅ Total document size: 100KB-1MB

**Algorithm Complexity:**
- Section finding: O(n) where n = document length
- Segment matching: O(s × p) where s = sections, p = segments per section
- Overall: Linear with document size

---

## 🚀 Future Enhancements

**Planned:**
- [ ] Custom chunk formatting templates
- [ ] Preserve segment numbering in chunks
- [ ] Nested section support
- [ ] Batch processing multiple documents
- [ ] Export chunks to separate files

**Possible:**
- Preview chunking before applying
- Undo/redo for processing
- Compare original vs chunked side-by-side

---

## 📚 Related Documentation

- `v0.2-EDITOR_REDESIGN.md` - Architecture overview
- `PHASE2-QUICKSTART.md` - Getting started guide
- `test-samples/structured-document.txt` - Example document
- `test-samples/segment-sample.txt` - Simple example

---

**Status:** ✅ Production Ready  
**Last Updated:** December 2, 2025  
**Maintained By:** v0.2 Editor Team
