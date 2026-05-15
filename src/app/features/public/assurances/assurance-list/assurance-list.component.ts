import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

import { AssuranceService } from '../../../../core/services/assurance.service';
import { Assurance, TYPE_ASSURANCE_LABELS } from '../../../../core/models/assurance.models';
import { EventService } from '../../events/services/event.service';
import { CampingService } from '../../services/camping.service';

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-assurance-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './assurance-list.component.html',
  styleUrls: ['./assurance-list.component.scss']
})
export class AssuranceListComponent implements OnInit {
  assurances: Assurance[] = [];
  filteredAssurances: Assurance[] = [];

  loading = false;
  errorMessage = '';
  searchTerm = '';
  chatOpen = false;

  hasReservation = false;
  hasInscriptionSite = false;
  canSubscribe = false;

  // Chat IA
  assistantQuestion = '';
  assistantLoading = false;
  assistantError = '';
  assistantMessages: AssistantMessage[] = [];
  assistantSuggestedAssurances: Assurance[] = [];

  readonly typeLabels = TYPE_ASSURANCE_LABELS;

  constructor(
    private assuranceService: AssuranceService,
    private eventService: EventService,
    private campingService: CampingService
  ) {}

  ngOnInit(): void {
    this.loadAssurances();
    this.checkUserEligibility();

    this.assistantMessages = [
      {
        role: 'assistant',
        content:
          'Bonjour, je suis votre assistant assurance CampConnect. Décrivez votre séjour, votre destination, la durée, les risques ou votre budget, et je vous recommande une assurance parmi les offres disponibles.'
      }
    ];
  }

  loadAssurances(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assuranceService.getAllAssurances().subscribe({
      next: (data) => {
        this.assurances = data.filter(item => item.active);
        this.filteredAssurances = [...this.assurances];
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger les assurances.';
        this.loading = false;
      }
    });
  }

  checkUserEligibility(): void {
    forkJoin({
      reservations: this.eventService.getMyReservations().pipe(
        catchError(() => of([]))
      ),
      inscriptions: this.campingService.getMyBookings().pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ reservations, inscriptions }) => {
        this.hasReservation = reservations.length > 0;
        this.hasInscriptionSite = inscriptions.length > 0;
        this.canSubscribe = this.hasReservation || this.hasInscriptionSite;
      },
      error: (error) => {
        console.error(error);
        this.canSubscribe = false;
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = value;

    this.filteredAssurances = this.assurances.filter((assurance) =>
      assurance.titre?.toLowerCase().includes(value) ||
      assurance.description?.toLowerCase().includes(value) ||
      this.typeLabels[assurance.typeAssurance]?.toLowerCase().includes(value)
    );
  }

  poserQuestionAssistant(): void {
    const question = this.assistantQuestion.trim();

    if (!question) {
      this.assistantError = 'Veuillez écrire une question.';
      return;
    }

    if (!this.assurances.length) {
      this.assistantError = 'Aucune assurance disponible pour faire une recommandation.';
      return;
    }

    this.assistantMessages.push({
      role: 'user',
      content: question
    });

    this.assistantQuestion = '';
    this.assistantLoading = true;
    this.assistantError = '';

    const prompt = this.buildAssistantPrompt(question);

    this.assuranceService.askAssistantAssurance(prompt).subscribe({
      next: (response) => {
        this.assistantMessages.push({
          role: 'assistant',
          content: response
        });

        this.assistantSuggestedAssurances = this.findMentionedAssurances(response);
        this.assistantLoading = false;
      },
      error: (error) => {
        console.error('Erreur assistant IA', error);
        this.assistantError = 'Impossible de contacter l’assistant IA.';
        this.assistantLoading = false;
      }
    });
  }

  onAssistantEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.poserQuestionAssistant();
    }
  }

  clearAssistantChat(): void {
    this.assistantMessages = [
      {
        role: 'assistant',
        content:
          'Conversation réinitialisée. Décrivez votre séjour et je vous recommande une assurance parmi les offres disponibles.'
      }
    ];

    this.assistantQuestion = '';
    this.assistantError = '';
    this.assistantSuggestedAssurances = [];
  }

  private buildAssistantPrompt(question: string): string {
    const assurancesText = this.assurances.map((assurance, index) => {
      return `
Assurance ${index + 1}
ID: ${assurance.id}
Titre: ${assurance.titre}
Type: ${this.typeLabels[assurance.typeAssurance] || assurance.typeAssurance}
Description: ${assurance.description}
Prime: ${assurance.prime} TND
Couverture: ${assurance.montantCouverture} TND
Durée: ${assurance.dureeValidite} jours
`;
    }).join('\n');

    const historique = this.assistantMessages
      .slice(-6)
      .map(message => `${message.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${message.content}`)
      .join('\n');

    return `
Tu es un assistant assurance intelligent pour CampConnect.

Ton rôle :
- Comprendre le besoin de l'utilisateur.
- Choisir uniquement parmi les assurances disponibles ci-dessous.
- Ne jamais inventer une assurance qui n'existe pas.
- Recommander une assurance précise avec son titre exact.
- Expliquer brièvement pourquoi cette assurance est adaptée.
- Si aucune assurance ne correspond parfaitement, proposer la plus proche.
- Répondre en français simple.
- Ne donne pas de promesse juridique.

Liste des assurances disponibles :
${assurancesText}

Historique récent de la conversation :
${historique}

Nouvelle question utilisateur :
${question}

Réponse attendue :
1. Assurance recommandée : écrire exactement le titre de l'assurance choisie.
2. Pourquoi ce choix.
3. Prix et couverture.
4. Conseil court.
`;
  }

  private findMentionedAssurances(response: string): Assurance[] {
    const normalizedResponse = this.normalizeText(response);

    return this.assurances.filter((assurance) => {
      const title = this.normalizeText(assurance.titre || '');
      return title.length > 2 && normalizedResponse.includes(title);
    });
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}