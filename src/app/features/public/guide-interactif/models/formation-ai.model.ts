export interface FormationGenerateRequestDto {
  subject: string;
  level: string;
  targetUser: string;
}

export interface FormationSectionDto {
  title: string;
  content: string;
}

export interface FormationQuizItemDto {
  question: string;
  choices: string[];
  correctAnswer: string;
}

export interface FormationGenerateResponseDto {
  title: string;
  description: string;
  objectives: string[];
  sections: FormationSectionDto[];
  summary: string;
  quiz: FormationQuizItemDto[];
  level: string;
  estimatedDuration: string;
}

export interface AnalyzeFormationRequestDto {
  title: string;
  description: string;
  content: string;
  objectives: string[];
  summary: string;
  quiz: FormationQuizItemDto[];
}

export interface AnalyzeFormationResponseDto {
  score: number;
  issues: string[];
  suggestions: string[];
}
