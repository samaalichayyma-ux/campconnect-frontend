package com.esprit.campconnect.Restauration.Controller;

import com.esprit.campconnect.Restauration.Entity.Repas;
import com.esprit.campconnect.Restauration.Service.RepasService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/repas")
@CrossOrigin("*")

public class RepasController {
    private final RepasService repasService;

    public RepasController(RepasService repasService) {
        this.repasService = repasService;
    }

    @PostMapping
    public Repas create(@RequestBody Repas repas) {
        return repasService.createRepas(repas);
    }

    @GetMapping
    public List<Repas> getAll() {
        return repasService.getAllRepas();
    }
    @GetMapping("/{id}")
    public Repas getById(@PathVariable Long id) {
        return repasService.getRepasById(id);
    }

    @PutMapping("/{id}")
    public Repas update(@PathVariable Long id, @RequestBody Repas repas) {
        return repasService.updateRepas(id, repas);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repasService.deleteRepas(id);
    }



}
