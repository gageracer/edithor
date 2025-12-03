# Highlighting Feature - Quick Start Guide

**🎯 Goal:** See your segment markers highlighted in real-time as you type!

---

## 🚀 5-Minute Quick Start

### Step 1: Open the Editor
```
Navigate to: http://localhost:5173/chunking
```

### Step 2: Paste Sample Text
Copy this sample text into the left editor panel:

```markdown
### Voice Script Segments

**Segment 1:** (245 characters)
Welcome to our platform! This is the first segment of our voice script.
It demonstrates how the chunking system works with visual highlights.
Each segment should be clearly marked and highlighted in blue.

**Segment 2:** (198 characters)
This is the second segment. Notice how each segment marker follows the
pattern defined in the filter panel. The system uses regex automatically.

**Segment 3:** (312 characters)
The third segment shows how longer content is handled. The highlighting
should span the entire marker text including asterisks, segment number,
and character count. This helps you identify where each segment begins.

### Storyboard Images
```

### Step 3: See the Magic ✨
You should immediately see:
- 🔵 **Blue highlights** on the `**Segment N:**` markers
- ✓ **Feedback badge** in the right panel: "✓ Detecting 3 segment(s) in editor"

---

## 🎨 What You'll See

### Visual Appearance

```
┌──────────────────────────────────────────────────────────────┐
│ Original Text                              [Show Result]      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ### Voice Script Segments                                    │
│                                                               │
│ 🔵 **Segment 1:** (245 characters) 🔵  ← HIGHLIGHTED IN BLUE│
│ Welcome to our platform! This is the first segment...        │
│                                                               │
│ 🔵 **Segment 2:** (198 characters) 🔵  ← HIGHLIGHTED IN BLUE│
│ This is the second segment. Notice how each...               │
│                                                               │
│ 🔵 **Segment 3:** (312 characters) 🔵  ← HIGHLIGHTED IN BLUE│
│ The third segment shows how longer content...                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Feedback Badge

In the Filter Panel (right side), you'll see:

```
┌─────────────────────────────────────────┐
│ Pattern Template                        │
│ [**Segment %n:** (%d characters)]      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Detecting 3 segment(s) in editor  │ │ ← Green badge
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🧪 Try It Yourself

