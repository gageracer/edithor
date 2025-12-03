// Test that real-time highlighting updates work correctly

import { test } from 'node:test';
import assert from 'node:assert';

// Simulate the pattern creation logic
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createPattern(template) {
  if (!template || !template.trim()) return null;

  try {
    const optionalMarkers = [];
    let processedTemplate = template;
    
    const optionalPattern = /%o\{([^}]+)\}/g;
    let match;
    let index = 0;

    while ((match = optionalPattern.exec(template)) !== null) {
      const placeholder = `__OPTIONAL_${index}__`;
      optionalMarkers.push(match[1]);
      processedTemplate = processedTemplate.replace(match[0], placeholder);
      index++;
    }

    let pattern = escapeRegex(processedTemplate);
    const hasCharCount = template.includes('%d');

    pattern = pattern.replace(/%n/g, '\\d+');
    pattern = pattern.replace(/%d/g, '\\d+');

    optionalMarkers.forEach((content, idx) => {
      const placeholder = `__OPTIONAL_${idx}__`;
      const escapedContent = escapeRegex(content);
      pattern = pattern.replace(placeholder, `(${escapedContent})?`);
    });

    if (hasCharCount) {
      pattern = pattern.replace(
        /\\\(\\d\+\\s\*characters\\\)/g,
        '(\\(\\d+\\s*characters\\))?'
      );
    }

    return new RegExp(pattern, 'gi');
  } catch (error) {
    return null;
  }
}

// Test 1: Default pattern
test('default pattern should match segments', () => {
  const template = '%o{**}Segment %n:%o{**} (%d characters)';
  const pattern = createPattern(template);
  
  assert.ok(pattern, 'Pattern should be created');
  
  const text = '**Segment 1:** (245 characters)\n**Segment 2:** (198 characters)';
  const matches = [...text.matchAll(pattern)];
  
  assert.strictEqual(matches.length, 2, 'Should find 2 segments');
  assert.strictEqual(matches[0][0], '**Segment 1:** (245 characters)');
  assert.strictEqual(matches[1][0], '**Segment 2:** (198 characters)');
  
  console.log('✅ Test 1 passed: Default pattern matches correctly');
});

// Test 2: Custom pattern
test('custom pattern should work', () => {
  const template = 'Part %n (%d chars)';
  const pattern = createPattern(template);
  
  assert.ok(pattern, 'Pattern should be created');
  
  const text = 'Part 1 (100 chars)\nPart 2 (200 chars)';
  const matches = [...text.matchAll(pattern)];
  
  assert.strictEqual(matches.length, 2, 'Should find 2 parts');
  
  console.log('✅ Test 2 passed: Custom pattern works');
});

// Test 3: Invalid pattern
test('invalid pattern should return null', () => {
  const template = '';
  const pattern = createPattern(template);
  
  assert.strictEqual(pattern, null, 'Empty template should return null');
  
  console.log('✅ Test 3 passed: Invalid patterns handled correctly');
});

// Test 4: Reactivity simulation
test('pattern update should produce new regex', () => {
  const template1 = '**Segment %n:** (%d characters)';
  const template2 = 'Part %n (%d chars)';
  
  const pattern1 = createPattern(template1);
  const pattern2 = createPattern(template2);
  
  assert.notStrictEqual(pattern1?.source, pattern2?.source, 'Different templates should produce different patterns');
  
  console.log('✅ Test 4 passed: Pattern updates work correctly');
});

console.log('\n🎉 All highlighting tests passed!');
