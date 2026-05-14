package com.esprit.campconnect.User.Controller;

import com.esprit.campconnect.User.DTO.ProfilDTO;
import com.esprit.campconnect.User.Entity.Profil;
import com.esprit.campconnect.User.Repository.ProfilRepository;
import com.esprit.campconnect.User.Service.IProfilService;
import com.esprit.campconnect.User.Service.ProfilDTOAutoImp;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name="Gestion de profil")
@RestController
@RequiredArgsConstructor
@RequestMapping("/profil")
@CrossOrigin("*")


public class ProfilController {
    private final IProfilService profilService;
    private final ProfilDTOAutoImp profilDTOAutoImp;

    @Operation(description = "Récupérer un profil sans données sensibles")
    @GetMapping("/DtoProfile/{id}")
    public ProfilDTO getProfilDto(@PathVariable Long id) {
        return profilDTOAutoImp.getProfil(id);
    }

    @Operation(description = "Récupérer tous les profils")
    @GetMapping("/allDtoProfile")
    public List<ProfilDTO> getAllProfilsDto() {
        return profilDTOAutoImp.getAllProfils();
    }

    @GetMapping("/getAllProfils")
    public List<Profil> getAllProfils() {
        return profilService.retrieveAllProfils();
    }

    @GetMapping("/getProfil/{id}")
    public Profil getProfil(@PathVariable Long id) {
        return profilService.retrieveProfil(id);
    }


    @PutMapping("/updateProfil")
    public Profil modifyProfil(@RequestBody Profil profil) {
        return profilService.updateProfil(profil);
    }


    @GetMapping("/me")
    public Profil getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        return profilService.getProfileByUserEmail(email);
    }

    @PutMapping("/me")
    public Profil updateMyProfile(@RequestBody Profil profil, Authentication authentication) {
        String email = authentication.getName();
        return profilService.updateMyProfile(email, profil);
    }

    @PostMapping(value = "/me/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Profil uploadMyProfileImage(@RequestParam("file") MultipartFile file,
                                       Authentication authentication) {
        String email = authentication.getName();
        return profilService.uploadMyProfileImage(email, file);
    }

    @PutMapping("/me/photo-url")
    public Profil updatePhotoUrl(@RequestBody String photoUrl, Authentication authentication) {
        String email = authentication.getName();
        return profilService.updatePhotoUrl(email, photoUrl);
    }


}