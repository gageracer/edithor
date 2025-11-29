#!/usr/bin/env node

/**
 * Test script for pattern template with %n/%d placeholders
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

// Test cases
const testCases = [
	{
		template: '**Segment %n:** (%n characters)',
		testStrings: [
			'**Segment 1:** (250 characters)',
			'**Segment 22:** (491 characters)',
			'**Segment 100:** (1500 characters)',
			'**Segment 5:**', // Should match (character count is optional)
			'**Segment 5:** ', // Should match (trailing space)
			'Segment 1: (250 characters)', // Should NOT match
		]
	},
	{
		template: 'Segment %n: (%n characters)',
		testStrings: [
			'Segment 1: (250 characters)',
			'Segment 22: (491 characters)',
			'Segment 100: (1500 characters)',
			'Segment 5:', // Should match (character count is optional)
			'Segment 5: ', // Should match (trailing space)
			'**Segment 1:** (250 characters)', // Should NOT match
		]
	},
	{
		template: 'Segment %n:',
		testStrings: [
			'Segment 1:',
			'Segment 22:',
			'Segment 100:',
			'Segment 1: (250 characters)', // Should match (pattern is prefix)
			'**Segment 1:**', // Should NOT match
		]
	},
	{
		template: 'Chapter %d - Part %d',
		testStrings: [
			'Chapter 1 - Part 1',
			'Chapter 10 - Part 25',
			'Chapter 999 - Part 1',
			'Chapter 1 - Part', // Should NOT match (missing second number)
		]
	}
];

console.log('🧪 Testing Pattern Template to Regex Conversion\n');
console.log('='.repeat(60));

testCases.forEach((testCase, index) => {
	console.log(`\n📋 Test Case ${index + 1}`);
	console.log(`Template: "${testCase.template}"`);

	const regex = templateToRegex(testCase.template);
	console.log(`Generated Regex: ${regex}\n`);

	testCase.testStrings.forEach((testString) => {
		const matches = testString.match(regex);
		const result = matches ? '✅ MATCH' : '❌ NO MATCH';
		console.log(`  ${result}: "${testString}"`);
		if (matches) {
			console.log(`           Found: "${matches[0]}"`);
		}
	});
});

console.log('\n' + '='.repeat(60));
console.log('\n✨ Pattern template test complete!\n');

// Test with actual segment text
console.log('📝 Testing with real segment text:\n');

const sampleText = `
**Segment 1:** (250 characters)
The rain poured down in sheets...

**Segment 2:** (500 characters)
Sarah looked out the window...

**Segment 3:**
This one has no character count!

Segment 4: (300 characters)
Meanwhile, across town...

Segment 5:
This plain format has no count either.

**Segment 22:** (491 characters)
They talked late into the night...
`;

const template1 = '**Segment %n:** (%n characters)';
const regex1 = templateToRegex(template1);

console.log(`Template: "${template1}"`);
console.log(`Regex: ${regex1}\n`);

const matches1 = sampleText.match(regex1);
console.log(`Found ${matches1 ? matches1.length : 0} matches:`);
if (matches1) {
	matches1.forEach((match, i) => {
		console.log(`  ${i + 1}. "${match}"`);
	});
}

console.log('\n---\n');

const template2 = 'Segment %n: (%n characters)';
const regex2 = templateToRegex(template2);

console.log(`Template: "${template2}"`);
console.log(`Regex: ${regex2}\n`);

const matches2 = sampleText.match(regex2);
console.log(`Found ${matches2 ? matches2.length : 0} matches:`);
if (matches2) {
	matches2.forEach((match, i) => {
		console.log(`  ${i + 1}. "${match}"`);
	});
}

console.log('\n✅ Test complete!\n');
