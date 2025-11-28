# Button Styling Fix for Landing Page Links

## Problem
The landing page navigation links to `/chunking` and `/refactoring` routes were rendering as plain anchor tags without button styling, making them appear inconsistent with the rest of the UI.

## Solution
Exported the `buttonVariants` function from the button component and applied it to the anchor tags to give them proper button styling.

## Implementation

### Step 1: Export buttonVariants
Modified `src/lib/components/ui/button/button.svelte` to export the variants function:

```svelte
<script lang="ts" context="module">
  import { tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        // ... other variants
      },
      size: {
        default: 'h-10 px-4 py-2',
        // ... other sizes
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });
</script>
```

### Step 2: Export from index.ts
Updated `src/lib/components/ui/button/index.ts`:

```typescript
import Root, { buttonVariants } from './button.svelte';

export {
  Root,
  Root as Button,
  buttonVariants
};
```

### Step 3: Apply to Landing Page Links
Updated `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button';
  // ... other imports
</script>

<!-- Chunking Mode Card -->
<a href="/chunking" class={buttonVariants({ variant: 'default', class: 'w-full' })}>
  Start Chunking
</a>

<!-- Refactoring Mode Card -->
<a href="/refactoring" class={buttonVariants({ variant: 'default', class: 'w-full' })}>
  Start Refactoring
</a>
```

## Benefits

1. **Consistency**: Links now have the same visual appearance as buttons throughout the app
2. **Reusability**: `buttonVariants` can be used anywhere to style anchor tags, divs, or any element as a button
3. **Type Safety**: Full TypeScript support with variant options
4. **Accessibility**: Maintains semantic HTML (anchor tags for navigation) while providing button styling
5. **Maintainability**: All button styling centralized in one place

## Visual Result

**Before**: Plain text links with default anchor styling
```
┌────────────────────────────┐
│ Text Chunking              │
│ • Feature 1                │
│ • Feature 2                │
│ Start Chunking             │  ← Plain link
└────────────────────────────┘
```

**After**: Properly styled buttons
```
┌────────────────────────────┐
│ Text Chunking              │
│ • Feature 1                │
│ • Feature 2                │
│ ┌────────────────────────┐ │
│ │   Start Chunking       │ │  ← Styled as button
│ └────────────────────────┘ │
└────────────────────────────┘
```

## Usage Pattern

This pattern can be reused anywhere in the app:

```svelte
<!-- As a link -->
<a href="/path" class={buttonVariants({ variant: 'default' })}>
  Navigate
</a>

<!-- As a div with click handler -->
<div class={buttonVariants({ variant: 'outline', size: 'sm' })} onclick={handleClick}>
  Click me
</div>

<!-- With custom classes -->
<a href="/path" class={buttonVariants({ variant: 'ghost', class: 'w-full mt-4' })}>
  Custom styled link
</a>
```

## Related Changes
- Part of the larger refactor to separate routes for each mode
- Complements the button styling consistency fix for the Refactor Segments button
- Maintains the design system across all navigation elements