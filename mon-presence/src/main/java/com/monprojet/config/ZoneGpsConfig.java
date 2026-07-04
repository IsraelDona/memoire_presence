package com.monprojet.config;

import org.springframework.stereotype.Component;

@Component
public class ZoneGpsConfig {

    /*
     * Valeurs par défaut — Ministère de l'Économie
     * et des Finances, Cotonou
     */
    public static double latitude = 6.3703;
    public static double longitude = 2.3912;
    public static double rayonKm = 1.0;
    public static String nomLieu = "Ministère de l'Économie et des Finances, Cotonou";

    /*
     * Nombre de pointages autorisés par jour (1 à 3)
     */
    public static int nombrePointagesParJour = 1;

    /*
     * Mode test : désactive la vérification de zone GPS,
     * la vérification faciale reste obligatoire
     */
    public static boolean modeTestSansZone = false;
}