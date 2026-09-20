package com.monprojet.service;

import java.time.LocalDate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.monprojet.dto.ContextePointageResponse;
import com.monprojet.dto.PointageRequest;
import com.monprojet.entity.GpsConfig;
import com.monprojet.entity.Mission;
import com.monprojet.entity.Presence;
import com.monprojet.entity.Reunion;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutPresence;
import com.monprojet.enums.TypePresence;
import com.monprojet.repository.GpsConfigRepository;
import com.monprojet.repository.MissionRepository;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.ReunionRepository;
import com.monprojet.repository.UtilisateurRepository;
@Service
public class PresenceService {

	private final PresenceRepository presenceRepository;

	private final UtilisateurRepository utilisateurRepository;

	private final AnalyseIAService analyseIAService;
	private final GeocodingService geocodingService;
	private final FaceComparisonService faceComparisonService;
	private final GpsConfigRepository gpsConfigRepository;
	private final MissionRepository missionRepository;
	private final ReunionRepository reunionRepository;

	public PresenceService(
	        PresenceRepository presenceRepository,
	        UtilisateurRepository utilisateurRepository,
	        AnalyseIAService analyseIAService,
	        GeocodingService geocodingService,
	        FaceComparisonService faceComparisonService,
	        GpsConfigRepository gpsConfigRepository,
	        MissionRepository missionRepository,
	        ReunionRepository reunionRepository) {

	    this.presenceRepository =presenceRepository;

	    this.utilisateurRepository =utilisateurRepository;

	    this.analyseIAService =analyseIAService;

	    this.geocodingService =geocodingService;
	    this.faceComparisonService = faceComparisonService;
	    this.gpsConfigRepository = gpsConfigRepository;
	    this.missionRepository = missionRepository;
	    this.reunionRepository = reunionRepository;
	}

	/*
	 * Récupère la configuration GPS unique (Ministère de
	 * l'Économie et des Finances par défaut), en la créant
	 * si elle n'existe pas encore.
	 */
	private GpsConfig getGpsConfig() {

	    List<GpsConfig> configs = gpsConfigRepository.findAll();

	    if (configs.isEmpty()) {
	        GpsConfig config = new GpsConfig(
	                "Ministère de l'Économie et des Finances",
	                6.3703,
	                2.3912,
	                1.0
	        );
	        return gpsConfigRepository.save(config);
	    }

	    return configs.get(0);
	}

    /*
     * Pointage présence
     */
    public String marquerPresence(
            PointageRequest request) {

        /*
         * Utilisateur connecté via JWT
         */
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {

            return "Utilisateur introuvable";
        }

        /*
         * Étapes 1 et 2 du diagramme de séquence :
         * déjà marqué aujourd'hui ? puis zone GPS autorisée ?
         * Ni l'une ni l'autre ne nécessite le visage.
         */
        String erreurVerification =
                verifierPointagePossible(utilisateur, request);

        if (erreurVerification != null) {
            return erreurVerification;
        }

        /*
         * Création présence
         */
        Presence presence =
                new Presence();

        presence.setDatePresence(
                LocalDate.now()
        );

        presence.setHeurePointage(
                LocalDateTime.now()
        );

        presence.setLatitude(
                request.getLatitude()
        );

        presence.setLongitude(
                request.getLongitude()
        );

        /*
         * Le type n'est pas celui déclaré par l'agent mais celui
         * déduit de son planning du jour : mission, réunion, ou
         * bureau par défaut.
         */
        presence.setTypePresence(
                determinerContexteDuJour(utilisateur).getTypePresence()
        );

        String nomLieuDetecte = geocodingService.obtenirNomLieu(
                request.getLatitude(), request.getLongitude()
        );
        presence.setNomLieu(nomLieuDetecte);

        /*
         * Détermination statut
         */
        LocalTime heureActuelle =
                LocalTime.now();

        LocalTime heureLimite =
                LocalTime.of(8, 15);

        if (heureActuelle
                .isAfter(heureLimite)) {

            presence.setStatutPresence(
                    StatutPresence.RETARD
            );

        } else {

            presence.setStatutPresence(
                    StatutPresence.PRESENT
            );
        }

        presence.setUtilisateur(
                utilisateur
        );

        presenceRepository.save(
                presence
        );

        /*
         * Génération automatique de l'analyse IA juste après le pointage.
         * Ne doit jamais faire échouer le pointage lui-même.
         */
        try {
            analyseIAService.genererAnalyse(utilisateur.getId());
        } catch (Exception e) {
            System.err.println(
                    "Erreur génération analyse IA après pointage : " + e.getMessage());
        }

        return "Présence marquée avec succès";
    }

