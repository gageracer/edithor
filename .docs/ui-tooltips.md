# UI Tooltips and Help Text Reference

This document catalogs all user-facing help text, tooltips, and descriptions in the Refactoring Mode interface.

## Purpose

Provides a single source of truth for all UI messaging to ensure:
- Consistency across the interface
- Clear, helpful guidance for users
- Easy updates and localization in the future

---

## Input Section

### Card Title
**"Input Segmented Text"**

### Card Description
**"Paste your full document with segments marked like "**Segment 1:** (487 characters)""**

---

## Settings Section

### Card Title
**"Refactoring Settings"**

### Card Description
**"Define where segmentation starts and ends in your document"**

### Segment Marker Patterns

#### Section Label
**"Segment Marker Patterns"**

#### Section Help Text
**"Define how segments are marked in your text. Use `%n` or `%d` in patterns to match any number (e.g., Segment 1, Segment 22, Segment 100)."**

- Uses inline code formatting for `%n` and `%d`
- Provides concrete examples of matching behavior

#### Add Another Format Button
**"+ Add Another Format"**

---

## Individual Marker Configuration

### Format Header
**"Format {index + 1}"**
- Dynamic numbering based on position (Format 1, Format 2, etc.)

### Start Marker Example

#### Field Label
**"Start Marker Example"**

#### Placeholder
**"**Segment 1:** or Segment 1:"**

#### Help Text
**"Example of one marker from your text (for reference only)"**

- Clarifies this is just an example, not the actual pattern

### Pattern Template

#### Field Label
**"Pattern Template:"**

#### Placeholder
**"**Segment %n:** (%n characters)"**

#### Help Text
**"Use `%n` or `%d` as placeholders for any number. Character count is automatically optional."**

- Uses inline code styling for placeholders
- Explains automatic optional behavior for character counts

### End Marker

#### Field Label
**"End Marker"**

#### Placeholder
**"--- or next segment start"**

#### Help Text
**"Text after this marker will be preserved. Leave empty to process until end."**

---

## Character Limit Section

### Field Label
**"Target Character Limit per Segment"**

### Input Field
- Type: number
- Min: 50
- Max: 2000
- Default: 500

### Help Text
**"Segments will be adjusted to match this limit while preserving sentence boundaries"**

---

## Action Buttons

### Refactor Button
**"Refactor"**
- Primary action button
- Enabled when: `inputText.trim().length > 0 && markerPairs.some(pair => pair.startMarker.trim().length > 0)`

### Reset Button
**"Reset"**
- Secondary action button
- Clears all segments and stats

---

## Results Section

### Card Title (when results present)
**"Refactored Segments"**

### Statistics Display
- Shows dynamic stats when available:
  - Total segments count
  - Character count range
  - Average character count

### Export Buttons
**"Copy to Clipboard"**
**"Download as Text File"**

---

## Pattern Template Examples

### Recommended Pattern Examples

1. **Double-star bold format:**
   ```
   Pattern: **Segment %n:** (%n characters)
   Matches: **Segment 1:** (250 characters)
   Matches: **Segment 22:** (491 characters)
   Matches: **Segment 5:**
   ```

2. **Plain format:**
   ```
   Pattern: Segment %n: (%n characters)
   Matches: Segment 1: (250 characters)
   Matches: Segment 22: (491 characters)
   Matches: Segment 5:
   ```

3. **Custom chapter format:**
   ```
   Pattern: Chapter %d - Part %d
   Matches: Chapter 1 - Part 1
   Matches: Chapter 10 - Part 25
   ```

---

## Alert Messages

### No Input Text
**"Please enter segmented text to refactor."**

### No Markers Defined
**"Please specify at least one start marker."**

### No Segments Found
**"No segments found. Check your marker formats."**

### Processing Error
**"Failed to refactor segments. Please check your input format and markers."**

### Copy Success
**"Copied to clipboard!"**

### Copy Failure
**"Failed to copy to clipboard"**

---

## Design Guidelines

### Tone
- Friendly and conversational
- Action-oriented
- Concise but informative

### Code Formatting
- Use inline `<code>` tags with styling for:
  - Placeholder syntax (`%n`, `%d`)
  - Example values
  - Technical terms

### Examples
- Always provide concrete examples
- Use realistic segment numbers (1, 22, 100)
- Show both with and without character counts

### Error Messages
- Clear and actionable
- Suggest what to check or fix
- Avoid technical jargon

---

## Accessibility Notes

- All input fields should have associated labels
- Help text uses `text-muted-foreground` for visual hierarchy
- Code elements have distinct background (`bg-muted`) for readability
- Interactive elements have clear focus states

---

## Future Improvements

Consider adding:
- Inline validation messages
- Pattern testing preview
- More detailed error messages with suggestions
- Tooltips on hover for additional context
- Multi-language support preparation
