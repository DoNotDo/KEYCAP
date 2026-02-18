export const normalizeText = (value: string) => {
  return value.toLowerCase().replace(/\s+/g, '');
};

export const matchesSearch = (fields: Array<string | undefined>, query: string) => {
  if (!query.trim()) return true;
  const tokens = query
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)
    .map(normalizeText);

  if (tokens.length === 0) return true;

  const haystack = normalizeText(fields.filter(Boolean).join(' '));
  return tokens.every(token => haystack.includes(token));
};
