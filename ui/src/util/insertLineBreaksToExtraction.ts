// [00:00:00,000 -> 00:00:02,000] People for beating me in
// Minecraft[00:00:02,000 -> 00:00:09,680] It just happens to be him he's never
// played you weren't me if you weren't me
export default function insertLineBreaksToExtraction(text: string) {
  return text.replace(
    /(\[\d{2}:\d{2}:\d{2},\d{3} -> \d{2}:\d{2}:\d{2},\d{3}\])/g,
    '\n$1'
  );
}
