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
    <div className="landing-di">

      {/* HERO */}
      <section className="ldi-hero">
        <div className="ldi-hero-copy">
          <p className="ldi-kicker">Direction Générale du Budget — Direction Informatique — Bénin</p>
          <h1>Gérez la présence de vos agents avec précision</h1>
          <p className="ldi-subtitle">
            e-presence est la plateforme officielle de gestion des présences
            de la DI. Pointage GPS, vérification faciale, analyses IA et
            supervision en temps réel.
          </p>
          <div className="ldi-cta">
            <Link to="/login" className="ldi-btn-primary ldi-btn-large">
              Accéder à la plateforme
            </Link>
            <Link to="/register" className="ldi-btn-outline ldi-btn-large">
              Demander un compte agent
            </Link>
          </div>
        </div>

        <div className="ldi-hero-card">
          <div className="ldi-hero-card-head">
            <span className="ldi-dot-live" />
            <span>Plateforme active — DI Bénin</span>
          </div>
          <div className="ldi-stats-row">
            {stats.map((s) => (
              <div key={s.label} className="ldi-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="ldi-hero-card-body">
            <div className="ldi-presence-demo">
              <div className="ldi-presence-orb">✓</div>
              <div>
                <strong>Présence validée</strong>
                <span>Zone ministère confirmée · GPS actif</span>
              </div>
            </div>
            <div className="ldi-roles-row">
              <span className="ldi-role-pill">Admin</span>
              <span className="ldi-role-pill">Chef service</span>
              <span className="ldi-role-pill">Agent</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="ldi-features">
        <div className="ldi-section-head">
          <p className="ldi-kicker">Fonctionnalités</p>
          <h2>Tout ce dont la DI de la DGB a besoin</h2>
          <p>
            Une plateforme complète pensée pour les besoins réels de
            l'administration publique béninoise.
          </p>
        </div>
        <div className="ldi-features-grid">
          {features.map((f) => (
            <article key={f.title} className="ldi-feature-card">
              <span className="ldi-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ldi-footer">
        <span>
          © 2026 Direction Générale du Budget — République du Bénin
        </span>
        
      </footer>

    </div>
  );
}

export default Landing;