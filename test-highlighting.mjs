// Test pattern creation and highlighting
const template = '%o{**}Segment %n:%o{**} (%d characters)';

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
    console.error('Failed to create pattern:', error);
    return null;
  }
}

const pattern = createPattern(template);
console.log('Pattern:', pattern);

const testText = `### Voice Script Segments

**Segment 1:** (245 characters)
Welcome to our platform!

**Segment 2:** (198 characters)
This is the second segment.

### Storyboard Images`;

const matches = [...testText.matchAll(pattern)];
console.log(`\nFound ${matches.length} matches:`);
matches.forEach((match, i) => {
  console.log(`${i + 1}. "${match[0]}" at index ${match.index}`);
});
