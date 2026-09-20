package com.monprojet.service;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.monprojet.entity.JourFerie;
import com.monprojet.repository.JourFerieRepository;

/*
 * Jours fériés chômés au Bénin.
 *
 * Trois familles, traitées différemment parce qu'elles n'ont pas la
 * même prévisibilité :
 *
 *  - dates fixes (Nouvel An, Vodoun, Travail, Indépendance,
 *    Assomption, Toussaint, Noël) : connues d'avance, codées ici ;
 *  - fêtes chrétiennes mobiles (lundi de Pâques, Ascension, lundi de
 *    Pentecôte) : calculables à partir de la date de Pâques ;
 *  - fêtes musulmanes (Maouloud, Aïd el-Fitr, Aïd el-Kébir) : elles
 *    dépendent de l'observation lunaire et ne sont confirmées que par
 *    communiqué officiel. Elles ne peuvent donc pas être calculées :
 *    l'administrateur les saisit dans la table jours_feries.
 */
@Service
public class JoursFeriesService {

    private final JourFerieRepository jourFerieRepository;

    public JoursFeriesService(JourFerieRepository jourFerieRepository) {
        this.jourFerieRepository = jourFerieRepository;
    }

    /*
     * Fêtes à date fixe.
     */
    private static final List<MonthDay> DATES_FIXES = List.of(
            MonthDay.of(1, 1),    // Nouvel An
            MonthDay.of(1, 10),   // Fête des Religions Traditionnelles (Vodoun)
            MonthDay.of(5, 1),    // Fête du Travail
            MonthDay.of(8, 1),    // Fête Nationale
            MonthDay.of(8, 15),   // Assomption
            MonthDay.of(11, 1),   // Toussaint
            MonthDay.of(12, 25)   // Noël
    );

    /*
     * Vrai si la date est un jour férié chômé.
     */
    public boolean estFerie(LocalDate date) {

        if (date == null) {
            return false;
        }

        if (joursFeriesCalcules(date.getYear()).contains(date)) {
            return true;
        }

        return jourFerieRepository.existsByDate(date);
    }

    /*
     * Ensemble des jours fériés d'une période, pour éviter une
     * requête par jour lors du parcours d'un cycle.
     */
    public Set<LocalDate> joursFeriesEntre(LocalDate debut, LocalDate fin) {

        Set<LocalDate> feries = new HashSet<>();

        if (debut == null || fin == null) {
            return feries;
        }

        for (int annee = debut.getYear(); annee <= fin.getYear(); annee++) {
            feries.addAll(joursFeriesCalcules(annee));
        }

        jourFerieRepository
                .findByDateBetweenOrderByDateAsc(debut, fin)
                .forEach(jour -> feries.add(jour.getDate()));

        feries.removeIf(jour -> jour.isBefore(debut) || jour.isAfter(fin));

        return feries;
    }

    /*
     * Jours fériés d'une année qui se calculent : dates fixes et
     * fêtes chrétiennes mobiles.
     */
    private Set<LocalDate> joursFeriesCalcules(int annee) {

        Set<LocalDate> feries = new HashSet<>();

        for (MonthDay jour : DATES_FIXES) {
            feries.add(jour.atYear(annee));
        }

        LocalDate paques = calculerPaques(annee);

        feries.add(paques.plusDays(1));    // Lundi de Pâques
        feries.add(paques.plusDays(39));   // Jeudi de l'Ascension
        feries.add(paques.plusDays(50));   // Lundi de Pentecôte

        return feries;
    }

    /*
     * Date de Pâques (calendrier grégorien), algorithme de Meeus.
     * Les trois fêtes chrétiennes mobiles s'en déduisent.
     */
    private LocalDate calculerPaques(int annee) {

        int a = annee % 19;
        int b = annee / 100;
        int c = annee % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;

        int mois = (h + l - 7 * m + 114) / 31;
        int jour = ((h + l - 7 * m + 114) % 31) + 1;

        return LocalDate.of(annee, mois, jour);
    }

    /*
     * Jours fériés saisis manuellement (fêtes musulmanes et
     * journées chômées exceptionnelles).
     */
    public List<JourFerie> getJoursDeclares() {
        return jourFerieRepository.findAllByOrderByDateDesc();
    }

    public String declarerJourFerie(LocalDate date, String libelle) {

        if (date == null || libelle == null || libelle.isBlank()) {
            return "Date et libellé obligatoires";
        }

        if (jourFerieRepository.existsByDate(date)) {
            return "Ce jour est déjà déclaré férié";
        }

        jourFerieRepository.save(new JourFerie(date, libelle.trim()));

        return "Jour férié enregistré";
    }

    public String supprimerJourFerie(Long id) {

        if (id == null || !jourFerieRepository.existsById(id)) {
            return "Jour férié introuvable";
        }

        jourFerieRepository.deleteById(id);

        return "Jour férié supprimé";
    }
}
