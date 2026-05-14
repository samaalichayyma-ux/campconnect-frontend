package com.esprit.campconnect.Publication.entity;

import com.esprit.campconnect.commentaire.entity.Commentaire;
import com.esprit.campconnect.forum.entity.Forum;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String contenu;
    private String auteurEmail;
    private String auteurNom;
    private Integer likesCount = 0;
    private Integer vuesCount = 0;
    private LocalDateTime dateCreation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "forum_id", nullable = false)
    @JsonIgnoreProperties({"publications"})   // 🔥 IMPORTANT
    private Forum forum;

    @JsonIgnore
    @OneToMany(mappedBy = "publication", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Commentaire> commentaires = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.dateCreation == null) this.dateCreation = LocalDateTime.now();
        if (this.likesCount == null) this.likesCount = 0;
        if (this.vuesCount == null) this.vuesCount = 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public String getAuteurEmail() { return auteurEmail; }
    public void setAuteurEmail(String auteurEmail) { this.auteurEmail = auteurEmail; }

    public String getAuteurNom() { return auteurNom; }
    public void setAuteurNom(String auteurNom) { this.auteurNom = auteurNom; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }

    public Integer getVuesCount() { return vuesCount; }
    public void setVuesCount(Integer vuesCount) { this.vuesCount = vuesCount; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public Forum getForum() { return forum; }
    public void setForum(Forum forum) { this.forum = forum; }

    public List<Commentaire> getCommentaires() { return commentaires; }
    public void setCommentaires(List<Commentaire> commentaires) { this.commentaires = commentaires; }
    @Transient
    public Long getForumId() {
        return forum != null ? forum.getId() : null;
    }

    @Transient
    public Integer getCommentairesCount() {
        return commentaires != null ? commentaires.size() : 0;
    }


}