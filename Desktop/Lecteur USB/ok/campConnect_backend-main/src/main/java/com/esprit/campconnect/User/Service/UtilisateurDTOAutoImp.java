    package com.esprit.campconnect.User.Service;

    import com.esprit.campconnect.User.DTO.UtilisateurDTO;
    import com.esprit.campconnect.User.Entity.Utilisateur;
    import com.esprit.campconnect.User.Repository.UtilisateurRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;

    import java.util.List;

    @Service
    @RequiredArgsConstructor

    public class UtilisateurDTOAutoImp {
        private final UtilisateurRepository utilisateurRepository;
        private final IUtilisateurDTOAuto iUtilisateurDTOAuto;

        public UtilisateurDTO getUtilisateur(Long id) {
            Utilisateur utilisateur = utilisateurRepository.findById(id).orElse(null);
            return iUtilisateurDTOAuto.DTOtoDTO(utilisateur);
        }

        public List<UtilisateurDTO> getAllUtilisateurs() {
            return utilisateurRepository.findAll()
                    .stream()
                    .map(iUtilisateurDTOAuto::DTOtoDTO)
                    .toList();
        }


    }
