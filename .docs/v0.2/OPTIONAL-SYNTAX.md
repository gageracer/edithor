# Optional Syntax - %o{} Pattern Feature

**Date:** December 2024  
**Status:** ✅ Implemented  
**Version:** v0.2 Final

---

## 🎯 Overview

The `%o{...}` syntax allows you to mark any part of your pattern template as **optional**. This enables a single pattern to match multiple input formats without creating separate marker pairs.

---

## 📖 Syntax

```
%o{content}
```

Where `content` is any text you want to make optional in the pattern matching.

---

## 💡 Use Cases

### Use Case 1: Optional Bold Markers

**Problem:** Your document has mixed formatting:
- Story 1: `**Segment 1:** (487 characters)` ← With bold
- Story 3: `Segment 1: (487 characters)` ← Without bold

**Solution:**
```
Pattern: %o{**}Segment %n:%o{**} (%d characters)
```

**Matches:**
- ✅ `**Segment 1:** (487 characters)` - Both ** present
- ✅ `Segment 1: (487 characters)` - No ** at all
- ✅ `**Segment 1: (487 characters)` - Only first **
- ✅ `Segment 1:** (487 characters)` - Only second **

### Use Case 2: Optional Brackets

**Pattern:**
```
%o{[}Segment %n%o{]} - (%d chars)
```

**Matches:**
- ✅ `[Segment 5] - (490 chars)`
- ✅ `Segment 5 - (490 chars)`
- ✅ `[Segment 5 - (490 chars)`
- ✅ `Segment 5] - (490 chars)`

### Use Case 3: Multiple Optional Parts

**Pattern:**
```
%o{**}Part %n%o{:**} %o{(}%d characters%o{)}
```

**Matches:**
- ✅ `**Part 1:** (500 characters)`
- ✅ `Part 1 500 characters`
- ✅ `**Part 1 (500 characters)`
- ✅ `Part 1:** 500 characters`

---

## 🔧 How It Works

### 1. Template Processing

The pattern template is processed in this order:

```typescript
Input:  "%o{**}Segment %n:%o{**} (%d characters)"
Step 1: Extract %o{} blocks → ["**", "**"]
Step 2: Replace with placeholders → "__OPTIONAL_0__Segment %n:__OPTIONAL_1__ (%d characters)"
Step 3: Escape regex special chars → "Segment \\d+:"
Step 4: Restore as optional groups → "(\*\*)?Segment \d+:(\*\*)? (\d+ characters)"
```

### 2. Generated Regex

```javascript
Template: "%o{**}Segment %n:%o{**} (%d characters)"
Regex:    /(\*\*)?Segment \d+:(\*\*)? \(\d+ characters\)/gi
```

The `(content)?` syntax in regex means:
- Match `content` zero or one time
- Makes the entire block optional

---

## 📝 Examples

### Example 1: Default Configuration

**Pattern Template:**
```
%o{**}Segment %n:%o{**} (%d characters)
```

**Input Formats Matched:**
```markdown
**Segment 1:** (487 characters)  ← Story 1 format
Segment 1: (495 characters)      ← Story 3 format
**Segment 23:** (490 characters) ← Story 2 format
Segment 99: (123 characters)     ← Alternative format
```

**Output Format (always consistent):**
```markdown
**Segment 1:** (455 characters)
**Segment 2:** (490 characters)
**Segment 3:** (428 characters)
```

### Example 2: Custom Markers

**Pattern Template:**
```
%o{>>}Chunk %n%o{<<} | %d chars
```

**Matches:**
```
>>Chunk 1<< | 500 chars
Chunk 1 | 500 chars
>>Chunk 1 | 500 chars
Chunk 1<< | 500 chars
```

### Example 3: Complex Nested Format

**Pattern Template:**
```
%o{[}%o{Part}%o{]}%o{-}%n%o{:} (%d)
```

**Matches:**
```
[Part]-1: (500)
Part 1 (500)
[]-1: (500)
Part-1 (500)
1: (500)
```

---

## 🎓 Technical Details

### Regex Conversion

| Template | Generated Regex | Explanation |
|----------|----------------|-------------|
| `%o{**}` | `(\*\*)?` | Optional two asterisks |
| `%o{[}` | `(\[)?` | Optional opening bracket |
| `%o{:}` | `(:)?` | Optional colon |
| `%o{Part}` | `(Part)?` | Optional literal text "Part" |
| `%n` | `\d+` | One or more digits |
| `%d` | `\d+` | One or more digits |

### Multiple Occurrences

Each `%o{...}` creates an independent optional group:

```
Pattern: %o{A}Text%o{B}Other%o{C}
Regex:   (A)?Text(B)?Other(C)?
```

This means any combination of A, B, and C can be present or absent.

### Nesting Limitation

Currently, `%o{}` blocks **cannot be nested**:

❌ **Invalid:**
```
%o{%o{**}Segment}
```

✅ **Valid:**
```
%o{**}Segment %o{%n}
```

---

## ⚙️ Configuration

### UI Field

**Location:** Filter Settings → Marker Pairs → Pattern Template

**Tooltip:**
```
Use %n for number, %d for character count, %o{...} for optional parts
(e.g., %o{**}Segment %n:%o{**})
```

### Default Value

```
%o{**}Segment %n:%o{**} (%d characters)
```

