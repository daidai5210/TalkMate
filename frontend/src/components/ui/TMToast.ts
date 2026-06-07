type ToastType = 'success' | 'error' | 'info';

const TYPE_CLASS: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-900',
};

export function showTMToast(message: string, type: ToastType = 'info', duration = 2400) {
  if (typeof document === 'undefined') return;

  const existing = document.querySelector('[data-tm-toast="true"]');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.dataset.tmToast = 'true';
  toast.className = [
    'fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl',
    'animate-fade-in-up max-w-[calc(100vw-32px)] text-center',
    TYPE_CLASS[type],
  ].join(' ');
  toast.textContent = message;

  document.body.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -8px)';
    toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
    window.setTimeout(() => toast.remove(), 220);
  }, duration);
}
