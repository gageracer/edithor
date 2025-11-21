# Edithor - Quick Start Guide

## 🚀 Getting Started

### Installation
```bash
git clone <your-repo>
cd edithor
bun install
```

### Run Development Server
```bash
bun run dev
# Open http://localhost:5173
```

---

## 📝 Common Tasks

### Run Tests
```bash
# All tests
npm test

# Unit tests only
bun run test:unit

# E2E tests only
bun run test:e2e

# Watch mode
bun run test:unit -- --watch
```

### Build for Production
```bash
bun run build
bun run preview  # Test production build
```

### Code Quality
```bash
bun run lint     # Check code style
bun run format   # Format code
bun run check    # Type check
```

---

## 🎯 Using the App

### Basic Workflow
1. **Paste text** or **upload .txt file**
2. **Set character limit** (50-2000, default: 500)
3. **Click "Process Text"**
4. **Preview chunks** with statistics
5. **Download** as single file or ZIP

### Keyboard Shortcuts
- `Tab` - Navigate between fields
- `Enter` - Submit when in text input
- `Escape` - Clear focus

---

## 🛠️ Development

### Project Structure
```
src/
├── lib/
│   ├── components/      # Reusable components
│   ├── utils/          # Core logic
│   └── types/          # TypeScript types
├── routes/
│   └── +page.svelte    # Main app
└── app.css            # Global styles
```

### Adding a New Feature

1. **Create utility function** (if needed)
   ```typescript
   // src/lib/utils/myFeature.ts
   export function myFeature() { }
   ```

2. **Add tests**
   ```typescript
   // src/lib/utils/myFeature.test.ts
   import { test, expect } from 'vitest';
   ```

3. **Create component**
   ```svelte
   <!-- src/lib/components/MyFeature.svelte -->
   <script lang="ts">
     // Component logic
   </script>
   ```

4. **Integrate in main page**
   ```svelte
   <!-- src/routes/+page.svelte -->
   import MyFeature from '$lib/components/MyFeature.svelte';
   ```

### Adding UI Components

Use shadcn-svelte components:
```bash
npx shadcn-svelte@latest add <component-name>
```

Available: button, card, input, label, textarea, and more

---

## 🧪 Testing Guide

### Writing Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Writing E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('should render page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Edithor')).toBeVisible();
});
```

---

## 🎨 Styling

### Using Tailwind Classes
```svelte
<div class="flex gap-4 p-6 bg-card rounded-lg">
  Content
</div>
```

### Dark Mode Colors
CSS variables available:
- `--background` / `--foreground`
- `--card` / `--card-foreground`
- `--primary` / `--primary-foreground`
- `--muted` / `--muted-foreground`
- `--border` / `--input`

### Custom Styles
```css
/* src/app.css */
@layer base {
  .my-class {
    @apply text-foreground bg-muted;
  }
}
```

---

## 🐛 Debugging

### Check Diagnostics
```bash
bun run check
```

### View Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Common Issues

**Problem**: Input fields not visible
**Solution**: Check color classes use `text-foreground` and `bg-muted/30`

**Problem**: Tests failing
**Solution**: Ensure dev server is running for E2E tests

**Problem**: Build fails
**Solution**: Run `bun run check` to find type errors

---

## 📦 Deployment

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy
```

### Manual Deploy
```bash
bun run build
# Upload ./build directory
```

---

## 🔧 Configuration

### Tailwind Config
File: `tailwind.config.js`
- Customize colors
- Add plugins
- Configure purge options

### Vite Config
File: `vite.config.ts`
- Add aliases
- Configure plugins
- Optimize build

### SvelteKit Config
File: `svelte.config.ts`
- Configure adapter
- Add preprocessors
- Set paths

---

## 📚 File Locations

### Main Files
- **Main App**: `src/routes/+page.svelte`
- **Chunker Logic**: `src/lib/utils/chunker.ts`
- **Types**: `src/lib/types/index.ts`
- **Styles**: `src/app.css`

### Tests
- **Unit Tests**: `src/lib/**/*.test.ts`
- **E2E Tests**: `e2e/**/*.spec.ts`

### Documentation
- **User Guide**: `README.md`
- **Project Docs**: `.docs/PROJECT.md`
- **Integration**: `.docs/INTEGRATION.md`
- **This Guide**: `.docs/QUICK_START.md`

---

## 💡 Tips & Tricks

### Performance
- Use `$derived` for computed values
- Avoid unnecessary re-renders
- Keep components small and focused

### Code Organization
- One component per file
- Group related components in folders
- Export from index files

### Testing
- Test behavior, not implementation
- Use descriptive test names
- Keep tests isolated

### Git Workflow
```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

---

## 🆘 Getting Help

### Resources
- **SvelteKit Docs**: https://kit.svelte.dev/
- **Svelte 5 Docs**: https://svelte.dev/docs/svelte/overview
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn-svelte**: https://shadcn-svelte.com/

### Project Documentation
- See `.docs/` folder for detailed guides
- Check comments in code
- Review test files for usage examples

---

## ✅ Checklist

### Before Committing
- [ ] Run tests (`npm test`)
- [ ] Check types (`bun run check`)
- [ ] Format code (`bun run format`)
- [ ] Update docs if needed
- [ ] Test in browser

### Before Deploying
- [ ] All tests passing
- [ ] Build succeeds (`bun run build`)
- [ ] Preview works (`bun run preview`)
- [ ] No console errors
- [ ] Responsive on mobile

---

**Quick Reference Version**: 1.0  
**Last Updated**: Final Release  
**Status**: ✅ Production Ready
