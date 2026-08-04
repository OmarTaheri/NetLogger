import type { DemoAccount } from '../api/auth';

export default function DemoAccountPicker({
  accounts,
  onSelect,
}: {
  accounts: DemoAccount[];
  onSelect: (account: DemoAccount) => void;
}) {
  if (!accounts.length) return null;

  return (
    <section className="auth-demo-accounts" aria-label="Demo account access">
      <div className="auth-demo-accounts__heading">
        <span>Demo access</span>
        <small>Click an account to fill its credentials</small>
      </div>
      <div className="auth-demo-accounts__grid">
        {accounts.map((account) => (
          <button key={account.email} type="button" onClick={() => onSelect(account)} className="auth-demo-account">
            <span className="auth-demo-account__role">{account.role}</span>
            <strong>{account.label}</strong>
            <small>{account.email}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
