# Refactoring Mode Documentation

## Overview

The **Refactoring Mode** is designed to help you adjust pre-segmented text to match proper character limits. This is especially useful when you have text that's already been segmented (e.g., by AI) but the character counts are incorrect or inconsistent.

## Key Features

- **Preserves Non-Segment Content**: Story titles, metadata, storyboards, and other content outside segment markers remain untouched
- **Smart Sentence Boundaries**: Uses the same intelligent chunking algorithm as the main mode—no tolerance needed
- **Flexible Markers**: Define custom start and end markers to precisely target the segmented section
- **Automatic Re-numbering**: All segments are renumbered sequentially after refactoring

## Use Case

You have a document like this:

```
## Story 1: "The Last Message"

**Theme:** Mystery/Romance
**Duration:** 15-20 minutes

### Voice Script Segments

**Segment 1:** (487 characters)
Text here but AI miscounted...

**Segment 2:** (512 characters)
More text with wrong character count...

---

### Storyboard Images

**Image 1: The First Meeting**
Description here...
```

The AI incorrectly counted characters or split segments awkwardly. Refactoring Mode will:
1. Preserve the header and metadata
2. Extract and re-chunk only the segmented section
3. Apply proper character limits with sentence boundary preservation
4. Preserve the storyboard section at the end
5. Output correctly numbered segments with accurate character counts

## How It Works

### 1. Define Boundaries

**Start Marker**: The exact text that begins your segmented section
- Default: `**Segment 1:**`
- Everything before this marker is preserved as-is

**End Marker**: The exact text that ends your segmented section
- Default: `---`
- Everything after this marker is preserved as-is
- Leave empty to process until end of file

### 2. Processing Flow

```
Input Document
    ↓
1. Extract content BEFORE start marker → Preserve
2. Extract content BETWEEN markers → Process
3. Extract content AFTER end marker → Preserve
    ↓
Process Segmented Section:
    ↓
4. Find all segment markers: **Segment N:** (XXX characters)
5. Extract text content between markers
6. For each segment's text:
   - Apply smart chunking algorithm
   - Respect sentence boundaries
   - Target character limit
7. Re-number all segments sequentially
8. Calculate accurate character counts
    ↓
9. Reassemble: Before + Processed + After
    ↓
Output Complete Document
```

### 3. Segment Pattern Recognition

The tool automatically detects segments matching this pattern:

```
**Segment [number]:** ([number] characters)
[content]
```

Pattern details:
- Starts with `**Segment`
- Followed by one or more digits
- Followed by `:**`
- Followed by character count in parentheses `(XXX characters)`
- Content continues until next segment marker or end marker

## Settings

### Start Marker
- **Default**: `**Segment 1:**`
- **Purpose**: Identifies where segmentation begins
- **What to put**: The exact text of your first segment marker
- **Example**: If your segments start with `### Part 1:`, use that

### End Marker
- **Default**: `---`
- **Purpose**: Identifies where segmentation ends
- **What to put**: The exact text that marks the end of segments
- **Common values**: `---`, `### Storyboard`, `---\n\n### Images`
- **Leave empty**: To process until end of document

### Target Character Limit
- **Default**: 500
- **Range**: 50-2000
- **Purpose**: Desired character count per segment
- **Behavior**: Segments will be as close as possible without breaking sentences

## Smart Chunking (No Tolerance Needed)

Unlike simple character splitting, the refactoring mode uses the proven chunking algorithm:

1. **Sentence Detection**: Identifies sentence endings (. ! ?)
2. **Intelligent Grouping**: Combines sentences up to the character limit
3. **Overflow Handling**: If a sentence is too long, it becomes its own segment
4. **No Breaking**: Sentences are NEVER cut mid-way

This means you don't need a "tolerance" setting—the algorithm naturally handles edge cases.

## Complete Example

### Input Document

