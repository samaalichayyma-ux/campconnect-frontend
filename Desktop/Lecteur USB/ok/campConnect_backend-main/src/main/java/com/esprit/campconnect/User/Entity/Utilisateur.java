package com.esprit.campconnect.User.Entity;

import com.esprit.campconnect.Assurance.Entity.SouscriptionAssurance;
import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;
import com.esprit.campconnect.SiteCampingAvis.entity.SiteCampingAvis;
import com.esprit.campconnect.siteCamping.entity.SiteCamping;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "profil")
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Utilisateur implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String nom;

    @Column(unique = true, nullable = false)
    String email;


    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String motDePasse;
    String telephone;




    @Column(updatable = false)
    LocalDate dateCreation;

    @Enumerated(EnumType.STRING)
    Role role;

    boolean twoFactorEnabled;
    boolean twoFactorVerified;
    String twoFactorSecret;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "profil_id")
    Profil profil;

    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    List<SouscriptionAssurance> souscriptionsAssurance;


    @OneToMany(mappedBy = "utilisateur")
    @JsonIgnore
    Set<InscriptionSite> inscriptionsSite = new HashSet<>();

    @OneToMany(mappedBy = "utilisateur")
    @JsonIgnore
    Set<SiteCampingAvis> avisSiteCamping = new HashSet<>();

    @OneToMany(mappedBy = "owner")
    @JsonIgnore
    Set<SiteCamping> managedSites = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDate.now();
    }

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    @JsonIgnore
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

}
