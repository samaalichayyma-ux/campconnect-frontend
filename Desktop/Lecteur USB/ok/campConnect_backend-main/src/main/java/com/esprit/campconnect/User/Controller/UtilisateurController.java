package com.esprit.campconnect.User.Controller;

import com.esprit.campconnect.User.DTO.UtilisateurDTO;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.User.Service.IUtilisateurService;
import com.esprit.campconnect.User.Service.UtilisateurDTOAutoImp;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name="Gestion d'utilisateur")
@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@CrossOrigin("*")

public class UtilisateurController {

    private final IUtilisateurService utilisateurService;
    private final UtilisateurDTOAutoImp utilisateurDTOAutoImp;

    @Operation(description = "Récupérer un utilisateur sans données confidentielles")
    @GetMapping("/DtoUser/{id}")
    public UtilisateurDTO getUtilisateurDto(@PathVariable Long id) {
        return utilisateurDTOAutoImp.getUtilisateur(id);
    }

    @Operation(description = "Récupérer tous les utilisateurs sans données confidentielles")
    @GetMapping("/allDtoUser")
    public List<UtilisateurDTO> getAllUtilisateursDto() {
        return utilisateurDTOAutoImp.getAllUtilisateurs();
    }

    @GetMapping("/getAllUsers")
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurService.retrieveAllUtilisateurs();
    }

    @GetMapping("/getUser/{id}")
    public Utilisateur getUtilisateur(@PathVariable Long id) {
        return utilisateurService.retrieveUtilisateur(id);
    }

    @PostMapping("/addUser")
    public Utilisateur addUtilisateur(@RequestBody Utilisateur utilisateur) {
        return utilisateurService.addUtilisateur(utilisateur);
    }

    @PutMapping("/updateUser")
    public Utilisateur modifyUtilisateur(@RequestBody Utilisateur utilisateur) {
        return utilisateurService.updateUtilisateur(utilisateur);
    }

    @DeleteMapping("/deleteUser/{id}")
    public void removeUtilisateur(@PathVariable Long id) {
        utilisateurService.removeUtilisateur(id);
    }



}
