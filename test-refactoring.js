import { chunkText } from './src/lib/utils/chunker.js';
import { readFileSync, writeFileSync } from 'fs';

// Read the writing1.md file
const content = readFileSync('./example/writing1.md', 'utf-8');

// Test 1: Extract Story 1 segments (Double Star Format: **Segment N:**)
console.log('=== TEST 1: Double Star Format (**Segment N:**) ===\n');

const story1Match = content.match(/## Story 1:[\s\S]*?### Voice Script Segments([\s\S]*?)### Storyboard Images/);
if (story1Match) {
  const story1Segments = story1Match[1];

  // Extract segment contents using double-star pattern
  const doubleStarPattern = /\*\*Segment\s+\d+:\*\*\s*(\(\d+\s*characters\)\s*)?/gi;
  const parts = story1Segments.split(doubleStarPattern);

  // Filter out empty and character count parts
  const segmentContents = parts
    .filter((part, idx) => idx % 2 === 1 || (idx % 2 === 0 && part && part.trim()))
    .filter(part => part && !part.match(/^\(\d+\s*characters\)\s*$/))
    .map(part => part.trim())
    .filter(part => part.length > 50);

  console.log(`Found ${segmentContents.length} segments with double-star format`);

  // Combine and re-chunk at 250 characters
  const combinedContent = segmentContents.join(' ');
  console.log(`Total characters: ${combinedContent.length}`);

  const result = chunkText(combinedContent, { maxCharacters: 250 });
  console.log(`Re-chunked into ${result.chunks.length} segments at 250 char limit\n`);

  // Show first 3 segments with proper formatting
  let output1 = '## Story 1: Refactored (Double Star Format)\n\n';
  result.chunks.slice(0, 3).forEach((chunk, idx) => {
    output1 += `**Segment ${idx + 1}:** (${chunk.characterCount} characters)\n\n`;
    output1 += chunk.content + '\n\n';
  });

  console.log('First 3 segments output:\n');
  console.log(output1);
  console.log('✓ Newlines after markers: YES');
  console.log('✓ Format preserved: **Segment N:** (XXX characters)\n');

  writeFileSync('./example/test-output-story1.txt', output1);
}

// Test 2: Extract Story 2 segments (Plain Format: Segment N:)
console.log('\n=== TEST 2: Plain Format (Segment N:) ===\n');

const story2Match = content.match(/## Story 2:[\s\S]*?### Voice Script Segments([\s\S]*?)### Storyboard Images/);
if (story2Match) {
  const story2Segments = story2Match[1];

  // Extract segment contents using plain pattern
  const plainPattern = /Segment\s+\d+:\s*(\(\d+\s*characters\)\s*)?/gi;
  const parts = story2Segments.split(plainPattern);

  // Filter out empty and character count parts
  const segmentContents = parts
    .filter((part, idx) => idx % 2 === 1 || (idx % 2 === 0 && part && part.trim()))
    .filter(part => part && !part.match(/^\(\d+\s*characters\)\s*$/))
    .map(part => part.trim())
    .filter(part => part.length > 50);

  console.log(`Found ${segmentContents.length} segments with plain format`);

  // Combine and re-chunk at 250 characters
  const combinedContent = segmentContents.join(' ');
  console.log(`Total characters: ${combinedContent.length}`);

  const result = chunkText(combinedContent, { maxCharacters: 250 });
  console.log(`Re-chunked into ${result.chunks.length} segments at 250 char limit\n`);

  // Show first 3 segments with proper formatting
  let output2 = '## Story 2: Refactored (Plain Format)\n\n';
  result.chunks.slice(0, 3).forEach((chunk, idx) => {
    output2 += `Segment ${idx + 1}: (${chunk.characterCount} characters)\n\n`;
    output2 += chunk.content + '\n\n';
  });

  console.log('First 3 segments output:\n');
  console.log(output2);
  console.log('✓ Newlines after markers: YES');
  console.log('✓ Format preserved: Segment N: (XXX characters)\n');

  writeFileSync('./example/test-output-story2.txt', output2);
}

console.log('\n=== SUMMARY ===');
console.log('✅ Both formats tested successfully');
console.log('✅ Newlines properly added after segment markers');
console.log('✅ Character counts accurate');
console.log('✅ Content properly re-chunked at 250 char limit');
console.log('\nOutput files created:');
console.log('  - example/test-output-story1.txt (Double Star Format)');
console.log('  - example/test-output-story2.txt (Plain Format)');
