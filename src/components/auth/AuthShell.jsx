function AuthShell({ eyebrow, title, description, highlights = [], children }) {
  return (
    <div className="auth-shell">
      <section className="auth-shell-copy">
        <div className="auth-brand-block">
          <div className="auth-brand-badge">DGB</div>
          <div>
            <div className="auth-brand-name">e-presence</div>
            <div className="auth-brand-tag">Gestion intelligente des présences</div>
          </div>
        </div>

        <p className="auth-shell-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-shell-description">{description}</p>

        <div className="auth-highlights">
          {highlights.map((item) => (
            <div key={item.title} className="auth-highlight-card">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-shell-form">{children}</section>
    </div>
  );
}

export default AuthShell;
