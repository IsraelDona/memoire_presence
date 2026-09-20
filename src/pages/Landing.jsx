import { Link } from 'react-router-dom';

const roleFeatures = [
  {
    role: 'Agent',
    items: [
      'Pointage par géolocalisation et reconnaissance faciale',
      'Suivi de ses présences, retards et absences',
      'Soumission de justificatifs pour validation',
    ],
  },
  {
    role: 'Chef de service',
    items: [
      'Supervision des présences de son équipe',
      'Création et suivi des missions et réunions',
      'Validation des justificatifs de ses agents',
    ],
  },
  {
    role: 'Administration',
    items: [
      'Validation des comptes et affectation aux services',
      'Configuration des zones de pointage autorisées',
      'Génération des rapports mensuels',
    ],
  },
  {
    role: 'Directeur',
    items: [
      'Suivi global des présences de la direction',
      'Évaluation des chefs de service',
      "Classements des agents et des chefs",
    ],
  },
];

const etapesPointage = [
  {
    titre: 'Connexion sécurisée',
    texte: "L'agent accède à son espace personnel. Son visage est enregistré une seule fois, à la première connexion.",
  },
  {
    titre: 'Contrôle de la position',
    texte: "Le système relève la position GPS et vérifie qu'elle se trouve dans le périmètre autorisé.",
  },
  {
    titre: 'Reconnaissance faciale',
    texte: "Si la zone est valide, la caméra compare le visage à celui enregistré pour confirmer l'identité.",
  },
  {
    titre: 'Présence enregistrée',
    texte: 'Le pointage est enregistré avec son statut : présent, retard, ou absence justifiée.',
  },
];

const reglesAppliquees = [
  {
    titre: 'Heure limite',
    texte: "Au-delà de 8h15, le pointage du matin est automatiquement enregistré comme un retard.",
  },
  {
    titre: 'Absence constatée',
    texte: "À partir de 21h, un agent qui n'a pas pointé dans la journée est compté absent.",
  },
  {
    titre: 'Jours ouvrés uniquement',
    texte: "Week-ends et jours fériés chômés sont exclus du calcul : ils ne comptent ni comme présence attendue, ni comme absence.",
  },
  {
    titre: 'Retard et absence distingués',
    texte: "Une journée à l'heure vaut un point plein, un retard un demi-point, une absence aucun : venir en retard n'équivaut pas à ne pas venir.",
  },
  {
    titre: 'Mission et réunion',
    texte: "Pendant une mission ou une réunion, le lieu de référence devient celui fixé par le chef de service.",
  },
  {
    titre: 'Justificatifs',
    texte: "Une absence couverte par un justificatif accepté est neutralisée : elle ne pèse pas sur le score.",
  },
  {
    titre: 'Évaluation',
    texte: "La note automatique découle du score de ponctualité ; le directeur peut y ajouter une note manuelle.",
  },
];

function Landing() {
  return (
    <div className="landing-di">

      {/* HERO */}
      <section className="ldi-hero-band">
        <div className="ldi-hero">
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
        </div>
      </section>

      {/* FEATURES */}
      <section className="ldi-features">
        <div className="ldi-section-head">
          <p className="ldi-kicker">Fonctionnalités</p>
          <h2>Un espace différent pour chaque rôle</h2>
          <p>
            Agents, chefs de service, administration et direction disposent
            chacun d'un tableau de bord adapté à leurs responsabilités.
          </p>
        </div>
        <div className="ldi-features-grid">
          {roleFeatures.map((r, index) => (
            <article key={r.role} className={`ldi-feature-card ldi-feature-card-${index}`}>
              <span className="ldi-feature-index">{index + 1}</span>
              <h3>{r.role}</h3>
              <ul className="ldi-feature-list">
                {r.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* DEROULE DU POINTAGE */}
      <section className="ldi-etapes-band">
        <div className="ldi-features">
          <div className="ldi-section-head">
            <p className="ldi-kicker">Le pointage</p>
            <h2>Quatre étapes, quelques secondes</h2>
            <p>
              Deux contrôles indépendants sont exigés avant qu'une présence
              soit enregistrée : la position, puis l'identité.
            </p>
          </div>

          <ol className="ldi-etapes">
            {etapesPointage.map((etape, index) => (
              <li key={etape.titre} className="ldi-etape">
                <span className="ldi-etape-num">{index + 1}</span>
                <div>
                  <strong>{etape.titre}</strong>
                  <p>{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* REGLES */}
      <section className="ldi-features">
        <div className="ldi-section-head">
          <p className="ldi-kicker">Règles appliquées</p>
          <h2>Ce que le système contrôle automatiquement</h2>
          <p>
            Les mêmes règles s'appliquent à tous, sans intervention manuelle
            sur le calcul des scores.
          </p>
        </div>

        <div className="ldi-regles-grid">
          {reglesAppliquees.map((regle) => (
            <article key={regle.titre} className="ldi-regle">
              <strong>{regle.titre}</strong>
              <p>{regle.texte}</p>
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