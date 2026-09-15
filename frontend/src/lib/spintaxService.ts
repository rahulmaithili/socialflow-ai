/**
 * Spintax Service - SocialFlow AI Studio
 * Handles parsing, generation, counting, and validation of Spintax text
 * Format: {Hello|Hey|Hi} {guys|friends|everyone}, check out {this trick|our new guide}!
 */

export interface SpintaxValidation {
  isValid: boolean;
  error?: string;
  totalVariations: number;
}

/**
 * Spin a spintax string to produce one randomized, unique variation.
 * Supports nested spintax like {A|{B|C}}
 */
export function spinText(text: string): string {
  if (!text) return '';

  const spintaxRegex = /\{([^{}]+)\}/g;
  let current = text;

  // Loop while there are still matching {option1|option2} groups
  while (spintaxRegex.test(current)) {
    current = current.replace(spintaxRegex, (_match, group) => {
      const choices = group.split('|');
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex];
    });
  }

  return current;
}

/**
 * Parse spintax and return object with resolved text
 */
export function parseSpintax(text: string): { text: string } {
  return { text: spinText(text) };
}

/**
 * Validates spintax string and calculates approximate number of possible variations.
 */
export function validateSpintax(text: string): SpintaxValidation {
  if (!text) return { isValid: true, totalVariations: 1 };

  let openBraces = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') openBraces++;
    else if (text[i] === '}') {
      openBraces--;
      if (openBraces < 0) {
        return { isValid: false, error: `Unmatched closing brace '}' at position ${i + 1}`, totalVariations: 0 };
      }
    }
  }

  if (openBraces > 0) {
    return { isValid: false, error: `Unmatched opening brace '{'. Missing ${openBraces} closing brace(s)`, totalVariations: 0 };
  }

  // Calculate approximate combinations count
  const spintaxRegex = /\{([^{}]+)\}/g;
  const matches = text.match(spintaxRegex);
  let totalVariations = 1;

  if (matches) {
    for (const m of matches) {
      const inner = m.slice(1, -1);
      const count = inner.split('|').length;
      totalVariations *= Math.max(1, count);
    }
  }

  return {
    isValid: true,
    totalVariations: Math.min(totalVariations, 1000000)
  };
}

/**
 * Generate N unique variations for previewing.
 */
export function generateVariations(text: string, count = 3): string[] {
  const variations = new Set<string>();
  const maxAttempts = count * 5;
  let attempts = 0;

  while (variations.size < count && attempts < maxAttempts) {
    variations.add(spinText(text));
    attempts++;
  }

  return Array.from(variations);
}
