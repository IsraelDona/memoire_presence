import { Link } from 'react-router-dom';

const pillars = [
  {
    title: 'Accès sécurisé',
    text: 'Connexion par compte professionnel avec session JWT et redirection selon le rôle.',
  },
  {
    title: 'Validation admin',
    text: 'Les comptes agents suivent un parcours contrôlé avant activation.',
  },
  {
    title: 'Architecture scalable',
    text: 'Front React structuré pour accueillir les modules métiers sans refonte.',
  },
];

function Landing() {
  return (
    <div className="landing-page landing-page-clean">
      <section className="landing-hero-clean">
        <div className="landing-hero-copy">
          <p className="landing-kicker">DGB e-presence</p>
          <h1>Une authentification claire pour une application RH sérieuse</h1>
          <p className="landing-subtitle">
            Le socle est désormais propre: login, inscription agent, protection des routes et gestion des rôles.
            Le reste du système viendra ensuite sur une base saine.
          </p>
          <div className="landing-cta">
            <Link to="/login" className="primary-button landing-primary">
              Se connecter
            </Link>
            <Link to="/register" className="secondary-button landing-secondary">
              Demander un compte
            </Link>
          </div>
        </div>

        <div className="landing-hero-card">
          <div className="landing-hero-card-top">
            <span className="landing-status-dot" />
            <span>Plateforme prête à brancher sur Spring Boot</span>
          </div>
          <div className="landing-hero-card-body">
            <div className="landing-metric">
              <strong>3</strong>
              <span>Rôles supportés</span>
            </div>
            <div className="landing-metric">
              <strong>1</strong>
              <span>Parcours d’auth centralisé</span>
            </div>
            <div className="landing-metric">
              <strong>100%</strong>
              <span>Routes protégées</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-pillars">
        {pillars.map((item) => (
          <article key={item.title} className="landing-pillar-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Landing;
