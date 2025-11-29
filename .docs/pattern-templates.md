# Pattern Template System

## Overview

The Pattern Template system allows you to define flexible segment marker patterns using placeholder syntax. Instead of writing complex regular expressions, you can use simple templates with `%n` or `%d` to represent dynamic numbers.

## Purpose

When working with AI-generated text that contains numbered segments (like "Segment 1:", "Segment 2:", etc.), you need a way to match all segments regardless of their number. The pattern template system makes this easy by letting you specify the pattern once with number placeholders.

## Syntax

### Number Placeholders

- **`%n`** - Matches any number (one or more digits)
- **`%d`** - Matches any number (alias for `%n`, both work identically)

### Example Templates

```
**Segment %n:** (%n characters)
```
This matches:
- `**Segment 1:** (250 characters)`
- `**Segment 22:** (491 characters)`
- `**Segment 100:** (1500 characters)`
- `**Segment 5:**` (character count is optional)

```
Segment %n: (%n characters)
```
This matches:
- `Segment 1: (250 characters)`
- `Segment 22: (491 characters)`
- `Segment 5:` (character count is optional)

```
Chapter %d - Part %d
```
This matches:
- `Chapter 1 - Part 1`
- `Chapter 10 - Part 25`
- `Chapter 999 - Part 1`

## How It Works

1. **Template Parsing**: The system replaces `%n` and `%d` with regex patterns that match numbers
2. **Character Count Optional**: If your template includes `(%n characters)`, it automatically becomes optional
3. **Regex Generation**: The template is converted to a regular expression that matches your pattern with any numbers

### Internal Process

For template: `**Segment %n:** (%n characters)`

1. Placeholders replaced: `**Segment ###NUMBER###:** (###NUMBER### characters)`
2. Character count detected and removed: `**Segment ###NUMBER###:**`
3. Special characters escaped: `\*\*Segment ###NUMBER###:\*\*`
4. Numbers replaced with regex: `\*\*Segment \d+:\*\*`
5. Optional character count added: `\*\*Segment \d+:\*\*\s*(\(\d+\s+characters\))?`

## Usage in RefactoringMode

### Multiple Format Support

You can specify multiple pattern templates to handle different segment formats in the same document:

**Example Configuration:**

1. **Format 1** (Double-star):
   - Start Marker: `**Segment 1:**`
   - Pattern Template: `**Segment %n:** (%n characters)`

2. **Format 2** (Plain):
   - Start Marker: `Segment 1:`
   - Pattern Template: `Segment %n: (%n characters)`

### Best Practices

1. **Be Specific**: Use more specific patterns to avoid false matches
   - ✅ Good: `**Segment %n:**` (won't match plain "Segment" text)
   - ⚠️ Less specific: `Segment %n:` (will match inside `**Segment %n:**`)

2. **Avoid Pattern Conflicts**: If your document has mixed formats, use ONLY the most specific pattern
   - ❌ Don't use both `**Segment %n:**` AND `Segment %n:` together
   - ✅ Use only `**Segment %n:**` if that's the primary format
   - ✅ Add a second pattern only if it's truly distinct (e.g., `Chapter %n:`)

3. **Test Your Patterns**: Use the "Refactor" button to verify your patterns match correctly

4. **Pattern Matching Order**: The system finds ALL markers from ALL patterns and sorts them by position
   - This means less specific patterns will match inside more specific ones
   - Example: `Segment 1:` will match the middle of `**Segment 1:**`
   - Solution: Only define one pattern per segment type

## Examples from Real Documents

### Example 1: AI-Generated Story Segments

**Input Text:**
```
**Segment 1:** (250 characters)
The rain poured down in sheets...

**Segment 2:** (500 characters)
Sarah looked out the window...

**Segment 22:** (491 characters)
They talked late into the night...
```

**Pattern Template:** `**Segment %n:** (%n characters)`

**Result:** All segments detected correctly, numbers extracted automatically

### Example 2: Mixed Format Document

**Input Text:**
```
**Segment 1:** (250 characters)
First section...

Segment 2: (300 characters)
Second section...

**Segment 3:**
Third section without count...
```

**Configuration:**
1. Pattern 1: `**Segment %n:** (%n characters)`
2. Pattern 2: `Segment %n: (%n characters)`

**Result:** Both formats detected, character counts optional

### Example 3: Custom Chapter Format

**Input Text:**
```
Chapter 1 - Part 1
The beginning...

Chapter 1 - Part 2
Continuing...

Chapter 2 - Part 1
New chapter...
```

**Pattern Template:** `Chapter %d - Part %d`

**Result:** All chapter-part combinations matched

## Advanced Features

### Flexible Whitespace

The system handles whitespace variations automatically:
- `**Segment 1:**` (no space after)
- `**Segment 1:** ` (with space after)
- `**Segment 1:** (250 characters)` (with character count)

All variations are matched by the same template: `**Segment %n:** (%n characters)`

### Character Count Optional

When you include `(%n characters)` in your template, the system automatically makes it optional. This means:
- Segments WITH character counts: ✅ Matched
- Segments WITHOUT character counts: ✅ Matched

## Troubleshooting

### Pattern Not Matching

**Problem:** Your segments aren't being detected

**Solutions:**
1. Check for typos in the pattern template
2. Verify special characters match exactly (`**`, `:`, etc.)
3. Use `%n` or `%d` for ALL numbers, not just some
4. Test with a simpler pattern first (e.g., `Segment %n:`)
5. Remove the character count from your template and try just the marker part

### Too Many Matches or Embedded Markers

**Problem:** Pattern matching segments you don't want, or markers appearing inside content

**Solutions:**
1. **Remove conflicting patterns**: If you have both `**Segment %n:**` and `Segment %n:`, remove the less specific one
2. Make your pattern more specific (add more fixed text like `**` or other unique characters)
3. Use ONLY ONE pattern per segment type in your document
4. Check your document - ensure you're not mixing `**Segment N:**` and `Segment N:` formats

### Mixed Results

**Problem:** Some segments match, others don't

**Solutions:**
1. Ensure your pattern matches the ACTUAL format in your document (check for `**` vs plain text)
2. Check for inconsistent formatting in source text (some segments may have extra spaces)
3. Verify character encoding and special characters
4. If truly mixed formats exist, consider normalizing your document to use one format

### Garbage in Output

**Problem:** The exported text has markers embedded in content, or segments are jumbled

**Root Cause:** You likely have multiple conflicting patterns (e.g., both `**Segment %n:**` and `Segment %n:`)

**Solution:**
1. Remove all but the most specific pattern that matches your document
2. Only use `**Segment %n:**` OR `Segment %n:`, not both
3. If your document truly mixes formats, edit it to be consistent first

## Technical Details

### Regular Expression Generation

Templates are converted to JavaScript RegExp objects with:
- **Flags**: `gi` (global, case-insensitive)
- **Escaping**: Special regex characters automatically escaped
- **Flexibility**: Whitespace variations handled

### Supported Patterns

The system supports any text pattern with:
- Fixed text (letters, symbols, spaces)
- Number placeholders (`%n` or `%d`)
- Optional character counts
- Special characters (automatically escaped)

### Limitations

- Only numbers are supported as placeholders (not text)
- Pattern must be consistent (can't match "Segment" OR "Section")
- Each template creates one regex pattern

## See Also

- [Refactoring Mode Documentation](./refactoring-mode.md)
- [Segment Processing](./segment-processing.md)
- [Character Counting](./character-counting.md)
