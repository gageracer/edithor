#!/usr/bin/env node

/**
 * Test script for segment extraction logic
 * Tests the fixed extractSegmentContent function
 */

// Helper function to escape special regex characters
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Convert pattern template with %n/%d placeholders to regex
function templateToRegex(template) {
	// First, replace %n or %d with a placeholder marker before escaping
	let pattern = template.replace(/%[nd]/g, '###NUMBER###');

	// Check if template has character count pattern
	const hasCharCount = pattern.includes('(###NUMBER### characters)');

	// If template has character count, remove it temporarily
	if (hasCharCount) {
		pattern = pattern.replace(/\s*\(###NUMBER### characters\)\s*/, '');
	}

	// Escape special regex characters
	pattern = escapeRegex(pattern);

	// Replace number placeholders with regex pattern for one or more digits
	pattern = pattern.replace(/###NUMBER###/g, '\\d+');

	// If there was a character count in the template, add it as optional with flexible whitespace
	if (hasCharCount) {
		pattern = pattern + '\\s*(\\(\\d+\\s+characters\\))?';
	}

	return new RegExp(pattern, 'gi');
}

// Fixed extractSegmentContent function
function extractSegmentContent(segmentedSection, pattern) {
	const segments = [];

	// Find all marker matches with their positions
	const markers = [];
	let match;
	const globalPattern = new RegExp(pattern.source, 'gi');

	while ((match = globalPattern.exec(segmentedSection)) !== null) {
		markers.push({
			index: match.index,
			match: match[0]
		});
	}

	// If no markers found, return empty
	if (markers.length === 0) {
		return [];
	}

	// Extract content between each marker and the next
	for (let i = 0; i < markers.length; i++) {
		const currentMarker = markers[i];
		const nextMarker = markers[i + 1];

		// Start after the current marker
		const contentStart = currentMarker.index + currentMarker.match.length;

		// End at the next marker (or end of text if this is the last)
		const contentEnd = nextMarker ? nextMarker.index : segmentedSection.length;

		// Extract and clean the content
		const content = segmentedSection.substring(contentStart, contentEnd).trim();

		if (content.length > 0) {
			segments.push(content);
		}
	}

	return segments;
}

// Unified extraction that handles all patterns together
function extractSegmentContentUnified(segmentedSection, patterns, endMarker) {
	const segments = [];

	// Find all marker matches from ALL patterns with their positions
	const markers = [];

	patterns.forEach((pattern, patternIndex) => {
		let match;
		const globalPattern = new RegExp(pattern.source, 'gi');

		while ((match = globalPattern.exec(segmentedSection)) !== null) {
			markers.push({
				index: match.index,
				match: match[0],
				patternIndex
			});
		}
	});

	// If no markers found, return empty
	if (markers.length === 0) {
		return [];
	}

	// Sort markers by position (so we process them in document order)
	markers.sort((a, b) => a.index - b.index);

	// Create end marker regex (handle special case for newline)
	let endPattern;
	if (endMarker === '\\n' || endMarker.trim() === '') {
		// Use newline as delimiter
		endPattern = /\n/;
	} else {
		// Use the provided end marker
		endPattern = new RegExp(escapeRegex(endMarker), 'i');
	}

	// Extract content from each marker to its end marker
	for (let i = 0; i < markers.length; i++) {
		const currentMarker = markers[i];

		// Start after the current marker
		const contentStart = currentMarker.index + currentMarker.match.length;

		// Find the end marker after this start marker
		const remainingText = segmentedSection.substring(contentStart);
		const endMatch = remainingText.match(endPattern);

		let content;
		if (endMatch) {
			// Extract content up to the end marker
			content = remainingText.substring(0, endMatch.index).trim();
		} else {
			// No end marker found, take rest of text
			content = remainingText.trim();
		}

		if (content.length > 0) {
			segments.push(content);
		}
	}

	return segments;
}

console.log('🧪 Testing Segment Extraction\n');
console.log('='.repeat(60));

// Test Case 1: Simple double-star format
console.log('\n📋 Test Case 1: Double-star format');
console.log('Pattern: **Segment %n:** (%n characters)\n');

const text1 = `
**Segment 1:** (250 characters)
The rain poured down in sheets, making visibility almost zero.

**Segment 2:** (300 characters)
Sarah looked out the window and sighed deeply.

**Segment 3:**
This one has no character count.
`;

const pattern1 = templateToRegex('**Segment %n:** (%n characters)');
const segments1 = extractSegmentContent(text1, pattern1);

console.log(`Found ${segments1.length} segments:`);
segments1.forEach((seg, i) => {
	console.log(`\n  Segment ${i + 1} (${seg.length} chars):`);
	console.log(`  "${seg.substring(0, 60)}${seg.length > 60 ? '...' : ''}"`);
});

// Test Case 2: Plain format
console.log('\n\n' + '='.repeat(60));
console.log('\n📋 Test Case 2: Plain format');
console.log('Pattern: Segment %n: (%n characters)\n');

const text2 = `
Segment 1: (200 characters)
First segment content here.

Segment 2: (150 characters)
Second segment content here.

Segment 3:
Third segment without count.
`;

const pattern2 = templateToRegex('Segment %n: (%n characters)');
const segments2 = extractSegmentContent(text2, pattern2);

console.log(`Found ${segments2.length} segments:`);
segments2.forEach((seg, i) => {
	console.log(`\n  Segment ${i + 1} (${seg.length} chars):`);
	console.log(`  "${seg}"`);
});

// Test Case 3: Mixed format (the problematic case)
console.log('\n\n' + '='.repeat(60));
console.log('\n📋 Test Case 3: Mixed formats (the problem case)');
console.log('Pattern 1: **Segment %n:** (%n characters)');
console.log('Pattern 2: Segment %n: (%n characters)\n');

const text3 = `
**Segment 1:** (250 characters)
On her 30th birthday, Maya realized she'd been playing it safe her entire life.

**Segment 2:** (300 characters)
Safe relationship with a safe guy named Daniel who'd probably propose in a safe way.

Segment 3: (200 characters)
She wasn't unhappy. That was the worst part.

**Segment 4:** (275 characters)
Her friends envied her stability.
`;

console.log('Extracting with Pattern 1 (double-star):');
const segments3a = extractSegmentContent(text3, pattern1);
console.log(`Found ${segments3a.length} segments:`);
segments3a.forEach((seg, i) => {
	console.log(`\n  Segment ${i + 1} (${seg.length} chars):`);
	const preview = seg.substring(0, 80).replace(/\n/g, ' ');
	console.log(`  "${preview}${seg.length > 80 ? '...' : ''}"`);

	// Check for embedded markers
	if (seg.includes('Segment') && seg.includes(':')) {
		console.log(`  ⚠️  WARNING: Content contains embedded "Segment" markers!`);
	}
});

console.log('\n\nExtracting with Pattern 2 (plain):');
const segments3b = extractSegmentContent(text3, pattern2);
console.log(`Found ${segments3b.length} segments:`);
segments3b.forEach((seg, i) => {
	console.log(`\n  Segment ${i + 1} (${seg.length} chars):`);
	const preview = seg.substring(0, 80).replace(/\n/g, ' ');
	console.log(`  "${preview}${seg.length > 80 ? '...' : ''}"`);

	// Check for embedded markers
	if (seg.includes('**Segment')) {
		console.log(`  ⚠️  WARNING: Content contains embedded "**Segment" markers!`);
	}
});

// Test Case 4: Edge case - markers on same line as content
console.log('\n\n' + '='.repeat(60));
console.log('\n📋 Test Case 4: Inline markers (marker + content on same line)');

const text4 = `
**Segment 1:** (250 characters) The rain poured down in sheets.

**Segment 2:** (300 characters) Sarah looked out the window.

**Segment 3:** This one has no count but still has inline content.
`;

const segments4 = extractSegmentContent(text4, pattern1);
console.log(`Found ${segments4.length} segments:`);
segments4.forEach((seg, i) => {
	console.log(`\n  Segment ${i + 1} (${seg.length} chars):`);
	console.log(`  "${seg}"`);
});

// Test Case 5: UNIFIED extraction with END MARKER
console.log('\n\n' + '='.repeat(60));
console.log('\n📋 Test Case 5: UNIFIED extraction with END MARKER (\\n)');
console.log('Using pattern with end marker delimiter:\n');

const segments5 = extractSegmentContentUnified(text3, [pattern1, pattern2], '\\n');
console.log(`Found ${segments5.length} segments:`);
segments5.forEach((seg, i) => {
	console.log(`\n  Segment ${i + 1} (${seg.length} chars):`);
	const preview = seg.substring(0, 80).replace(/\n/g, ' ');
	console.log(`  "${preview}${seg.length > 80 ? '...' : ''}"`);

	// Check for embedded markers
	if (seg.includes('**Segment') || seg.match(/Segment \d+:/)) {
		console.log(`  ⚠️  WARNING: Content contains embedded segment markers!`);
	}
});

// Validation Summary
console.log('\n\n' + '='.repeat(60));
console.log('\n✅ Validation Summary:\n');

let allPassed = true;

// Check Test 1
if (segments1.length === 3) {
	console.log('✅ Test 1: Correct number of segments (3)');
} else {
	console.log(`❌ Test 1: Expected 3 segments, got ${segments1.length}`);
	allPassed = false;
}

// Check Test 2
if (segments2.length === 3) {
	console.log('✅ Test 2: Correct number of segments (3)');
} else {
	console.log(`❌ Test 2: Expected 3 segments, got ${segments2.length}`);
	allPassed = false;
}

// Check Test 3a - no embedded plain markers in double-star extraction
const hasEmbeddedPlain = segments3a.some(seg =>
	seg.match(/Segment \d+: \(\d+/) || seg.match(/Segment \d+:(?!\*)/)
);
if (!hasEmbeddedPlain) {
	console.log('✅ Test 3a: No embedded plain markers in double-star segments');
} else {
	console.log('❌ Test 3a: Found embedded plain markers in double-star segments');
	allPassed = false;
}

// Check Test 3b - double-star markers shouldn't leak into plain extraction
const hasEmbeddedBold = segments3b.some(seg => seg.includes('**Segment'));
if (!hasEmbeddedBold) {
	console.log('✅ Test 3b: No embedded bold markers in plain segments');
} else {
	console.log('❌ Test 3b: Found embedded bold markers in plain segments');
	allPassed = false;
}

// Check Test 4 - inline content extracted
if (segments4.length === 3 && segments4[0].includes('rain')) {
	console.log('✅ Test 4: Inline content properly extracted');
} else {
	console.log('❌ Test 4: Inline content not properly extracted');
	allPassed = false;
}

// Check Test 5 - unified extraction with end marker should have no embedded markers
const hasEmbeddedMarkers5 = segments5.some(seg =>
	seg.includes('**Segment') || seg.match(/Segment \d+: \(\d+/)
);
if (!hasEmbeddedMarkers5 && segments5.length === 4) {
	console.log('✅ Test 5: UNIFIED extraction with end marker - correct segments!');
} else {
	console.log(`❌ Test 5: Expected 4 clean segments, got ${segments5.length} with embedded: ${hasEmbeddedMarkers5}`);
	allPassed = false;
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
	console.log('\n🎉 All tests passed!\n');
} else {
	console.log('\n⚠️  Some tests failed. Review output above.\n');
}
