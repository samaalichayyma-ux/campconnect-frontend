
package com.esprit.campconnect.forum.controller;

import com.esprit.campconnect.forum.entity.Forum;
import com.esprit.campconnect.forum.service.ForumService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/forums")
@CrossOrigin(origins = {"http://localhost:4200"})
public class AdminForumController {

    private final ForumService forumService;

    public AdminForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping
    public List<Forum> getAll() {
        return forumService.getAll();
    }

    @GetMapping("/{id}")
    public Forum getById(@PathVariable Long id) {
        return forumService.getById(id);
    }

    @PostMapping
    public Forum create(@RequestBody Forum forum) {
        return forumService.create(forum);
    }

    @PutMapping("/{id}")
    public Forum update(@PathVariable Long id, @RequestBody Forum forum) {
        return forumService.update(id, forum);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        forumService.delete(id);
    }
}
