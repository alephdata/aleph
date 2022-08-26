export function wrapLines(text: string, maxLength: number): string[] {
  const words = text.split(/\s/);
  const lines = [];
  let currentLine = [];

  for (const word of words) {
    if ([...currentLine, word].join(' ').length > maxLength) {
      lines.push(currentLine);
      currentLine = [];
    }

    currentLine.push(word);
  }

  lines.push(currentLine);

  return lines.map((line) => line.join(' '));
}
