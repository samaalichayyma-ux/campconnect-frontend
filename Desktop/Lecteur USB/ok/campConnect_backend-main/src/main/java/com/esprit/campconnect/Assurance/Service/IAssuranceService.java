package com.esprit.campconnect.Assurance.Service;

import com.esprit.campconnect.Assurance.Entity.Assurance;

import java.util.List;

public interface IAssuranceService {
    List<Assurance> retrieveAll();
    Assurance retrieveById(Long id);
    Assurance add(Assurance assurance);
    Assurance update(Assurance assurance);
    void remove(Long id);
}
