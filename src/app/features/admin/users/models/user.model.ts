export interface AdminProfile {
  adresse: string;
  photo: string;
  biographie: string;
}

export interface AdminUser {
  id?: number;
  nom: string;
  email: string;
  telephone: string;
  motDePasse?: string;
  dateCreation?: string;
  role: string;
  profil?: AdminProfile;
}