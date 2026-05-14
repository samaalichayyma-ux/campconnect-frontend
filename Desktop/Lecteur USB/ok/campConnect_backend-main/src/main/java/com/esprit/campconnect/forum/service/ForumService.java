package com.esprit.campconnect.forum.service;

import com.esprit.campconnect.forum.entity.Forum;
import java.util.List;

public interface ForumService {

    List<Forum> getAll();

    Forum getById(Long id);

    Forum create(Forum forum);

    Forum update(Long id, Forum forum);

    void delete(Long id);

    List<Forum> search(String nom);
}