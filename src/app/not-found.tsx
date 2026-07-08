import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="zh">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.5px' }}>100x</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, margin: '0 0 8px' }}>404</h1>
          <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 32px' }}>页面不存在或已移除</p>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            textDecoration: 'none',
          }}>
            ← 回到首页
          </Link>
        </div>
      </body>
    </html>
  );
}
