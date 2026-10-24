import { ComponentFixture } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslationDictionary, TranslationService } from '../services/translation.service';
import en from '../../../public/i18n/en.json';
import zh from '../../../public/i18n/zh.json';
import ms from '../../../public/i18n/ms.json';

export type Lang = 'en' | 'zh' | 'ms';

/**
 * Deterministic translation fixtures: the real production dictionaries.
 * Typing them as TranslationDictionary makes any key drift between the JSON files
 * and the interface a compile error in the unit-test build (contract sync dimension).
 */
export const I18N_FIXTURES: Readonly<Record<Lang, TranslationDictionary>> = { en, zh, ms };

/** Switches the TranslationService to `lang`, answering the dictionary request from the fixtures. */
export async function switchLanguage(
  ts: TranslationService,
  http: HttpTestingController,
  lang: Lang,
): Promise<void> {
  const pending = ts.setLanguage(lang);
  // eslint-disable-next-line security/detect-object-injection
  http.expectOne(`i18n/${lang}.json`).flush(I18N_FIXTURES[lang]);
  await pending;
}

/** Runs change detection and waits for the (zoneless) fixture to settle. */
export async function render<T>(fixture: ComponentFixture<T>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
}

/** Trimmed, whitespace-collapsed text of every element matching `selector`. */
export function texts(root: Element, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((el) =>
    (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
  );
}

/** Recursively lists every key path of a JSON-like value (array items collapse to `[]`). */
export function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.length ? keyPaths(value[0], `${prefix}[]`) : [`${prefix}[]`];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k))
      .sort();
  }
  return [prefix];
}