### Experiment 1: Change the Pattern
1. Find "Pattern Template" in right panel
2. Change to: `Part %n (%d chars)`
3. Watch highlights **disappear** (pattern doesn't match)
4. Change back to: `**Segment %n:** (%d characters)`
5. Watch highlights **reappear** instantly!

### Experiment 2: Add a New Segment
1. Type in the editor:
   ```
   **Segment 4:** (100 characters)
   This is a new segment I just added.
   ```
2. Watch the blue highlight appear as you type!
3. Badge updates: "✓ Detecting 4 segment(s) in editor"

### Experiment 3: Test Invalid Pattern
1. Clear the pattern template field
2. Badge changes to: "⚠ Invalid pattern template"
3. All highlights disappear
4. Restore pattern to see highlights again

---

## 🎯 Pattern Template Cheat Sheet

### Basic Syntax

| Placeholder | Meaning | Example Match |
|-------------|---------|---------------|
| `%n` | Segment number | `1`, `2`, `42` |
| `%d` | Character count | `245`, `100` |
| `%o{text}` | Optional text | Makes `text` optional |

### Common Patterns

#### Default Format
```
Template: **Segment %n:** (%d characters)
Matches:  **Segment 1:** (245 characters)
```

#### Without Asterisks
```
Template: Segment %n: (%d characters)
Matches:  Segment 1: (245 characters)
```

#### Optional Asterisks (Flexible!)
```
Template: %o{**}Segment %n:%o{**} (%d characters)
Matches:  **Segment 1:** (245 characters)
          Segment 1: (245 characters)
          **Segment 1:** (245 characters)
```

#### Custom Format
```
Template: Part %n (%d chars)
Matches:  Part 1 (100 chars)
```

#### Simple Format
```
Template: %n. (%d)
Matches:  1. (245)
```

---

## 🐛 Troubleshooting

### ❌ Problem: No highlights appear

**Check:**
- ✓ You're in "Original Text" view (not "Result")
- ✓ Pattern template is not empty
- ✓ Text contains matching segments
- ✓ Pattern matches your actual format

**Try:**
1. Use default pattern: `**Segment %n:** (%d characters)`
2. Paste sample text from above
3. Refresh browser if needed

### ❌ Problem: Wrong segments highlighted

**Check:**
- ✓ Spacing matches exactly (e.g., `: (` vs `:(`)
- ✓ Asterisks match (e.g., `**` vs `*`)
- ✓ Case sensitivity (pattern is case-insensitive)

**Try:**
1. Use `%o{**}` for optional asterisks
2. Simplify pattern to test
3. Compare highlighted text to pattern

### ❌ Problem: Badge shows wrong count

**Check:**
- ✓ Hidden segments outside visible area
- ✓ Duplicate patterns in text
- ✓ Pattern matching unintended text

**Try:**
1. Scroll through entire document
2. Make pattern more specific
3. Check for false positives

---

## 💡 Pro Tips

### Tip 1: Validate Before Processing
Always check the feedback badge shows expected count before clicking "Process Chunks"

### Tip 2: Use Optional Syntax
Pattern: `%o{**}Segment %n:%o{**}` works with or without asterisks

### Tip 3: Test with Small Sample
Start with 2-3 segments to test pattern before processing full document

### Tip 4: Watch Real-Time Updates
Type pattern slowly to see highlights update character-by-character

### Tip 5: Dark Mode Friendly
Toggle dark mode (Ctrl+Shift+D) - highlights adapt automatically

---

## 📊 Visual Feedback States

### ✅ Success State (Green)
```
┌─────────────────────────────────────┐
│ ✓ Detecting 5 segment(s) in editor │  ← Segments found!
└─────────────────────────────────────┘
```

### ⚠️ Warning State (Yellow)
```
┌─────────────────────────────────────┐
│ ⚠ Invalid pattern template         │  ← Pattern error
└─────────────────────────────────────┘
```

### ⚪ Neutral State
```
No badge shown = No text in editor or result view active
```

---

## 🎓 Learning Path

### Beginner
1. ✅ Use default pattern
2. ✅ Paste sample text
3. ✅ See blue highlights
4. ✅ Verify badge count

### Intermediate
1. ✅ Modify pattern template
2. ✅ Use optional syntax `%o{}`
3. ✅ Add custom segments
4. ✅ Watch real-time updates

### Advanced
1. ✅ Create complex patterns
2. ✅ Combine multiple markers
3. ✅ Test edge cases
4. ✅ Optimize for your workflow

---

## 📝 Common Use Cases

### Use Case 1: Validate AI Output
**Scenario:** AI generated segments, need to verify format
**Solution:** Paste output, check all segments highlighted

### Use Case 2: Fix Formatting
**Scenario:** Some segments not detected, need to fix
**Solution:** Find unmarked segments, correct format, see highlight appear

### Use Case 3: Test New Pattern
**Scenario:** Want to use custom segment format
**Solution:** Edit pattern, test with 1-2 segments, verify highlights

### Use Case 4: Quality Check
**Scenario:** Processing 50+ segments, ensure all correct
**Solution:** Visual scan for blue highlights, confirm badge count

---

## 🚀 Next Steps

After mastering highlighting:

1. **Process Chunks** - Click button to generate final output
2. **Toggle Views** - Switch between Original and Result
3. **Save to History** - Store configurations for reuse
4. **Export Results** - Copy formatted output

---

## 📚 Related Docs

- `REALTIME_HIGHLIGHTING_FEATURE.md` - Full technical documentation
- `v0.2/HIGHLIGHTING-TEST.md` - Comprehensive test guide
- `v0.2/OPTIONAL-SYNTAX.md` - Pattern template syntax details

---

## ✨ Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│ HIGHLIGHTING QUICK REFERENCE                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ What: Real-time blue highlights on segment markers     │
│ Where: Left editor panel (Original Text view)          │
│ When: Updates as you type                              │
│                                                         │
│ Pattern Placeholders:                                   │
│   %n  = Segment number                                  │
│   %d  = Character count                                 │
│   %o{text} = Optional text                              │
│                                                         │
│ Default Pattern:                                        │
│   **Segment %n:** (%d characters)                       │
│                                                         │
│ Feedback Badge:                                         │
│   ✓ = Segments detected                                │
│   ⚠ = Invalid pattern                                  │
│                                                         │
│ Colors:                                                 │
│   Light mode: Light blue bg + blue border              │
│   Dark mode: Dark blue bg + blue border                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Ready to go?** Open `/chunking` and paste the sample text above! 🎉
