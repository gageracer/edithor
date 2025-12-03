# Marker Configuration Guide

**Date:** December 2024  
**Purpose:** Clear explanation of the three marker types and how to configure them correctly

---

## ⚠️ Common Mistake: Wrong Marker Configuration

**WRONG Configuration (causes all stories to merge):**
```
Start Marker: **Segment 1:** (487 characters)
End Marker: \n
Pattern: **Segment %n:** (%d characters)
```

**Why this is wrong:**
- The start marker `**Segment 1:**` is an **individual segment marker**, not a section boundary
- The end marker `\n` (newline) is too generic and matches immediately
- This finds ZERO valid sections, causing fallback mode which chunks the ENTIRE document

**Result:**
- ❌ Story 1 and Story 2 merge together
- ❌ Storyboard Images get segment numbers
- ❌ Production Metadata gets chunked
- ❌ "And we never let go" flows directly into "It started small"

---

## ✅ Understanding the Three Marker Types

### 1. Start Marker (Section Boundary)
**Purpose:** Defines WHERE a chunkable section begins  
**Example:** `### Voice Script Segments`

This is a **section header** that marks the beginning of content you want to chunk.

### 2. End Marker (Section Boundary)
**Purpose:** Defines WHERE a chunkable section ends  
**Example:** `### Storyboard Images`

This is a **section header** that marks the end of content you want to chunk. Everything between Start and End markers will be processed.

### 3. Pattern Template (Individual Segment Marker)
**Purpose:** Identifies **individual segments** WITHIN the section to combine and re-chunk  
**Example:** `**Segment %n:** (%d characters)`

This matches existing segment markers in your input. The algorithm will:
1. Find all segments matching this pattern
2. Extract their content
3. Combine all content together
4. Re-chunk with your character limit
5. Apply new sequential numbering

---

## ✅ Correct Configuration

```
Start Marker: ### Voice Script Segments
End Marker: ### Storyboard Images
Pattern: **Segment %n:** (%d characters)
Max Characters: 490
```

### How it Works:

#### Input Document Structure:
```markdown
## Story 1: "The Last Message"

### Voice Script Segments

**Segment 1:** (487 characters)
[content of segment 1]

**Segment 2:** (492 characters)
[content of segment 2]

...

**Segment 45:** (497 characters)
[content of segment 45]

---

### Storyboard Images

**Image 1:** [description]
**Image 2:** [description]

---

### Production Metadata
[metadata content]

---

## Story 2: "The Algorithm"

### Voice Script Segments

**Segment 1:** (495 characters)
[content]
...
```

#### Processing Steps:

1. **Find Section Boundaries:**
   - Start: `### Voice Script Segments` (line 16)
   - End: `### Storyboard Images` (line 155)
   - Section contains all 45 segments from Story 1

2. **Extract Segment Contents:**
   - Find all `**Segment N:** (N characters)` markers
   - Extract the text content after each marker
   - Stop at `---` separator or next segment marker
   - Collect 45 segment contents

3. **Combine and Re-chunk:**
   - Join all 45 contents with `\n\n` separators
   - Combined text: ~21,000 characters
   - Chunk with 490 character limit
   - Result: ~46 optimally-sized chunks (avg 455 chars)

4. **Output with New Numbering:**
   ```markdown
   ### Voice Script Segments
   
   **Segment 1:** (480 characters)
   [combined content from multiple input segments]
   
   **Segment 2:** (490 characters)
   [more combined content]
   
   ...
   
   **Segment 46:** (386 characters)
   [final chunk]
   
   ---
   
   ### Storyboard Images  ← UNCHANGED!
   ```

5. **Preserve Non-Section Content:**
   - Storyboard Images: completely unchanged
   - Production Metadata: completely unchanged
   - All `---` separators: preserved
   - Story headers: preserved

6. **Repeat for Each Story:**
   - Story 2 processes its own `### Voice Script Segments` section
   - Segment numbering resets to 1 for each story
   - Each story is isolated and processed independently

---

## 🎯 Pattern Template Syntax

The pattern template uses placeholders:
- `%n` = segment number (1, 2, 3, ...)
- `%d` = character count

### Common Patterns:

```
**Segment %n:** (%d characters)
→ Matches: **Segment 1:** (487 characters)

Segment %n: (%d chars)
→ Matches: Segment 1: (487 chars)

[%n] (%d)
→ Matches: [1] (487)

Part %n
→ Matches: Part 1
```

**Note:** The pattern is converted to a regex internally:
- `**Segment %n:** (%d characters)` becomes `/\*\*Segment \d+:\*\* \(\d+ characters\)/`
- Numbers (`%n` and `%d`) match `\d+` (one or more digits)

