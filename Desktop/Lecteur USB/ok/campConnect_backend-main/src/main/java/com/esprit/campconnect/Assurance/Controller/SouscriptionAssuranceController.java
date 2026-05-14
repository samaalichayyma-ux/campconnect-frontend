package com.esprit.campconnect.Assurance.Controller;


import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;
import com.esprit.campconnect.Assurance.Service.ISouscriptionAssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/souscription-assurance")
@RequiredArgsConstructor
@CrossOrigin("*")
public class SouscriptionAssuranceController {

    private final ISouscriptionAssuranceService souscriptionService;

    @GetMapping("/all")
    public List<SouscriptionAssurance> getAll() {
        return souscriptionService.retrieveAll();
    }

    @GetMapping("/{id}")
    public SouscriptionAssurance getById(@PathVariable Long id) {
        return souscriptionService.retrieveById(id);
    }

    @GetMapping("/user/{utilisateurId}")
    public List<SouscriptionAssurance> getByUtilisateur(@PathVariable Long utilisateurId) {
        return souscriptionService.retrieveByUtilisateur(utilisateurId);
    }

    @PostMapping("/add/{utilisateurId}/{assuranceId}")
    public SouscriptionAssurance add(@PathVariable Long utilisateurId,
                                     @PathVariable Long assuranceId,
                                     @RequestBody SouscriptionAssurance souscription) {
        return souscriptionService.add(utilisateurId, assuranceId, souscription);
    }

    @PutMapping("/update")
    public SouscriptionAssurance update(@RequestBody SouscriptionAssurance souscription) {
        return souscriptionService.update(souscription);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        souscriptionService.remove(id);
    }
}