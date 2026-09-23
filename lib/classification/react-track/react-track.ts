import { foldText } from '@/lib/text/fold-text/fold-text';
import { REACT_TRACK_TERMS, REACT_TRACK_THRESHOLD } from '../constants';

const termHits = (title: string, haystack: string): number =>
  REACT_TRACK_TERMS.reduce(
    (score, term) =>
      term.titlePattern.test(title) || term.bodyPattern.test(haystack)
        ? score + term.weight
        : score,
    0,
  );

export const meetsReactTrackThreshold = (
  title: string,
  haystack: string,
): boolean =>
  termHits(foldText(title), foldText(haystack)) >= REACT_TRACK_THRESHOLD;
