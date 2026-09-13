import { describe, expect, it, beforeEach } from 'vitest';
import {
  addDictionaryWord,
  addDictionaryWords,
  ensureClassDictionary,
  ensureStudentDictionary,
  readClassDictionaries,
  removeDictionaryWord,
} from './classDictionaries';

describe('class dictionaries', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('creates a shared class dictionary and stores words', () => {
    const dict = ensureClassDictionary('c1', 'Room 12');
    expect(dict.ownerType).toBe('class');
    addDictionaryWord('c1', dict.id, {
      word: 'Poem!',
      definition: 'A piece of writing.',
      partOfSpeech: 'noun',
    });
    const words = readClassDictionaries('c1')[0].words;
    expect(words).toHaveLength(1);
    expect(words[0].word).toBe('poem');
    expect(words[0].definition).toBe('A piece of writing.');
  });

  it('creates per-student dictionaries and removes words', () => {
    ensureClassDictionary('c1', 'Room 12');
    const mine = ensureStudentDictionary('c1', { id: 's1', name: 'Alex' });
    addDictionaryWord('c1', mine.id, { word: 'frog', addedBy: 'student' });
    const list = readClassDictionaries('c1');
    expect(list.some((d) => d.ownerType === 'student')).toBe(true);
    const entryId = list.find((d) => d.id === mine.id).words[0].id;
    removeDictionaryWord('c1', mine.id, entryId);
    expect(readClassDictionaries('c1').find((d) => d.id === mine.id).words).toEqual([]);
  });

  it('adds many words in one write', () => {
    const dict = ensureClassDictionary('c1', 'Room 12');
    addDictionaryWords('c1', dict.id, [
      { word: 'thus', definition: 'this one' },
      { word: 'Happy' },
      { word: 'thus', definition: 'updated' },
    ]);
    const words = readClassDictionaries('c1')[0].words;
    expect(words.map((w) => w.word)).toEqual(['happy', 'thus']);
    expect(words.find((w) => w.word === 'thus')?.definition).toBe('updated');
  });

  it('copies whole-class words into every student dictionary', () => {
    const classDict = ensureClassDictionary('c1', 'Room 12');
    const alex = ensureStudentDictionary('c1', { id: 's1', name: 'Alex' });
    const sam = ensureStudentDictionary('c1', { id: 's2', name: 'Sam' });

    addDictionaryWord('c1', classDict.id, {
      word: 'thus',
      definition: 'this one',
      partOfSpeech: 'noun',
    });

    const list = readClassDictionaries('c1');
    expect(list.find((d) => d.id === classDict.id)?.words.map((w) => w.word)).toEqual(['thus']);
    expect(list.find((d) => d.id === alex.id)?.words.map((w) => w.word)).toEqual(['thus']);
    expect(list.find((d) => d.id === sam.id)?.words[0]).toMatchObject({
      word: 'thus',
      definition: 'this one',
      partOfSpeech: 'noun',
    });
  });

  it('does not copy student-only words into the class dictionary', () => {
    const classDict = ensureClassDictionary('c1', 'Room 12');
    const alex = ensureStudentDictionary('c1', { id: 's1', name: 'Alex' });
    const sam = ensureStudentDictionary('c1', { id: 's2', name: 'Sam' });

    addDictionaryWord('c1', alex.id, { word: 'frog' });

    const list = readClassDictionaries('c1');
    expect(list.find((d) => d.id === classDict.id)?.words).toEqual([]);
    expect(list.find((d) => d.id === alex.id)?.words.map((w) => w.word)).toEqual(['frog']);
    expect(list.find((d) => d.id === sam.id)?.words).toEqual([]);
  });
});
