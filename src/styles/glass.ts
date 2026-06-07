export const glassStyles = `
  @keyframes blobMove1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(60px, -40px) scale(1.05); }
    66% { transform: translate(-30px, 50px) scale(0.95); }
  }
  @keyframes blobMove2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(-70px, 30px) scale(1.08); }
    75% { transform: translate(40px, -60px) scale(0.92); }
  }
  @keyframes blobMove3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40% { transform: translate(50px, 70px) scale(1.03); }
    80% { transform: translate(-60px, -20px) scale(0.97); }
  }
  .blob-bg {
    position: absolute; border-radius: 50%;
    filter: blur(100px); pointer-events: none;
  }
  .glass-card {
    background: color-mix(in oklch, var(--color-card) 60%, transparent);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 16px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .glass-input {
    background: color-mix(in oklch, var(--color-card) 40%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: var(--color-foreground);
    width: 100%;
    padding: 13px 44px 13px 16px;
    font-size: 15px;
    outline: none;
    font-family: inherit;
  }
  .glass-input-no-icon {
    padding-right: 16px !important;
  }
  .glass-input::placeholder { color: var(--color-muted-foreground); }
  .glass-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent);
  }
  .glass-input.error {
    border-color: var(--color-destructive) !important;
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-destructive) 12%, transparent) !important;
  }
  .glass-btn-primary {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: color-mix(in oklch, var(--color-primary) 85%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-primary) 40%, transparent);
    box-shadow: 0 4px 24px color-mix(in oklch, var(--color-primary) 25%, transparent);
    border-radius: 12px;
    width: 100%;
    height: 56px;
    font-weight: 700;
    font-size: 15px;
    color: #fff;
    cursor: pointer;
    transition: box-shadow 0.15s, opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: inherit;
  }
  .glass-btn-primary:hover:not(:disabled) {
    box-shadow: 0 4px 32px color-mix(in oklch, var(--color-primary) 40%, transparent);
  }
  .glass-btn-primary:active:not(:disabled) {
    box-shadow: 0 4px 40px color-mix(in oklch, var(--color-primary) 55%, transparent);
  }
  .glass-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .glass-btn-secondary {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: color-mix(in oklch, var(--color-card) 60%, transparent);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    width: 100%;
    height: 56px;
    font-weight: 600;
    font-size: 15px;
    color: var(--color-foreground);
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    font-family: inherit;
  }
  .glass-btn-secondary:hover:not(:disabled) {
    background: color-mix(in oklch, var(--color-card) 75%, transparent);
    box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  }
  .glass-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .input-wrapper { position: relative; }
  .input-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    color: var(--color-muted-foreground); cursor: pointer; line-height: 0;
    background: none; border: none; padding: 0;
  }
  .field-error { font-size: 12px; color: var(--color-destructive); margin-top: 5px; }
`;
