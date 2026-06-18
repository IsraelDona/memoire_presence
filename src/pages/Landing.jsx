import { Link } from 'react-router-dom';

const stats = [
  { value: '3', label: 'Rôles métier' },
  { value: 'JWT', label: 'Auth sécurisée' },
  { value: '100%', label: 'Routes protégées' },
];

const features = [
  {
    icon: '🔐',
    title: 'Authentification JWT',
    text: 'Session sécurisée avec redirection automatique selon le rôle — Admin, Chef service ou Agent.',
  },
  {
    icon: '📍',
    title: 'Pointage GPS',
    text: 'Les agents marquent leur présence depuis le périmètre autorisé du Ministère avec vérification géographique.',
  },
  {
    icon: '🤖',
    title: 'Analyse IA',
    text: "Chaque agent dispose d'une analyse intelligente de sa ponctualité et de ses habitudes de présence.",
  },
  {
    icon: '✅',
    title: 'Validation admin',
    text: "Aucun compte n'est actif sans validation manuelle. L'administrateur contrôle tous les accès.",
  },
  {
    icon: '📋',
    title: 'Justificatifs',
    text: 'Les agents soumettent leurs justificatifs directement depuis la plateforme pour validation.',
  },
  {
    icon: '📊',
    title: 'Supervision',
    text: 'Le chef de service suit les présences de son équipe et pilote les missions et réunions.',
  },
];

function Landing() {
  return (
    <div className="landing-dgb">

      {/* HERO */}
      <section className="ldgb-hero">
        <div className="ldgb-hero-copy">
          <p className="ldgb-kicker">Direction Générale du Budget — Bénin</p>
          <h1>Gérez la présence de vos agents avec précision</h1>
          <p className="ldgb-subtitle">
            e-presence est la plateforme officielle de gestion des présences
            de la DGB. Pointage GPS, vérification faciale, analyses IA et
            supervision en temps réel.
          </p>
          <div className="ldgb-cta">
            <Link to="/login" className="ldgb-btn-primary ldgb-btn-large">
              Accéder à la plateforme
            </Link>
            <Link to="/register" className="ldgb-btn-outline ldgb-btn-large">
              Demander un compte agent
            </Link>
          </div>
        </div>

        <div className="ldgb-hero-card">
          <div className="ldgb-hero-card-head">
            <span className="ldgb-dot-live" />
            <span>Plateforme active — DGB Bénin</span>
          </div>
          <div className="ldgb-stats-row">
            {stats.map((s) => (
              <div key={s.label} className="ldgb-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="ldgb-hero-card-body">
            <div className="ldgb-presence-demo">
              <div className="ldgb-presence-orb">✓</div>
              <div>
                <strong>Présence validée</strong>
                <span>Zone ministère confirmée · GPS actif</span>
              </div>
            </div>
            <div className="ldgb-roles-row">
              <span className="ldgb-role-pill">Admin</span>
              <span className="ldgb-role-pill">Chef service</span>
              <span className="ldgb-role-pill">Agent</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="ldgb-features">
        <div className="ldgb-section-head">
          <p className="ldgb-kicker">Fonctionnalités</p>
          <h2>Tout ce dont la DGB a besoin</h2>
          <p>
            Une plateforme complète pensée pour les besoins réels de
            l'administration publique béninoise.
          </p>
        </div>
        <div className="ldgb-features-grid">
          {features.map((f) => (
            <article key={f.title} className="ldgb-feature-card">
              <span className="ldgb-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ldgb-footer">
        <span>
          © 2026 Direction Générale du Budget — République du Bénin
        </span>
        
      </footer>

    </div>
  );
}

export default Landing;