---

## 📋 Configuration Checklist

Before processing, verify:

- [ ] **Start Marker** is a section header (e.g., `### Voice Script Segments`)
- [ ] **End Marker** is a different section header (e.g., `### Storyboard Images`)
- [ ] **Pattern** matches your segment markers exactly
- [ ] **Max Characters** is appropriate for your use case (e.g., 490)
- [ ] Test with a small document first

---

## 🔍 Testing Your Configuration

### Test File Structure:

Create a test file with this structure:

```markdown
### Voice Script Segments

**Segment 1:** (100 characters)
Test content one. This is the first segment with exactly one hundred characters to test chunking behavior.

**Segment 2:** (50 characters)
Short segment here that will be combined.

**Segment 3:** (75 characters)
Another segment that should be combined with others for optimal chunk size.

---

### Storyboard Images

This content should NOT be changed or numbered.
```

### Expected Output:

```markdown
### Voice Script Segments

**Segment 1:** (225 characters)
Test content one. This is the first segment with exactly one hundred characters to test chunking behavior.

Short segment here that will be combined.

Another segment that should be combined with others for optimal chunk size.

---

### Storyboard Images

This content should NOT be changed or numbered.
```

Notice:
- ✅ All 3 input segments combined into 1 output segment
- ✅ Total characters = 100 + 50 + 75 = 225
- ✅ Storyboard section unchanged
- ✅ Separator preserved

---

## 🐛 Troubleshooting

### Problem: Stories are merging together

**Cause:** Wrong start/end markers (likely using segment markers instead of section headers)

**Fix:** Use section headers:
```
Start: ### Voice Script Segments
End: ### Storyboard Images
```

### Problem: Storyboard Images getting segment numbers

**Cause:** No valid sections found, falling back to full-document chunking

**Fix:** Verify markers exist in your document exactly as specified

### Problem: Segments not being combined

**Cause:** Separator detection stopping too early, or wrong pattern

**Fix:** 
1. Check pattern matches your segment markers exactly
2. Verify max characters setting is appropriate
3. Check for `---` separators in unexpected places

### Problem: Empty segments or content loss

**Cause:** Pattern too broad, matching non-segment content

**Fix:** Make pattern more specific:
- `**Segment %n:**` is better than `Segment %n`
- Include character count: `**Segment %n:** (%d characters)`

---

## 💡 Best Practices

1. **Use Descriptive Section Headers:**
   - Good: `### Voice Script Segments`, `### Storyboard Images`
   - Bad: `### Content`, `###`

2. **Make Pattern Specific:**
   - Good: `**Segment %n:** (%d characters)`
   - Bad: `Segment %n` (too generic, might match other text)

3. **Test with Small Documents First:**
   - Create a 3-story test file
   - Verify each story is processed independently
   - Check boundaries are preserved

4. **Document Your Format:**
   - Save your marker configuration
   - Include examples of valid input structure
   - Note any special formatting requirements

5. **Use Clear Separators:**
   - `---` between sections
   - Blank lines between segments
   - Consistent formatting throughout

---

## 📚 Examples

### Example 1: Standard Format (Used in writing1.md)

```markdown
## Story 1: "Title"

### Voice Script Segments

**Segment 1:** (487 characters)
Content here...

**Segment 2:** (492 characters)
More content...

---

### Storyboard Images

---

### Production Metadata

---
```

**Configuration:**
```
Start: ### Voice Script Segments
End: ### Storyboard Images
Pattern: **Segment %n:** (%d characters)
```

### Example 2: Alternative Format

```markdown
# Chapter 1

## Dialogue Segments

[Segment 1] (250 chars)
Text content...

[Segment 2] (300 chars)
More text...

## Stage Directions

---
```

**Configuration:**
```
Start: ## Dialogue Segments
End: ## Stage Directions
Pattern: [Segment %n] (%d chars)
```

---

## ⚙️ Default Configuration

The editor initializes with these defaults:

```typescript
{
  startMarker: '### Voice Script Segments',
  endMarker: '### Storyboard Images',
  patternTemplate: '**Segment %n:** (%d characters)',
  maxCharacters: 490
}
```

These defaults work with the `writing1.md` example file structure.

---

## 🎓 Key Takeaways

1. **Start/End markers** define section boundaries (where to chunk)
2. **Pattern template** identifies individual segments within sections
3. **Section boundaries** should be headers like `### Section Name`
4. **Segment markers** should be inline like `**Segment N:**`
5. **Test configuration** before processing large documents
6. **Each story** is processed independently when properly configured

---

**Status:** ✅ Configuration Guide Complete  
**Next:** Configure your markers correctly and test with sample data
