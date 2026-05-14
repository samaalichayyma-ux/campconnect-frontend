package com.esprit.campconnect.Assurance.Controller;

import com.esprit.campconnect.Assurance.Entity.Garantie;
import com.esprit.campconnect.Assurance.Service.IGarantieService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/garantie")
@RequiredArgsConstructor
@CrossOrigin("*")
public class GarantieController {

    private final IGarantieService garantieService;

    @GetMapping("/all")
    public List<Garantie> getAll() {
        return garantieService.retrieveAll();
    }

    @GetMapping("/{id}")
    public Garantie getById(@PathVariable Long id) {
        return garantieService.retrieveById(id);
    }

    @GetMapping("/assurance/{assuranceId}")
    public List<Garantie> getByAssurance(@PathVariable Long assuranceId) {
        return garantieService.retrieveByAssurance(assuranceId);
    }

    @PostMapping("/add/{assuranceId}")
    public Garantie add(@PathVariable Long assuranceId, @RequestBody Garantie garantie) {
        return garantieService.add(assuranceId, garantie);
    }

    @PutMapping("/update")
    public Garantie update(@RequestBody Garantie garantie) {
        return garantieService.update(garantie);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        garantieService.remove(id);
    }
}