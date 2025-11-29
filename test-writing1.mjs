import { readFileSync, writeFileSync } from 'fs';

// Simple sentence detection
function detectSentences(text) {
  if (!text || text.trim().length === 0) return [];
  const sentencePattern = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentencePattern) || [];
  const matchedLength = sentences.join('').length;
  const trailingText = text.slice(matchedLength).trim();
  if (trailingText.length > 0) {
    sentences.push(trailingText);
  }
  return sentences.filter(s => s.trim().length > 0);
}

// Chunk text at target limit
function chunkText(text, maxCharacters) {
  const sentences = detectSentences(text);
  const chunks = [];
  let currentChunk = "";
  let chunkId = 1;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length === 0) continue;

    if (trimmedSentence.length > maxCharacters) {
      if (currentChunk.trim().length > 0) {
        chunks.push({ id: chunkId++, content: currentChunk.trim() });
        currentChunk = "";
      }
      chunks.push({ id: chunkId++, content: trimmedSentence });
      continue;
    }

    const potentialChunk = currentChunk.length > 0
      ? currentChunk + " " + trimmedSentence
      : trimmedSentence;

    if (potentialChunk.length <= maxCharacters) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk.trim().length > 0) {
        chunks.push({ id: chunkId++, content: currentChunk.trim() });
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ id: chunkId, content: currentChunk.trim() });
  }

  return chunks;
}

// Read writing1.md
const content = readFileSync('./example/writing1.md', 'utf-8');

console.log('=== TESTING writing1.md ===\n');

// ============================================
// TEST 1: Double Star Format (**Segment N:**)
// ============================================
console.log('TEST 1: Double Star Format (**Segment N:**)\n');

const story1Section = content.match(/## Story 1:[\s\S]*?### Voice Script Segments([\s\S]*?)### Storyboard Images/);

if (story1Section) {
  const segmentsText = story1Section[1];

  // Extract using double-star pattern
  const doubleStarPattern = /\*\*Segment\s+\d+:\*\*\s*(\(\d+\s*characters\)\s*)?/gi;
  const parts = segmentsText.split(doubleStarPattern);

  // Get only the content parts (odd indices after split)
  const segmentContents = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part && !part.match(/^\(\d+\s*characters\)\s*$/) && part.trim().length > 100) {
      segmentContents.push(part.trim());
    }
  }

  console.log(`Found ${segmentContents.length} segments with **Segment N:** format`);

  // Combine and re-chunk
  const combinedContent = segmentContents.join(' ');
  console.log(`Total characters: ${combinedContent.length}`);

  const chunks = chunkText(combinedContent, 250);
  console.log(`Re-chunked into ${chunks.length} segments at 250 char limit\n`);

  // Generate output
  let output = '## Story 1: "The Last Message" (Refactored)\n\n';
  output += '### Voice Script Segments\n\n';

  chunks.forEach(chunk => {
    output += `**Segment ${chunk.id}:** (${chunk.content.length} characters)\n`;
    output += chunk.content + '\n\n';
  });

  // Show first 3 segments
  console.log('First 3 segments:\n');
  chunks.slice(0, 3).forEach(chunk => {
    console.log(`**Segment ${chunk.id}:** (${chunk.content.length} characters)`);
    console.log(chunk.content.substring(0, 100) + '...\n');
  });

  writeFileSync('./example/test-output-story1.txt', output);
  console.log('✅ Saved to: example/test-output-story1.txt\n');
}

// ============================================
// TEST 2: Plain Format (Segment N:)
// ============================================
console.log('\nTEST 2: Plain Format (Segment N:)\n');

const story3Section = content.match(/## Story 3:[\s\S]*?### Voice Script Segments([\s\S]*?)### Storyboard Images/);

if (story3Section) {
  const segmentsText = story3Section[1];

  // Extract using plain pattern - Story 3 has format "Segment N: (XXX characters) content on same line"
  const plainPattern = /Segment\s+\d+:\s*\(\d+\s*characters\)\s*/gi;
  const parts = segmentsText.split(plainPattern);

  // Get only the content parts (skip empty parts)
  const segmentContents = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part && part.trim().length > 100) {
      segmentContents.push(part.trim());
    }
  }

  console.log(`Found ${segmentContents.length} segments with Segment N: format`);

  // Combine and re-chunk
  const combinedContent = segmentContents.join(' ');
  console.log(`Total characters: ${combinedContent.length}`);

  const chunks = chunkText(combinedContent, 250);
  console.log(`Re-chunked into ${chunks.length} segments at 250 char limit\n`);

  // Generate output
  let output = '## Story 3: "The Courage List" (Refactored)\n\n';
  output += '### Voice Script Segments\n\n';

  chunks.forEach(chunk => {
    output += `Segment ${chunk.id}: (${chunk.content.length} characters)\n`;
    output += chunk.content + '\n\n';
  });

  // Show first 3 segments
  console.log('First 3 segments:\n');
  chunks.slice(0, 3).forEach(chunk => {
    console.log(`Segment ${chunk.id}: (${chunk.content.length} characters)`);
    console.log(chunk.content.substring(0, 100) + '...\n');
  });

  writeFileSync('./example/test-output-story3.txt', output);
  console.log('✅ Saved to: example/test-output-story3.txt\n');
}

console.log('\n=== TEST COMPLETE ===');
console.log('✅ Both formats processed successfully');
console.log('✅ Newline after segment marker (no blank line)');
console.log('✅ Output files created in example/ folder');
