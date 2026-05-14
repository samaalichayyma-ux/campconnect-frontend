package com.esprit.campconnect.Assurance.Controller;


import com.esprit.campconnect.Assurance.Entity.DocumentAssurance;
import com.esprit.campconnect.Assurance.Service.IDocumentAssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/document-assurance")
@RequiredArgsConstructor
@CrossOrigin("*")
public class DocumentAssuranceController {

    private final IDocumentAssuranceService documentService;

    @GetMapping("/all")
    public List<DocumentAssurance> getAll() {
        return documentService.retrieveAll();
    }

    @GetMapping("/{id}")
    public DocumentAssurance getById(@PathVariable Long id) {
        return documentService.retrieveById(id);
    }

    @GetMapping("/sinistre/{sinistreId}")
    public List<DocumentAssurance> getBySinistre(@PathVariable Long sinistreId) {
        return documentService.retrieveBySinistre(sinistreId);
    }

    @PostMapping("/add/{sinistreId}")
    public DocumentAssurance add(@PathVariable Long sinistreId,
                                 @RequestBody DocumentAssurance documentAssurance) {
        return documentService.add(sinistreId, documentAssurance);
    }

    @PutMapping("/update")
    public DocumentAssurance update(@RequestBody DocumentAssurance documentAssurance) {
        return documentService.update(documentAssurance);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        documentService.remove(id);
    }
}