```
## Story 1: "The Last Message"

**Theme:** Mystery/Romance
**Video Title:** "She Disappeared After Sending This Text"
**Duration:** 15-20 minutes

### Voice Script Segments

**Segment 1:** (487 characters)
I met Sarah on a Tuesday. Not through an app—at a coffee shop, like people used to. She was reading a book with a coffee-stained cover, and when our eyes met, she smiled like she'd been expecting me. I know how that sounds. Like something from a romance novel. But that's exactly how it felt. I sat down two tables away, pretending to work on my laptop while sneaking glances. After twenty minutes, she walked over and said, "You're not actually working. Your screen's been on the same page this whole time."

**Segment 2:** (492 characters)
I laughed, caught. "Guilty. I'm Tom." "Sarah," she said, extending her hand. Her grip was firm, confident. We talked for three hours straight. The barista had to kick us out at closing. We exchanged numbers in the parking lot under flickering streetlights. As she drove away, I remember thinking this was the beginning of something important. I had no idea how right I was. Or how wrong everything would go. That first night, she texted me: "Thanks for making my Tuesday less ordinary."

---

### Storyboard Images

**Image 1: The First Meeting**
Warm, golden afternoon light streaming through large windows...
```

### Settings
- Start Marker: `**Segment 1:**`
- End Marker: `---`
- Target Limit: 250 characters

### Output Document

```
## Story 1: "The Last Message"

**Theme:** Mystery/Romance
**Video Title:** "She Disappeared After Sending This Text"
**Duration:** 15-20 minutes

### Voice Script Segments

**Segment 1:** (248 characters)
I met Sarah on a Tuesday. Not through an app—at a coffee shop, like people used to. She was reading a book with a coffee-stained cover, and when our eyes met, she smiled like she'd been expecting me. I know how that sounds. Like something from a romance novel.

**Segment 2:** (237 characters)
But that's exactly how it felt. I sat down two tables away, pretending to work on my laptop while sneaking glances. After twenty minutes, she walked over and said, "You're not actually working. Your screen's been on the same page this whole time."

**Segment 3:** (147 characters)
I laughed, caught. "Guilty. I'm Tom." "Sarah," she said, extending her hand. Her grip was firm, confident. We talked for three hours straight.

**Segment 4:** (247 characters)
The barista had to kick us out at closing. We exchanged numbers in the parking lot under flickering streetlights. As she drove away, I remember thinking this was the beginning of something important. I had no idea how right I was.

**Segment 5:** (112 characters)
Or how wrong everything would go. That first night, she texted me: "Thanks for making my Tuesday less ordinary."

---

### Storyboard Images

**Image 1: The First Meeting**
Warm, golden afternoon light streaming through large windows...
```

## Statistics Dashboard

After processing, you'll see:
- **Total Segments**: Number of segments created
- **Average Characters**: Mean segment length
- **Largest**: Size of biggest segment
- **Smallest**: Size of smallest segment
- **Total Characters**: Overall segmented text length

Each segment shows:
- **Character count**: Exact length
- **Sentence count**: Number of sentences
- **Status indicator**:
  - 🟢 **Within limit**: ≤ target character limit
  - 🟠 **Over limit**: > target (unavoidable due to long sentence)

## Export Options

### Download
Saves the complete document (before + refactored segments + after) as a `.txt` file

### Copy to Clipboard
Copies the entire document for quick pasting elsewhere

## Best Practices

### 1. Choose Precise Markers

✅ **Good**: `**Segment 1:**` (exact match)
❌ **Bad**: `Segment` (too generic, might match other text)

✅ **Good**: `---` (clear delimiter)
❌ **Bad**: `.` (matches sentence endings)

### 2. Verify Marker Locations

Before processing:
1. Search for your start marker in the document
2. Search for your end marker
3. Ensure the segment section is between them

### 3. Choose Appropriate Limits

- **Voiceover scripts**: 400-600 characters (comfortable reading pace)
- **Social media**: 100-280 characters (platform limits)
- **Subtitle chunks**: 150-300 characters (screen readability)
- **General reading**: 500-1000 characters (paragraph size)

### 4. Review Before Exporting

