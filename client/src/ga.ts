// GA4 計測 (docs/use-cases.md N11 / issue #12)。
// 外部ライブラリは使わず gtag を直接扱う。本番ビルドかつ測定 ID がある場合のみ
// 初期化し、dev/CI からは一切送信しない。

export const GA_MEASUREMENT_ID = 'G-HL1N4FK04L';

// Consent Mode v2: EEA + UK + スイスはデフォルト拒否 (同意は AdSense の
// Google CMP が取得して更新する)。他地域はデフォルト許可
const CONSENT_DENIED_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initGa(
  measurementId: string = GA_MEASUREMENT_ID,
  isProduction: boolean = import.meta.env.PROD
): void {
  if (!isProduction || measurementId === '' || initialized) return;

  window.dataLayer = window.dataLayer ?? [];
  // gtag.js は dataLayer に Arguments オブジェクトが積まれることを前提とする
  // ため、rest パラメータではなく arguments をそのまま push する
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    (window.dataLayer as unknown[]).push(arguments);
  }
  window.gtag = gtag as (...args: unknown[]) => void;

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: CONSENT_DENIED_REGIONS,
    wait_for_update: 500,
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  initialized = true;
}

function track(name: string, params: Record<string, string>): void {
  if (!initialized || !window.gtag) return;
  window.gtag('event', name, params);
}

/** 辞書検索の実行 (UC3)。どの言語圏に使われているかを見る */
export function trackSearch(lang: string): void {
  track('dict_search', { lang });
}

/** 表示言語の切替 (UC5) */
export function trackLanguageChange(lang: string): void {
  track('language_change', { lang });
}

/** テスト用: 初期化状態をリセットする */
export function resetGaForTesting(): void {
  initialized = false;
}
