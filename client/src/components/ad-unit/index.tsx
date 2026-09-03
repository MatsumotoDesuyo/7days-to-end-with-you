import { useEffect } from 'react';

// AdSense の手動 1 ユニット (docs/use-cases.md N12 / issue #12)。
// 自動広告は使わず、ページ最下部のこの 1 枠だけに固定する。
// 高さを事前確保してレイアウトシフト (CLS) を防ぎ、dev では実広告をロードしない。

const AD_CLIENT = 'ca-pub-9666515152781934';
const AD_SLOT = '8476370284';
const RESERVED_HEIGHT = 100;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  isProduction?: boolean;
};

export default function AdUnit({
  isProduction = import.meta.env.PROD,
}: Props) {
  useEffect(() => {
    if (!isProduction) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // AdSense スクリプトが読めなくても UI には影響させない
    }
  }, [isProduction]);

  if (!isProduction) {
    // dev/テストでは同じ高さのプレースホルダのみ (実広告を呼ばない)
    return <div style={{ minHeight: RESERVED_HEIGHT }} aria-hidden="true" />;
  }
  return (
    <div style={{ minHeight: RESERVED_HEIGHT, textAlign: 'center' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: RESERVED_HEIGHT }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
