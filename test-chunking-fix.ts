import { readFileSync } from 'fs';

// Read the actual writing1.md file
const fileContent = readFileSync('./example/writing1.md', 'utf-8');

// Extract all sections between markers
const START_MARKER = '### Voice Script Segments';
const END_MARKER = '### Storyboard Images';

console.log('=== FINDING LONG SENTENCES IN WRITING1.MD ===\n');

let searchPos = 0;
let sectionIndex = 0;

while (true) {
	const startIdx = fileContent.indexOf(START_MARKER, searchPos);
	if (startIdx === -1) break;

	const endIdx = fileContent.indexOf(END_MARKER, startIdx);
	if (endIdx === -1) break;

	const sectionContent = fileContent.slice(startIdx + START_MARKER.length, endIdx).trim();

	// Extract content by removing old segment markers
	let cleanContent = sectionContent
		.replace(/\*\*Segment \d+:\*\* \(\d+ characters\)/g, '')
		.replace(/^Segment \d+: \(\d+ characters\)/gm, '');

	// Normalize whitespace (like the actual code does)
	cleanContent = cleanContent
		.replace(/\n{2,}/g, ' ')
		.replace(/\n/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	console.log(`\n${'='.repeat(80)}`);
	console.log(`SECTION ${sectionIndex + 1}:`);
	console.log(`${'='.repeat(80)}\n`);

	// Detect sentences using the same pattern as the chunker
	const sentencePattern = /[^.!?]+[.!?]+(?:\s+|$)/g;
	const sentences = cleanContent.match(sentencePattern) || [];

	console.log(`Total sentences detected: ${sentences.length}\n`);

	// Check for long sentences
	let foundLongSentences = false;
	sentences.forEach((sentence, i) => {
		const trimmed = sentence.trim();
		if (trimmed.length > 490) {
			foundLongSentences = true;
			console.log(`❌ SENTENCE ${i + 1}: ${trimmed.length} characters (EXCEEDS 490 LIMIT)`);
			console.log(`   First 100 chars: "${trimmed.slice(0, 100)}..."`);
			console.log(`   Last 100 chars: "...${trimmed.slice(-100)}"`);
			console.log();
		}
	});

	// Check for trailing text without proper ending
	const matchedLength = sentences.join('').length;
	const trailingText = cleanContent.slice(matchedLength).trim();

	if (trailingText.length > 0) {
		console.log(`⚠️  TRAILING TEXT (no sentence ending): ${trailingText.length} characters`);
		if (trailingText.length > 490) {
			console.log(`   ❌ EXCEEDS 490 LIMIT!`);
			foundLongSentences = true;
		}
		console.log(`   Content: "${trailingText.slice(0, 200)}..."`);
		console.log();
	}

	if (!foundLongSentences) {
		console.log('✅ No sentences exceed 490 character limit in this section');
	}

	searchPos = endIdx + END_MARKER.length;
	sectionIndex++;
}

console.log(`\n${'='.repeat(80)}`);
console.log(`\nProcessed ${sectionIndex} sections total.\n`);
