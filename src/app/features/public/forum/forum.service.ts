import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Forum {
  id?: number;
  nom: string;
  description: string;
  dateCreation?: string;
  createdBy?: 'USER' | 'ADMIN';
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private forums: Forum[] = [
    {
      id: 1,
      nom: 'Camping en montagne',
      description: 'Partagez vos conseils et expériences en montagne.',
      dateCreation: new Date().toISOString(),
      createdBy: 'USER'
    },
    {
      id: 2,
      nom: 'Matériel de camping',
      description: 'Tentes, sacs, accessoires et recommandations.',
      dateCreation: new Date().toISOString(),
      createdBy: 'USER'
    }
  ];

  getAll(): Observable<Forum[]> {
    return of(this.forums);
  }

  getById(id: number): Observable<Forum | undefined> {
    return of(this.forums.find(f => f.id === id));
  }

  create(forum: Forum): Observable<Forum> {
    const newForum: Forum = {
      ...forum,
      id: this.forums.length ? Math.max(...this.forums.map(f => f.id || 0)) + 1 : 1,
      dateCreation: new Date().toISOString(),
      createdBy: 'USER'
    };

    this.forums.push(newForum);
    return of(newForum);
  }

  update(id: number, forum: Forum): Observable<Forum | undefined> {
    const index = this.forums.findIndex(f => f.id === id);
    if (index !== -1) {
      this.forums[index] = {
        ...this.forums[index],
        ...forum,
        id
      };
      return of(this.forums[index]);
    }
    return of(undefined);
  }

  delete(id: number): Observable<boolean> {
    this.forums = this.forums.filter(f => f.id !== id);
    return of(true);
  }
}