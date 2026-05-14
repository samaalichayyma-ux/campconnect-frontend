package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.Sinistre;

import java.util.List;

public interface ISinistreService {

    List<Sinistre> retrieveAll();
    Sinistre retrieveById(Long id);
    List<Sinistre> retrieveBySouscription(Long souscriptionId);
    Sinistre add(Long souscriptionId, Sinistre sinistre);
    Sinistre update(Sinistre sinistre);
    void remove(Long id);
}
