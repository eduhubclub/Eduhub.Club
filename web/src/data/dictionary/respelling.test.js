import { describe, expect, it } from 'vitest';
import {
  formatPronunciationLine,
  formatRespelling,
} from './respelling';

describe('kid phonetic respelling', () => {
  it('turns IPA into Dictionary.com-style brackets', () => {
    expect(formatRespelling('/bɔːt/')).toBe('[bawt]');
    expect(formatRespelling('/noʊˈɛtɪk/')).toBe('[noh-et-ik]');
    expect(formatRespelling('noʊˈɛtɪk')).toBe('[noh-et-ik]');
  });

  it('puts respelling before IPA on the display line', () => {
    expect(formatPronunciationLine('/bɔːt/')).toBe('[bawt]  /bɔːt/');
    expect(formatPronunciationLine('/noʊˈɛtɪk/')).toContain('[noh-et-ik]');
  });
});
