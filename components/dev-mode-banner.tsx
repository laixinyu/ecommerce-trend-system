'use client';

export function DevModeBanner() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
      🔓 开发模式已启用
    </div>
  );
}
