import './index.css';

export default function Footer() {
  return (
    <div className="footer">
      ©2022 watashihamatsumotodesu@gmail.com
      {' ・ '}
      {/* ポリシーの正本は組織 (soncho-works.com) が持つ。#37 */}
      <a href="https://soncho-works.com/privacy/" style={{ color: 'inherit' }}>
        Privacy Policy
      </a>
      {' ・ '}
      <a href="/privacy.html" style={{ color: 'inherit' }}>
        Supplement
      </a>
    </div>
  );
}
