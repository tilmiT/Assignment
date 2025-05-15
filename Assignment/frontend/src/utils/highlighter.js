/**
 * Highlight search terms in text
 * @param {string} text - The text to highlight
 * @param {string} query - The search query
 * @returns {JSX.Element} Text with highlighted search terms
 */
export const highlightText = (text, query) => {
  if (!query || !text) {
    return text;
  }

  // Preprocess query
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 1);

  if (searchTerms.length === 0) {
    return text;
  }

  // Create regex pattern for all search terms
  const pattern = new RegExp(`(${searchTerms.join('|')})`, 'gi');
  
  // Split text by matching pattern
  const parts = text.split(pattern);

  // Return highlighted text
  return parts.map((part, i) => {
    if (searchTerms.some(term => part.toLowerCase() === term)) {
      return <mark key={i}>{part}</mark>;
    }
    return part;
  });
};

/**
 * Create a preview of text with highlighted search terms
 * @param {string} text - The full text content
 * @param {string} query - The search query
 * @param {number} contextSize - Characters to show before and after match
 * @returns {JSX.Element} Preview with highlighted search terms
 */
export const createHighlightedPreview = (text, query, contextSize = 100) => {
  if (!query || !text) {
    return text.substring(0, 200) + '...';
  }

  // Preprocess query
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 1);

  if (searchTerms.length === 0) {
    return text.substring(0, 200) + '...';
  }

  // Find first occurrence of any search term
  const firstTermIndex = searchTerms.reduce((lowestIndex, term) => {
    const index = text.toLowerCase().indexOf(term);
    return index !== -1 && (index < lowestIndex || lowestIndex === -1) ? index : lowestIndex;
  }, -1);

  if (firstTermIndex === -1) {
    return text.substring(0, 200) + '...';
  }

  // Calculate start and end positions for preview
  const start = Math.max(0, firstTermIndex - contextSize);
  const end = Math.min(text.length, firstTermIndex + contextSize);

  // Create preview text
  let preview = '';
  if (start > 0) {
    preview += '...';
  }
  preview += text.substring(start, end);
  if (end < text.length) {
    preview += '...';
  }

  // Highlight search terms in the preview
  return highlightText(preview, query);
};