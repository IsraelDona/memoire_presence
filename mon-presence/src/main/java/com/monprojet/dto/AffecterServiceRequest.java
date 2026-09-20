package com.monprojet.dto;

public class AffecterServiceRequest {

    private Long agentId;
    private Long serviceId;

    public AffecterServiceRequest() {
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }
}
