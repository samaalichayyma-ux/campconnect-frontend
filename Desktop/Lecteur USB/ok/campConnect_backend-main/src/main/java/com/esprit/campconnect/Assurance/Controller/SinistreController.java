package com.esprit.campconnect.Assurance.Controller;


import com.esprit.campconnect.Assurance.Entity.Sinistre;
import com.esprit.campconnect.Assurance.Service.ISinistreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sinistre")
@RequiredArgsConstructor
@CrossOrigin("*")
public class SinistreController {

    private final ISinistreService sinistreService;

    @GetMapping("/all")
    public List<Sinistre> getAll() {
        return sinistreService.retrieveAll();
    }

    @GetMapping("/{id}")
    public Sinistre getById(@PathVariable Long id) {
        return sinistreService.retrieveById(id);
    }

    @GetMapping("/souscription/{souscriptionId}")
    public List<Sinistre> getBySouscription(@PathVariable Long souscriptionId) {
        return sinistreService.retrieveBySouscription(souscriptionId);
    }

    @PostMapping("/add/{souscriptionId}")
    public Sinistre add(@PathVariable Long souscriptionId,
                        @RequestBody Sinistre sinistre) {
        return sinistreService.add(souscriptionId, sinistre);
    }

    @PutMapping("/update")
    public Sinistre update(@RequestBody Sinistre sinistre) {
        return sinistreService.update(sinistre);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        sinistreService.remove(id);
    }
}