export type FormationMediaType = 'IMAGE' | 'VIDEO';

export interface FormationMediaResponseDto {
  id: number;
  formationId: number;
  mediaUrl: string;
  mediaType: FormationMediaType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  displayOrder: number;
  uploadDate: string;
}
