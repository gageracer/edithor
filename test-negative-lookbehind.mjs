#!/usr/bin/env node

/**
 * Test script for negative lookbehind in pattern matching
 * Tests that plain "Segment N:" pattern doesn't match inside "**Segment N:**"
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

	// Check if this is a plain "Segment" pattern (without **)
	const isPlainSegmentPattern = pattern.includes('Segment') && !pattern.includes('**');

	// Escape special regex characters
	pattern = escapeRegex(pattern);

	// Add negative lookbehind for plain Segment patterns to avoid matching inside **Segment**
	if (isPlainSegmentPattern) {
		pattern = '(?<!\\*\\*)' + pattern;
	}

	// Replace number placeholders with regex pattern for one or more digits
	pattern = pattern.replace(/###NUMBER###/g, '\\d+');

	// If there was a character count in the template, add it as optional with flexible whitespace
	if (hasCharCount) {
		pattern = pattern + '\\s*(\\(\\d+\\s+characters\\))?';
	}

	return new RegExp(pattern, 'gi');
}

console.log('🧪 Testing Negative Lookbehind Pattern Matching\n');
console.log('='.repeat(70));

// Test Case 1: Plain pattern should NOT match inside bold markers
console.log('\n📋 Test Case 1: Plain pattern with negative lookbehind');
console.log('Pattern: Segment %n: (%n characters)\n');

const plainPattern = templateToRegex('Segment %n: (%n characters)');
console.log(`Generated Regex: ${plainPattern}\n`);

const testStrings1 = [
	'**Segment 1:** (250 characters)',
	'**Segment 22:** (491 characters)',
	'Segment 1: (250 characters)',
	'Segment 22: (491 characters) Content here',
	'Some text **Segment 5:** more text',
	'Some text Segment 5: more text'
];

console.log('Testing matches:');
testStrings1.forEach((str) => {
	const matches = str.match(plainPattern);
	const result = matches ? '✅ MATCH' : '❌ NO MATCH';
	console.log(`  ${result}: "${str}"`);
	if (matches) {
		console.log(`           Found: "${matches[0]}"`);
	}
});

// Test Case 2: Bold pattern should match normally
console.log('\n\n' + '='.repeat(70));
console.log('\n📋 Test Case 2: Bold pattern (no negative lookbehind)');
console.log('Pattern: **Segment %n:** (%n characters)\n');

const boldPattern = templateToRegex('**Segment %n:** (%n characters)');
console.log(`Generated Regex: ${boldPattern}\n`);

const testStrings2 = [
	'**Segment 1:** (250 characters)',
	'**Segment 22:** (491 characters)',
	'Segment 1: (250 characters)',
	'Segment 22: (491 characters)'
];

console.log('Testing matches:');
testStrings2.forEach((str) => {
	const matches = str.match(boldPattern);
	const result = matches ? '✅ MATCH' : '❌ NO MATCH';
	console.log(`  ${result}: "${str}"`);
	if (matches) {
		console.log(`           Found: "${matches[0]}"`);
	}
});

// Test Case 3: Real document with mixed formats
console.log('\n\n' + '='.repeat(70));
console.log('\n📋 Test Case 3: Mixed format document (real-world scenario)\n');

const mixedText = `
**Segment 1:** (250 characters)
Content for segment 1 in bold format.

**Segment 2:** (300 characters)
More content in bold format.

Segment 3: (200 characters) Content for plain segment on same line.

**Segment 4:** (275 characters)
Back to bold format.

Segment 5: (180 characters) Another plain segment with inline content.
`;

console.log('Finding all bold markers:');
const boldMatches = [...mixedText.matchAll(new RegExp(boldPattern.source, 'gi'))];
console.log(`Found ${boldMatches.length} bold markers:`);
boldMatches.forEach((match, i) => {
	console.log(`  ${i + 1}. Position ${match.index}: "${match[0]}"`);
});

console.log('\nFinding all plain markers (with negative lookbehind):');
const plainMatches = [...mixedText.matchAll(new RegExp(plainPattern.source, 'gi'))];
console.log(`Found ${plainMatches.length} plain markers:`);
plainMatches.forEach((match, i) => {
	console.log(`  ${i + 1}. Position ${match.index}: "${match[0]}"`);
});

// Test Case 4: Check for conflicts
console.log('\n\n' + '='.repeat(70));
console.log('\n📋 Test Case 4: Conflict Detection\n');

const allMarkers = [
	...boldMatches.map(m => ({ type: 'bold', pos: m.index, text: m[0] })),
	...plainMatches.map(m => ({ type: 'plain', pos: m.index, text: m[0] }))
].sort((a, b) => a.pos - b.pos);

console.log(`Total markers found: ${allMarkers.length}`);
console.log('Markers in document order:');
allMarkers.forEach((marker, i) => {
	console.log(`  ${i + 1}. [${marker.type.toUpperCase()}] Position ${marker.pos}: "${marker.text}"`);
});

// Check for overlapping positions
const positions = allMarkers.map(m => m.pos);
const uniquePositions = [...new Set(positions)];
const hasConflicts = positions.length !== uniquePositions.length;

if (hasConflicts) {
	console.log('\n❌ CONFLICT DETECTED: Multiple patterns matched at same position!');
} else {
	console.log('\n✅ NO CONFLICTS: Each marker has unique position');
}

// Validation
console.log('\n\n' + '='.repeat(70));
console.log('\n✅ Validation Summary:\n');

let allPassed = true;

// Check 1: Plain pattern should NOT match bold markers
const boldMarkerStrings = ['**Segment 1:**', '**Segment 22:**', '**Segment 5:**'];
const plainMatchesInBold = boldMarkerStrings.filter(str => plainPattern.test(str));

if (plainMatchesInBold.length === 0) {
	console.log('✅ Test 1: Plain pattern does NOT match bold markers');
} else {
	console.log(`❌ Test 1: Plain pattern matched ${plainMatchesInBold.length} bold markers!`);
	plainMatchesInBold.forEach(str => console.log(`     - "${str}"`));
	allPassed = false;
}

// Check 2: Plain pattern SHOULD match plain markers
const plainMarkerStrings = ['Segment 1:', 'Segment 22: (250 characters)', 'Segment 5:'];
const plainMatchesInPlain = plainMarkerStrings.filter(str => plainPattern.test(str));

if (plainMatchesInPlain.length === plainMarkerStrings.length) {
	console.log('✅ Test 2: Plain pattern matches all plain markers');
} else {
	console.log(`❌ Test 2: Plain pattern only matched ${plainMatchesInPlain.length}/${plainMarkerStrings.length} plain markers`);
	allPassed = false;
}

// Check 3: Bold pattern should match bold markers
const boldMatchesInBold = boldMarkerStrings.filter(str => boldPattern.test(str));

if (boldMatchesInBold.length === boldMarkerStrings.length) {
	console.log('✅ Test 3: Bold pattern matches all bold markers');
} else {
	console.log(`❌ Test 3: Bold pattern only matched ${boldMatchesInBold.length}/${boldMarkerStrings.length} bold markers`);
	allPassed = false;
}

// Check 4: Bold pattern should NOT match plain markers
const boldMatchesInPlain = plainMarkerStrings.filter(str => boldPattern.test(str));

if (boldMatchesInPlain.length === 0) {
	console.log('✅ Test 4: Bold pattern does NOT match plain markers');
} else {
	console.log(`❌ Test 4: Bold pattern matched ${boldMatchesInPlain.length} plain markers!`);
	allPassed = false;
}

// Check 5: No position conflicts in mixed document
if (!hasConflicts) {
	console.log('✅ Test 5: No position conflicts in mixed document');
} else {
	console.log('❌ Test 5: Position conflicts detected in mixed document');
	allPassed = false;
}

// Check 6: Expected marker counts in mixed text
const expectedBold = 3; // Segments 1, 2, 4
const expectedPlain = 2; // Segments 3, 5

if (boldMatches.length === expectedBold && plainMatches.length === expectedPlain) {
	console.log(`✅ Test 6: Correct marker counts (${expectedBold} bold, ${expectedPlain} plain)`);
} else {
	console.log(`❌ Test 6: Wrong marker counts (got ${boldMatches.length} bold, ${plainMatches.length} plain; expected ${expectedBold}, ${expectedPlain})`);
	allPassed = false;
}

console.log('\n' + '='.repeat(70));
if (allPassed) {
	console.log('\n🎉 All tests passed! Negative lookbehind is working correctly!\n');
	process.exit(0);
} else {
	console.log('\n⚠️  Some tests failed. Review output above.\n');
	process.exit(1);
}