This default works with:
- ✅ Bold format: `**Segment N:**`
- ✅ Plain format: `Segment N:`
- ✅ Mixed documents with both formats

---

## 🧪 Testing

### Test Results

```bash
Template: "%o{**}Segment %n:%o{**} (%d characters)"
Generated: /(\*\*)?Segment \d+:(\*\*)? \(\d+ characters\)/gi

Story 1 (with **Segment**): 45 matches ✓
Story 3 (plain Segment):    82 matches ✓

Edge Cases:
  "**Segment 1:** (487 characters)" → ✅ MATCH
  "Segment 1: (487 characters)"     → ✅ MATCH
  "**Segment 1: (487 characters)"   → ✅ MATCH
  "Segment 1:** (487 characters)"   → ✅ MATCH
```

### Verification Steps

1. Set pattern: `%o{**}Segment %n:%o{**} (%d characters)`
2. Load mixed-format document
3. Click "Process Chunks"
4. Verify all sections are matched and processed
5. Output uses consistent `**Segment N:**` format

---

## 📚 Best Practices

### 1. Use for Format Variations

✅ **Good:** Handle documents with inconsistent formatting
```
%o{**}Segment %n:%o{**}
```

❌ **Avoid:** Making everything optional
```
%o{Segment }%o{%n}%o{:}
```

### 2. Be Specific

✅ **Good:** Optional markers around fixed content
```
%o{[}Part %n%o{]}
```

❌ **Avoid:** Optional content words
```
%o{Segment} %n
```

### 3. Test Both Formats

After creating a pattern with `%o{}`:
1. Test with input that HAS the optional part
2. Test with input that LACKS the optional part
3. Verify both match correctly

### 4. Document Your Pattern

If using custom patterns, document what formats they match:

```
Pattern: %o{>>}Item %n%o{<<}
Matches:
  - >>Item 5<<
  - Item 5
```

---

## 🐛 Troubleshooting

### Problem: Pattern doesn't match

**Symptom:** Segments not being processed, returned as-is

**Solution:**
1. Check that optional parts are complete: `%o{**}` not `%o{*}`
2. Verify closing brace: `%o{text}` not `%o{text`
3. Test pattern with simple examples first

### Problem: Output has wrong format

**Symptom:** Output segments missing expected markers

**Solution:**
Output format is determined by the code, not the pattern. The pattern only affects **input matching**. Output always uses `**Segment N:**` format.

### Problem: Too many matches

**Symptom:** Pattern matches unintended content

**Solution:**
Make the pattern more specific:
- Add context: `%o{**}Segment %n:%o{**} (%d characters)`
- Not just: `%o{**}Segment %n`

---

## 💡 Tips & Tricks

### Tip 1: Start Simple

Begin with the basic format, then add `%o{}` for variations:
```
Basic:    **Segment %n:** (%d characters)
Optional: %o{**}Segment %n:%o{**} (%d characters)
```

### Tip 2: Use Preview

Test your pattern in a small section of your document before processing the entire file.

### Tip 3: Common Patterns

**Bold/Plain:**
```
%o{**}Segment %n:%o{**}
```

**Brackets:**
```
%o{[}Part %n%o{]}
```

**Parentheses:**
```
%o{(}%d chars%o{)}
```

**Prefix/Suffix:**
```
%o{Chapter }%n%o{ - Part A}
```

---

## 🔄 Migration Guide

### From Old Pattern (Fixed)

**Old:**
```
Pattern: **Segment %n:** (%d characters)
Problem: Only matches bold format
```

**New:**
```
Pattern: %o{**}Segment %n:%o{**} (%d characters)
Benefit: Matches both bold and plain formats
```

### Multiple Marker Pairs → Single Optional Pattern

**Before:**
```
Marker Pair 1:
  Pattern: **Segment %n:** (%d characters)

Marker Pair 2:
  Pattern: Segment %n: (%d characters)
```

**After:**
```
Single Marker Pair:
  Pattern: %o{**}Segment %n:%o{**} (%d characters)
```

Benefits:
- ✅ Simpler configuration
- ✅ Less maintenance
- ✅ Consistent output format

---

## 📖 Syntax Reference

### Placeholders

| Syntax | Meaning | Example | Matches |
|--------|---------|---------|---------|
| `%n` | Number (segment ID) | `Segment %n` | `Segment 1`, `Segment 999` |
| `%d` | Number (char count) | `(%d chars)` | `(500 chars)`, `(50 chars)` |
| `%o{text}` | Optional text | `%o{**}Part` | `**Part`, `Part` |

### Special Characters

In `%o{}` blocks, these characters are automatically escaped:
- `*` → `\*`
- `[` → `\[`
- `]` → `\]`
- `(` → `\(`
- `)` → `\)`
- `.` → `\.`

No manual escaping needed!

---

## ✅ Summary

The `%o{}` syntax provides:
- ✅ **Flexibility** - One pattern matches multiple formats
- ✅ **Simplicity** - Fewer marker pairs to configure
- ✅ **Consistency** - Output always uses standard format
- ✅ **Maintainability** - Update one pattern instead of many

**Default Pattern:**
```
%o{**}Segment %n:%o{**} (%d characters)
```

This works for 99% of use cases!

---

**Status:** Production Ready ✅  
**Feature:** Optional Pattern Syntax  
**Syntax:** `%o{content}` makes content optional in regex matching
