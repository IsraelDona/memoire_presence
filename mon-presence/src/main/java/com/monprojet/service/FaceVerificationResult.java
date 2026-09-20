package com.monprojet.service;

public class FaceVerificationResult {

    private final boolean reconnue;
    private final String message;

    public FaceVerificationResult(boolean reconnue, String message) {
        this.reconnue = reconnue;
        this.message = message;
    }

    public boolean estReconnue() {
        return reconnue;
    }

    public String getMessage() {
        return message;
    }

    public static FaceVerificationResult reconnue(String message) {
        return new FaceVerificationResult(true, message);
    }

    public static FaceVerificationResult mauvaiseCapture() {
        return new FaceVerificationResult(
                false,
                "Veuillez mieux vous positionner et reprendre la photo."
        );
    }

    public static FaceVerificationResult personneDifferente(String message) {
        return new FaceVerificationResult(false, message);
    }

    public static FaceVerificationResult erreur(String message) {
        return new FaceVerificationResult(false, message);
    }
}