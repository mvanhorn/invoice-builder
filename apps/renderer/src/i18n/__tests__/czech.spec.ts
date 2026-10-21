import { afterEach, describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import { Language } from '@invoice-builder/contracts';

import i18n from '../index';
import cs from '../cs.json';
import en from '../en.json';
import { LANGUAGE_ITEMS_ARRAY } from '../../state/constant';

const originalLanguage = i18n.language;
const placeholderPattern = /\{\{[^{}]+\}\}/g;

const collectLeaves = (value: unknown, prefix = ''): Map<string, string> => {
  const leaves = new Map<string, string>();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) leaves.set(prefix, String(value));
    return leaves;
  }

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object') {
      for (const [nestedKey, nestedValue] of collectLeaves(child, path)) {
        leaves.set(nestedKey, nestedValue);
      }
      continue;
    }
    leaves.set(path, String(child));
  }

  return leaves;
};

const placeholders = (value: string) => (value.match(placeholderPattern) ?? []).sort();

describe('Czech language support', () => {
  afterEach(async () => {
    await i18n.changeLanguage(originalLanguage);
  });

  it('resolves supplied Czech labels, keeps placeholders, and reports keys absent from the submission', () => {
    const english = collectLeaves(en);
    const czech = collectLeaves(cs);
    const missing = [...english.keys()].filter(key => !czech.has(key)).sort();
    const extra = [...czech.keys()].filter(key => !english.has(key)).sort();

    expect(missing).toEqual(['error.noUpFunction']);
    expect(extra).toEqual([]);
    expect(i18n.t('error.noUpFunction', { lng: Language.cs })).toBe('Migration does not export up()');
    expect(czech.has('error.noUpFunction')).toBe(false);

    expect(i18n.t('app.version', { lng: Language.cs })).toBe('Verze');
    expect(i18n.t('menuItems.invoices', { lng: Language.cs })).toBe('Faktury');
    expect(i18n.t('invoices.billTo', { lng: Language.cs })).toBe('Odběratel');
    expect(i18n.t('invoices.discountPrct', { lng: Language.cs, prct: 12 })).toBe('Sleva (12%)');
    expect(czech.get('invoices.discountPrct')).toBe('Sleva ({{prct}}%)');

    for (const [key, englishValue] of english) {
      const czechValue = czech.get(key);
      if (czechValue === undefined) continue;
      expect(placeholders(czechValue), key).toEqual(placeholders(englishValue));
    }
  });

  it('registers one Czech option and switches the production i18n instance between cs and en', async () => {
    expect(Language.cs).toBe('cs');
    expect(LANGUAGE_ITEMS_ARRAY.filter(item => item.value === Language.cs)).toEqual([
      { label: 'Czech', value: Language.cs }
    ]);
    expect(i18n.getResourceBundle(Language.cs, 'translation')).toMatchObject({
      app: { version: 'Verze' },
      invoices: { billTo: 'Odběratel' }
    });

    await i18n.changeLanguage(Language.cs);
    expect(i18n.t('app.version')).toBe('Verze');
    expect(i18n.t('invoices.billTo')).toBe('Odběratel');

    await i18n.changeLanguage(Language.en);
    expect(i18n.t('app.version')).toBe('Version');
    expect(i18n.t('invoices.billTo')).toBe('Bill to');
  });

  it('falls back to English for a missing Czech key without disturbing existing language resources', async () => {
    const isolated = createInstance();
    await isolated.init({
      resources: {
        en: { translation: { present: 'Present', missing: 'English fallback' } },
        cs: { translation: { present: 'Přítomný' } }
      },
      lng: Language.cs,
      fallbackLng: Language.en,
      interpolation: { escapeValue: false }
    });

    expect(isolated.t('present')).toBe('Přítomný');
    expect(isolated.t('missing')).toBe('English fallback');
    expect(isolated.t('present', { lng: Language.en })).toBe('Present');

    expect(i18n.t('invoices.billTo', { lng: Language.en })).toBe('Bill to');
    expect(i18n.t('invoices.billTo', { lng: Language.lt })).toBe('Sąskaita skirta');
    expect(i18n.t('invoices.billTo', { lng: Language.fr })).toBe('Facturer à');
    expect(i18n.t('invoices.billTo', { lng: Language.de })).toBe('Rechnungsempfänger');
    expect(i18n.t('invoices.billTo', { lng: Language.pt })).toBe('Cobrar de');
    expect(i18n.t('invoices.billTo', { lng: Language.cs })).toBe('Odběratel');
  });
});
