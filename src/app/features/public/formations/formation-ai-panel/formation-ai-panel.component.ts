import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import {
  AnalyzeFormationRequestDto,
  AnalyzeFormationResponseDto,
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationQuizItemDto
} from '../models/ai-response.model';
import { FormationAiService } from '../services/formation-ai.service';

@Component({
  selector: 'app-formation-ai-panel',
  standalone: true,
  imports: [CommonModule, AdminIconComponent],
  templateUrl: './formation-ai-panel.component.html',
  styleUrl: './formation-ai-panel.component.css'
})
export class FormationAiPanelComponent {
  @Input() formationId: number | null = null;
  @Input() draft: AnalyzeFormationRequestDto = {
    title: '',
    description: '',
    content: '',
    objectives: [],
    summary: '',
    quiz: []
  };
  @Input() connectedUserRole = 'CLIENT';
  @Input() levelHint = 'BEGINNER';

  @Output() generationApplied = new EventEmitter<FormationGenerateResponseDto>();
  @Output() qualityAnalyzed = new EventEmitter<AnalyzeFormationResponseDto>();
  @Output() quizGenerated = new EventEmitter<FormationQuizItemDto[]>();
  @Output() actionTriggered = new EventEmitter<string>();

  aiSubject = '';
  isGenerating = false;
  isAnalyzing = false;
  isGeneratingQuiz = false;
  isImproving = false;

  constructor(private aiService: FormationAiService) {}

  generateWithAi(): void {
    const subject = this.aiSubject.trim() || this.draft.title.trim();
    if (!subject) {
      return;
    }

    const payload: FormationGenerateRequestDto = {
      subject,
      level: this.levelHint,
      targetUser: this.connectedUserRole
    };

    this.isGenerating = true;

    this.aiService.generateFormationWithFallback(payload).subscribe({
      next: (response) => {
        this.isGenerating = false;
        this.generationApplied.emit(response);
        this.actionTriggered.emit('ai-generated');
      },
      error: () => {
        this.isGenerating = false;
      }
    });
  }

  analyzeQuality(): void {
    if (!this.draft.title.trim() || !this.draft.description.trim()) {
      return;
    }

    this.isAnalyzing = true;

    this.aiService.analyzeFormationWithFallback(this.draft).subscribe({
      next: (result) => {
        this.isAnalyzing = false;
        this.qualityAnalyzed.emit(result);
        this.actionTriggered.emit('quality-analyzed');
      },
      error: () => {
        this.isAnalyzing = false;
      }
    });
  }

  generateQuiz(): void {
    if (this.formationId) {
      this.isGeneratingQuiz = true;

      this.aiService.generateQuiz(this.formationId).subscribe({
        next: (quiz) => {
          this.isGeneratingQuiz = false;
          const fallbackSubject = this.aiSubject.trim() || this.draft.title.trim() || 'la formation';
          const safeQuiz = quiz.length > 0 ? quiz : this.aiService.buildFallbackQuiz(fallbackSubject);
          this.quizGenerated.emit(safeQuiz);
          this.actionTriggered.emit('quiz-generated');
        },
        error: () => {
          this.isGeneratingQuiz = false;
          const fallbackSubject = this.aiSubject.trim() || this.draft.title.trim() || 'la formation';
          this.quizGenerated.emit(this.aiService.buildFallbackQuiz(fallbackSubject));
          this.actionTriggered.emit('quiz-generated');
        }
      });
      return;
    }

    const fallbackSubject = this.aiSubject.trim() || this.draft.title.trim() || 'la formation';
    this.quizGenerated.emit(this.aiService.buildFallbackQuiz(fallbackSubject));
    this.actionTriggered.emit('quiz-generated');
  }

  improveContent(): void {
    const hasMinimumDraft =
      this.draft.title.trim().length > 0
      || this.draft.description.trim().length > 0
      || this.draft.content.trim().length > 0;

    if (!hasMinimumDraft) {
      return;
    }

    this.isImproving = true;

    this.aiService.improveDraftContent(this.draft, this.levelHint, this.connectedUserRole).subscribe({
      next: (response) => {
        this.isImproving = false;
        this.generationApplied.emit(response);
        this.actionTriggered.emit('ai-improved');
      },
      error: () => {
        this.isImproving = false;
      }
    });
  }
}
