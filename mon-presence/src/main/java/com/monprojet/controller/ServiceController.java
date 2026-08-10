package com.monprojet.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.monprojet.entity.Service;
import com.monprojet.repository.ServiceRepository;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceRepository serviceRepository;

    public ServiceController(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @GetMapping
    public List<Service> listerServices() {
        return serviceRepository.findAll();
    }
}