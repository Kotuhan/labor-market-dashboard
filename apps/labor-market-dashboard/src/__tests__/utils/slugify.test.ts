import { describe, it, expect } from 'vitest';

import { slugify } from '@/utils/slugify';

describe('slugify', () => {
  it('transliterates a simple Ukrainian word', () => {
    expect(slugify('Кібербезпека')).toBe('kiberbezpeka');
  });

  it('transliterates multi-word Ukrainian label', () => {
    expect(slugify('Розробка ПЗ')).toBe('rozrobka-pz');
  });

  it('handles Ukrainian soft sign (ь)', () => {
    expect(slugify('Сільське господарство')).toBe('silske-hospodarstvo');
  });

  it('handles special Ukrainian characters (є, ї, ґ)', () => {
    expect(slugify('Європейська їжа ґатунок')).toBe('yevropeiska-yizha-gatunok');
  });

  it('handles already-Latin input', () => {
    expect(slugify('DevOps / SRE')).toBe('devops-sre');
  });

  it('handles mixed Cyrillic and Latin', () => {
    expect(slugify('UI/UX Дизайн')).toBe('ui-ux-dyzain');
  });

  it('returns fallback for empty string', () => {
    expect(slugify('')).toBe('node');
  });

  it('returns fallback for whitespace-only input', () => {
    expect(slugify('   ')).toBe('node');
  });

  it('collapses multiple hyphens and trims', () => {
    expect(slugify('  Тест -- значення  ')).toBe('test-znachennya');
  });

  it('handles numbers in label', () => {
    expect(slugify('Категорія 3')).toBe('katehoriya-3');
  });
});
