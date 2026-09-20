package com.monprojet.dto;

/*
 * Informations administratives d'un agent, saisies par l'administrateur.
 */
public class InfosAgentRequest {

    private Long agentId;
    private String matricule;
    private String poste;
    private String grade;

    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getPoste() { return poste; }
    public void setPoste(String poste) { this.poste = poste; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
}
