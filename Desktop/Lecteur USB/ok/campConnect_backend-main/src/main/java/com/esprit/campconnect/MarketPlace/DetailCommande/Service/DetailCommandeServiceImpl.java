package com.esprit.campconnect.MarketPlace.DetailCommande.Service;

import com.esprit.campconnect.MarketPlace.DetailCommande.Entity.DetailCommande;
import com.esprit.campconnect.MarketPlace.DetailCommande.Repository.DetailCommandeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetailCommandeServiceImpl implements DetailCommandeService {

    private final DetailCommandeRepository detailCommandeRepository;

    public DetailCommandeServiceImpl(DetailCommandeRepository detailCommandeRepository) {
        this.detailCommandeRepository = detailCommandeRepository;
    }

    @Override
    public DetailCommande ajouterDetailCommande(DetailCommande detailCommande) {
        detailCommande.setTotal(detailCommande.getQuantite() * detailCommande.getPrixUnitaire());
        return detailCommandeRepository.save(detailCommande);
    }

    @Override
    public List<DetailCommande> getAllDetailsCommande() {
        return detailCommandeRepository.findAll();
    }

    @Override
    public DetailCommande getDetailCommandeById(Long id) {
        return detailCommandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("DetailCommande non trouvé avec id : " + id));
    }

    @Override
    public DetailCommande updateDetailCommande(Long id, DetailCommande detailCommande) {
        DetailCommande existingDetail = getDetailCommandeById(id);

        existingDetail.setQuantite(detailCommande.getQuantite());
        existingDetail.setPrixUnitaire(detailCommande.getPrixUnitaire());
        existingDetail.setTotal(detailCommande.getQuantite() * detailCommande.getPrixUnitaire());
        existingDetail.setCommande(detailCommande.getCommande());
        existingDetail.setProduit(detailCommande.getProduit());
        existingDetail.setPointure(detailCommande.getPointure());
        existingDetail.setTaille(detailCommande.getTaille());

        return detailCommandeRepository.save(existingDetail);
    }

    @Override
    public void deleteDetailCommande(Long id) {
        DetailCommande detailCommande = getDetailCommandeById(id);
        detailCommandeRepository.delete(detailCommande);
    }

    @Override
    public List<DetailCommande> getDetailsByCommande(Long idCommande) {
        return detailCommandeRepository.findByCommandeIdCommande(idCommande);
    }
}