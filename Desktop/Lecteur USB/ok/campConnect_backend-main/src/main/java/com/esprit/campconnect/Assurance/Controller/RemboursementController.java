package com.esprit.campconnect.Assurance.Controller;


import com.esprit.campconnect.Assurance.Entity.Remboursement;
import com.esprit.campconnect.Assurance.Service.IRemboursementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/remboursement")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RemboursementController {

    private final IRemboursementService remboursementService;

    @GetMapping("/all")
    public List<Remboursement> getAll() {
        return remboursementService.retrieveAll();
    }

    @GetMapping("/{id}")
    public Remboursement getById(@PathVariable Long id) {
        return remboursementService.retrieveById(id);
    }

    @GetMapping("/sinistre/{sinistreId}")
    public List<Remboursement> getBySinistre(@PathVariable Long sinistreId) {
        return remboursementService.retrieveBySinistre(sinistreId);
    }

    @PostMapping("/add/{sinistreId}")
    public Remboursement add(@PathVariable Long sinistreId,
                             @RequestBody Remboursement remboursement) {
        return remboursementService.add(sinistreId, remboursement);
    }

    @PutMapping("/update")
    public Remboursement update(@RequestBody Remboursement remboursement) {
        return remboursementService.update(remboursement);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        remboursementService.remove(id);
    }
}