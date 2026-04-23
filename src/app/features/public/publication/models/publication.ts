export interface Publication {
  id?: number;
  forumId?: number;
  forum?: {
    id?: number;
    nom?: string;
  };
  titre?: string;
  contenu: string;
  auteurEmail?: string;
  likesCount?: number;
  commentairesCount?: number;
  vuesCount?: number;
  dateCreation?: string;
}