    /*
     * Vérification préalable exposée au frontend : déjà
     * marqué aujourd'hui ? zone GPS autorisée ? Ne crée
     * aucune présence, ne nécessite pas le visage. Permet
     * au frontend de ne demander la vérification faciale
     * que si ces deux conditions sont déjà remplies, comme
     * le décrit le diagramme de séquence.
     */
    public String verifierZone(PointageRequest request) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {
            return "Utilisateur introuvable";
        }

        String erreur = verifierPointagePossible(utilisateur, request);

        return erreur != null ? erreur : "Zone autorisée";
    }

    /*
     * Déjà marqué aujourd'hui, puis zone GPS autorisée.
     * Retourne null si tout est correct, sinon le message
     * d'erreur à afficher.
     */
    private String verifierPointagePossible(
            Utilisateur utilisateur,
            PointageRequest request) {

        /*
         * Vérifie le nombre de pointages déjà effectués aujourd'hui
         * par rapport à la limite configurée par l'admin
         */
        GpsConfig gpsConfig = getGpsConfig();

        long pointagesAujourdhui =
                presenceRepository
                        .countByUtilisateurAndDatePresence(
                                utilisateur,
                                LocalDate.now()
                        );

        if (pointagesAujourdhui >=
                gpsConfig.getNombrePointagesParJour()) {

            return "Vous avez déjà effectué le nombre maximum de pointages autorisés aujourd'hui. Réessayez demain.";
        }

        /*
         * Vérification GPS
         */
        if (request.getLatitude() == null
                || request.getLongitude() == null) {

            return "Position GPS introuvable";
        }

        /*
         * Le lieu de référence est déterminé par le serveur, pas
         * déclaré par l'agent : mission ou réunion du jour si elle
         * existe, sinon le périmètre du bureau.
         */
        ContextePointageResponse contexte =
                determinerContexteDuJour(utilisateur);

        double distanceKm =
                calculerDistanceKm(
                        request.getLatitude(),
                        request.getLongitude(),
                        contexte.getLatitude(),
                        contexte.getLongitude()
                );

        double rayonAutorise = contexte.getRayonKm();

        /*
         * Vérifie si agent dans la zone autorisée,
         * sauf si le mode test est activé par l'admin
         */
        if (!gpsConfig.isModeTestSansZone()
                && distanceKm > rayonAutorise) {

            return String.format(
                    "Pointage refusé : vous êtes à %.2f km de %s. Rayon autorisé : %.0f km",
                    distanceKm,
                    contexte.getNomLieu() != null ? contexte.getNomLieu() : "votre lieu de référence",
                    rayonAutorise
            );
        }

        return null;
    }

    /*
     * Détermine le centre GPS et le rayon de référence pour la
     * vérification de zone : ceux de la mission/réunion du jour
     * de l'agent si le pointage est de type MISSION/REUNION et
     * qu'une mission/réunion avec coordonnées existe (rayon de
     * la mission/réunion, ou celui du bureau si non précisé),
     * sinon la configuration GPS générale (bureau).
     * Retourne { latitude, longitude, rayonKm }.
     */
    /*
     * Determine le contexte de pointage du jour : si l'agent est
     * inscrit a une mission ou a une reunion aujourd hui, le type et
     * le lieu de reference en decoulent ; sinon c est le bureau et le
     * perimetre defini par l administrateur. La mission ou la reunion
     * ne vaut que pour sa journee : le lendemain, le lieu de
     * reference redevient automatiquement celui du bureau.
     */
    public ContextePointageResponse determinerContexteDuJour(Utilisateur utilisateur) {

        GpsConfig gpsConfig = getGpsConfig();

        ContextePointageResponse contexte = new ContextePointageResponse();
        contexte.setTypePresence(TypePresence.BUREAU);
        contexte.setNomLieu(gpsConfig.getNomLieu());
        contexte.setLatitude(gpsConfig.getLatitude());
        contexte.setLongitude(gpsConfig.getLongitude());
        contexte.setRayonKm(gpsConfig.getRayonKm());

        LocalDateTime debutJour = LocalDate.now().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);
        LocalDateTime maintenant = LocalDateTime.now();

        Mission mission = null;

        for (Mission candidate : missionRepository.findByParticipantAndJour(
                utilisateur, debutJour, finJour)) {

            if (candidate.getLatitude() == null
                    || candidate.getLongitude() == null
                    || candidate.getDateMission() == null) {
                continue;
            }

            if (mission == null
                    || estPlusProche(candidate.getDateMission(),
                            mission.getDateMission(), maintenant)) {
                mission = candidate;
            }
        }

        if (mission != null) {
            contexte.setTypePresence(TypePresence.MISSION);
            contexte.setNomLieu(mission.getLieu());
            contexte.setLatitude(mission.getLatitude());
            contexte.setLongitude(mission.getLongitude());
            contexte.setRayonKm(mission.getRayonKm() != null
                    ? mission.getRayonKm()
                    : gpsConfig.getRayonKm());
            contexte.setMotif(mission.getTitre());
            return contexte;
        }

        Reunion reunion = null;

        for (Reunion candidate : reunionRepository.findByParticipantAndJour(
                utilisateur, debutJour, finJour)) {

            if (candidate.getLatitude() == null
                    || candidate.getLongitude() == null
                    || candidate.getDateReunion() == null) {
                continue;
            }

            if (reunion == null
                    || estPlusProche(candidate.getDateReunion(),
                            reunion.getDateReunion(), maintenant)) {
                reunion = candidate;
            }
        }

        if (reunion != null) {
            contexte.setTypePresence(TypePresence.REUNION);
            contexte.setNomLieu(reunion.getLieu());
            contexte.setLatitude(reunion.getLatitude());
            contexte.setLongitude(reunion.getLongitude());
            contexte.setRayonKm(reunion.getRayonKm() != null
                    ? reunion.getRayonKm()
                    : gpsConfig.getRayonKm());
            contexte.setMotif(reunion.getTitre());
            return contexte;
        }

        return contexte;
    }

    /*
     * Contexte de l utilisateur connecte, pour l affichage cote
     * interface avant le pointage.
     */
    public ContextePointageResponse getContexteDuJour() {

        Utilisateur utilisateur = getUtilisateurConnecte();

        if (utilisateur == null) {
            return new ContextePointageResponse();
        }

        return determinerContexteDuJour(utilisateur);
    }

    private Utilisateur getUtilisateurConnecte() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return null;
        }

        return utilisateurRepository
                .findByEmail(authentication.getName())
                .orElse(null);
    }
    private boolean estPlusProche(
            LocalDateTime candidat,
            LocalDateTime actuel,
            LocalDateTime reference) {

        long ecartCandidat = Math.abs(
                java.time.Duration.between(reference, candidat).toMinutes());

        long ecartActuel = Math.abs(
                java.time.Duration.between(reference, actuel).toMinutes());

        return ecartCandidat < ecartActuel;
    }

    /*
     * Calcul distance GPS
     * Formule Haversine
     */
    private double calculerDistanceKm(
            double latitude1,
            double longitude1,
            double latitude2,
            double longitude2) {

        final double RAYON_TERRE_KM =
                6371;

        double deltaLatitude =
                Math.toRadians(
                        latitude2
                                - latitude1
                );

        double deltaLongitude =
                Math.toRadians(
                        longitude2
                                - longitude1
                );

        double a =
                Math.sin(
                        deltaLatitude / 2
                )
                        *
                        Math.sin(
                                deltaLatitude / 2
                        )
                        +
                        Math.cos(
                                Math.toRadians(
                                        latitude1
                                )
                        )
                        *
                        Math.cos(
                                Math.toRadians(
                                        latitude2
                                )
                        )
                        *
                        Math.sin(
                                deltaLongitude / 2
                        )
                        *
                        Math.sin(
                                deltaLongitude / 2
                        );

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return RAYON_TERRE_KM * c;
    }

    /*
     * Historique utilisateur connecté
     */
    public List<Presence>
    getMesPresences() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {

            return List.of();
        }

        return presenceRepository
                .findByUtilisateurOrderByDatePresenceDesc(
                        utilisateur
                );
    }

    /*
     * Toutes les présences
     */
    public List<Presence>
    getToutesLesPresences() {

        return presenceRepository
                .findAllByOrderByDatePresenceDesc();
    }
    
    /*
     * Vérification faciale avant pointage
     */
    public FaceVerificationResult verifierVisage(
            com.monprojet.dto.FaceRegistrationRequest request) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {
            return FaceVerificationResult.erreur(
                    "Utilisateur introuvable."
            );
        }

        String photoReference =
                utilisateur.getPhotoVisage();

        String photoCapturee =
                request.getPhotoVisage();

        return faceComparisonService.comparerVisages(
                photoReference,
                photoCapturee
        );
    }
}