package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;
import com.esprit.campconnect.Assurance.Entity.StatutSouscription;
import com.esprit.campconnect.Assurance.Repository.SouscriptionAssuranceRepository;
import com.esprit.campconnect.Mail.Service.IMailService;
import com.esprit.campconnect.Notification.Entity.NotificationType;
import com.esprit.campconnect.Notification.Service.INotificationUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssuranceExpirationScheduler {

    private final SouscriptionAssuranceRepository souscriptionRepository;
    private final INotificationUserService notificationUserService;
    private final IMailService mailService;

    @Scheduled(cron = "0 0 9 * * *")
    public void notifierAssurancesQuiExpirent() {
        LocalDate targetDate = LocalDate.now().plusDays(3);

        List<SouscriptionAssurance> souscriptions =
                souscriptionRepository.findByStatutAndDateFin(StatutSouscription.ACTIVE, targetDate);

        for (SouscriptionAssurance souscription : souscriptions) {
            if (souscription.getUtilisateur() == null) continue;

            String titre = "Assurance bientôt expirée";
            String message = "Votre assurance expire dans 3 jours. Contrat : "
                    + souscription.getNumeroContrat();

            notificationUserService.createNotification(
                    souscription.getUtilisateur(),
                    titre,
                    message,
                    NotificationType.ASSURANCE_EXPIRATION
            );

            try {
                mailService.sendMail(
                        souscription.getUtilisateur().getEmail(),
                        "Votre assurance expire bientôt - CampConnect",
                        "Bonjour " + souscription.getUtilisateur().getNom() + ",\n\n"
                                + message + "\n\n"
                                + "Cordialement,\nCampConnect"
                );
            } catch (Exception e) {
                System.out.println("Erreur mail expiration assurance : " + e.getMessage());
            }
        }
    }
}