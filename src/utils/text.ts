const PICTOGRAPH = /(?:\p{Extended_Pictographic}|️)+\s*/gu;

// Strips emoji from server-stored copy (e.g. briefs written before the terminal dropped emoji).
export const stripPictographs = (text: string): string => text.replace(PICTOGRAPH, '').trim();