Always check the preview:
- Are segments properly split?
- Do character counts look accurate?
- Is any content missing?
- Are non-segment sections preserved?

## Troubleshooting

### "Could not find the start marker"

**Cause**: The start marker text doesn't match exactly

**Solution**:
- Copy the exact text from your document
- Include all formatting: `**`, spaces, colons
- Check for extra spaces or special characters

### "No segments found"

**Cause**: Segments don't match the expected pattern

**Solution**:
- Ensure segments follow: `**Segment N:** (XXX characters)`
- Check that `**` and `:**` are present
- Verify there's a number after "Segment"

### "Content is missing after processing"

**Cause**: End marker might be wrong or missing

**Solution**:
- Verify the end marker appears in your document
- Try leaving end marker empty to process everything
- Check for typos in the end marker

### "Some segments are over the limit"

**Cause**: Individual sentences exceed the character limit

**Solution**:
- This is normal for very long sentences
- The algorithm won't break sentences mid-way
- Consider manually breaking up long sentences in source
- Or increase the character limit

## Technical Details

### Pattern Matching

The tool uses regex to find segments:
```javascript
/\*\*Segment\s+\d+:\*\*\s*\(\d+\s*characters\)\s*/gi
```

This matches:
- `**Segment` (literal)
- One or more spaces
- One or more digits (segment number)
- `:**` (literal)
- Optional spaces
- `(` + digits + `characters)`
- Optional trailing spaces

### Content Preservation

Three sections are maintained:
1. **Before Content**: Everything before start marker
2. **Segmented Content**: Extracted and processed
3. **After Content**: Everything after end marker

Final output: `before + processed + after`

### Chunking Algorithm

Uses the same algorithm as Smart Chunking mode:
1. Detect sentences via punctuation patterns
2. Group sentences optimally up to character limit
3. Handle edge cases (long sentences, abbreviations)
4. Never break sentences

See `src/lib/utils/chunker.ts` for implementation details.

## Comparison Table

| Feature | Smart Chunking | Segment Refactoring |
|---------|----------------|---------------------|
| **Input** | Raw unsegmented text | Pre-segmented document |
| **Markers** | None | Required (start/end) |
| **Purpose** | Initial segmentation | Fix existing segments |
| **Content Outside Markers** | N/A | Preserved as-is |
| **Character Counts** | Generated | Corrected |
| **Use Case** | New content | AI-generated content with errors |
| **Output Structure** | Segments only | Complete document |

## Common Workflows

### Workflow 1: AI-Generated Scripts

1. AI generates story with segments
2. Character counts are wrong
3. Paste entire document into Refactoring Mode
4. Set markers to target segment section
5. Process and download corrected version

### Workflow 2: Batch Processing

1. Combine multiple stories in one file
2. Process each story's segments separately
3. Use different start markers for each story
4. Export and split by story

### Workflow 3: Format Conversion

1. Have segments in different format
2. Convert to standard format manually
3. Use Refactoring Mode to normalize
4. All segments now follow same pattern

## Tips & Tricks

### Multiple Documents

Process them separately or use unique markers for each section

### Non-Standard Numbering

The tool re-numbers sequentially, so original numbering doesn't matter

### Preserving Metadata

Place all metadata before the start marker—it will be preserved

### Testing Markers

Try processing with a small sample first to verify markers work correctly

## Limitations

- Only processes one segment section per run
- Segment pattern must match: `**Segment N:** (XXX characters)`
- Start and end markers must be exact text matches (not regex)
- No undo functionality (save original before processing)

## Future Enhancements

Planned features:
- [ ] Custom segment pattern regex
- [ ] Multiple segment sections in one document
- [ ] Undo/redo functionality
- [ ] Real-time preview while typing
- [ ] Batch file processing
- [ ] Export to JSON/CSV
- [ ] Segment merging/splitting tools

---

**Mode**: Segment Refactoring  
**Status**: ✅ Stable  
**Version**: 2.0  
**Last Updated**: Current