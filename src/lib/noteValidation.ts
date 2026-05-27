export const NOTE_EMOTICON_WARNING = "Catatan tidak bisa ditulis dengan emoticon. Silakan gunakan kalimat biasa.";

const emojiPattern =
  /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;
const emojiTestPattern =
  /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/u;

const asciiEmoticonPattern =
  /(^|\s)([:;=8xX][\-oO']?[\)\(\]\[dDpP\/\\:}{@|]|<3)(?=\s|$)/g;
const asciiEmoticonTestPattern =
  /(^|\s)([:;=8xX][\-oO']?[\)\(\]\[dDpP\/\\:}{@|]|<3)(?=\s|$)/;

export const hasBlockedNoteEmoticon = (value: string) =>
  emojiTestPattern.test(value) || asciiEmoticonTestPattern.test(value);

export const removeBlockedNoteEmoticons = (value: string) =>
  value
    .replace(emojiPattern, "")
    .replace(asciiEmoticonPattern, (match, prefix) => prefix || "")
    .replace(/[ \t]{2,}/g, " ");
