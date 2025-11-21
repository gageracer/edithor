# Edithor ✂️

A smart text chunking tool designed for breaking down voiceover scripts into AI-friendly bite-sized pieces.

## 🎯 Purpose

Edithor helps you split long voiceover scripts into manageable chunks that AI voiceover tools can process effectively. Unlike simple character-count splitters, Edithor intelligently preserves sentence boundaries, ensuring your chunks never cut off mid-sentence.

## ✨ Features

- **Smart Chunking**: Automatically splits text while respecting sentence boundaries
- **Flexible Input**: Paste text directly or upload a text file
- **Customizable Chunk Size**: Set your preferred character limit (default: 500)
- **Multiple Export Options**:
  - Single file with numbered chunk headers
  - Multiple files bundled in a ZIP download
- **Live Preview**: See your chunks before downloading
- **Dark Mode**: Easy on the eyes with default dark theme
- **Modern UI**: Built with shadcn-svelte components

## 🚀 Quick Start

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to use the app.

### Usage

1. **Input your text**:
   - Paste directly into the text area, or
   - Upload a `.txt` file

2. **Set chunk limit**: 
   - Adjust the character limit (default: 500)
   - Text will be split intelligently without breaking sentences

3. **Preview & Download**:
   - View chunked results in the preview panel
   - Download as a single file with chunk headers
   - Or download as multiple files (ZIP)

## 🛠️ Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5
- **Styling**: Tailwind CSS 4 + shadcn-svelte
- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright

## 📦 Building for Production

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## 🧪 Testing

```sh
# Run all tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e
```

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── TextInput.svelte
│   │   ├── ChunkSettings.svelte
│   │   ├── ChunkPreview.svelte
│   │   └── ExportOptions.svelte
│   ├── utils/
│   │   ├── chunker.ts       # Core chunking logic
│   │   └── fileHandler.ts   # File I/O operations
│   └── types/
│       └── index.ts
└── routes/
    └── +page.svelte         # Main application
```

## 💡 How It Works

Edithor uses an intelligent sentence-boundary detection algorithm:

1. **Parse Text**: Identifies sentence endings (. ! ? followed by space/newline)
2. **Smart Splitting**: Groups sentences into chunks up to the character limit
3. **Boundary Preservation**: Never breaks sentences mid-way - if adding the next sentence exceeds the limit, it starts a new chunk
4. **Export**: Generates files with proper formatting and metadata

## 🎨 Customization

### Chunk Settings
- Adjust character limit (default: 500)
- Future: Custom sentence delimiters, paragraph preservation options

### Export Formats
- **Single File**: All chunks in one file with "Chunk {n}" headers
- **Multiple Files**: Individual txt files bundled in a ZIP archive

## 📝 Development

### Code Quality

```sh
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run check
```

### Adding shadcn-svelte Components

```sh
npx shadcn-svelte@latest add [component-name]
```

## 🚧 Roadmap

- [ ] PDF and DOCX file support
- [ ] Custom delimiter patterns
- [ ] Save/load chunking presets
- [ ] JSON/CSV export options
- [ ] TTS preview for chunks
- [ ] Cloud storage integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

---

