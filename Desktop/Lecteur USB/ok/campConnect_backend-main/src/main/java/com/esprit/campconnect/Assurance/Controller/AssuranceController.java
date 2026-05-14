package com.esprit.campconnect.Assurance.Controller;


import com.esprit.campconnect.Assurance.Entity.Assurance;
import com.esprit.campconnect.Assurance.Service.IAssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assurance")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AssuranceController {

    private final IAssuranceService assuranceService;

    @GetMapping("/all")
    public List<Assurance> getAll() {
        return assuranceService.retrieveAll();
    }

    @GetMapping("/{id}")
    public Assurance getById(@PathVariable Long id) {
        return assuranceService.retrieveById(id);
    }

    @PostMapping("/add")
    public Assurance add(@RequestBody Assurance assurance) {
        return assuranceService.add(assurance);
    }

    @PutMapping("/update")
    public Assurance update(@RequestBody Assurance assurance) {
        return assuranceService.update(assurance);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        assuranceService.remove(id);
    }
}