import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import {
  AnalyzeFormationRequestDto,
  AnalyzeFormationResponseDto,
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationMediaHintsDto,
  FormationMediaSuggestionItemDto,
  FormationSectionDto,
  FormationQuizItemDto
} from '../models/ai-response.model';
import { FormationGuideStep } from '../../guide-interactif/models/guide-interactif.model';

@Injectable({
  providedIn: 'root'
})
export class FormationAiService {
  private readonly formationsBaseUrl = 'http://localhost:8082/api/formations';
  private readonly realisticDurationSlots = [15, 30, 45];
  private readonly localImagePools: Record<string, string[]> = {
    tente: [
      '/assets/images/tente.jpeg',
      '/assets/images/tt.jpg',
      '/assets/images/photo-1508873696983-2dfd5898f08b.jpeg'
    ],
    securite: [
      '/assets/images/feu10.jpeg',
      '/assets/images/feu11.jpeg',
      '/assets/images/feu9.jpeg'
    ],
    environnement: [
      '/assets/images/foret.jpeg',
      '/assets/images/foret.jpg',
      '/assets/images/photo-1573111651692-39ec7f38fec9.jpeg'
    ],
    reservation: [
      '/assets/images/default-image.jpg',
      '/assets/images/photo-1523987355523-c7b5b0dd90a7.jpeg',
      '/assets/images/photo-1757346086052-b4940a168c3d.jpeg'
    ],
    materiel: [
      '/assets/images/glaciere.jpg',
      '/assets/images/lampe.jpg',
      '/assets/images/couchage.jpeg'
    ],
    cuisine: [
      '/assets/images/cuisine.jpeg',
      '/assets/images/cuis3.jpg',
      '/assets/images/bbq.jpg'
    ],
    default: [
      '/assets/images/camping-bg.jpg',
      '/assets/images/photo-1627490601633-1b45a55e13b6.jpeg',
      '/assets/images/32.jpg'
    ]
  };
  private readonly localVideoPools: Record<string, string[]> = {
    tente: [
      'https://www.youtube.com/embed/O1Ip249Mv4g',
      'https://www.youtube.com/embed/fR9enc_pkbE'
    ],
    securite: [
      'https://www.youtube.com/embed/JQEcfZ-jBv8'
    ],
    environnement: [
      'https://www.youtube.com/embed/73joX0_pD4I'
    ],
    reservation: [
      'https://www.youtube.com/embed/c-UMk-TGmbo'
    ],
    materiel: [
      'https://www.youtube.com/embed/c-UMk-TGmbo'
    ],
    cuisine: [
      'https://www.youtube.com/embed/YzDqLO-Ch0w'
    ],
    default: [
      'https://www.youtube.com/embed/M7lc1UVf-VE'
    ]
  };

  constructor(private http: HttpClient) {}

  generateFormation(payload: FormationGenerateRequestDto): Observable<FormationGenerateResponseDto> {
    return this.http.post<FormationGenerateResponseDto>(
      `${this.formationsBaseUrl}/generate`,
      payload
    );
  }

  generateFormationWithFallback(payload: FormationGenerateRequestDto): Observable<FormationGenerateResponseDto> {
    const normalizedPayload = this.normalizeGenerationInput(payload);
    const promptReadyPayload: FormationGenerateRequestDto = {
      ...normalizedPayload,
      subject: this.buildPromptedSubject(normalizedPayload.subject, normalizedPayload.level)
    };

    return this.generateFormation(promptReadyPayload).pipe(
      map((response) => this.normalizeGeneratedFormation(response, promptReadyPayload)),
      catchError(() => of(this.buildMockGeneratedFormation(normalizedPayload)))
    );
  }

  analyzeFormation(payload: AnalyzeFormationRequestDto): Observable<AnalyzeFormationResponseDto> {
    return this.http.post<AnalyzeFormationResponseDto>(
      `${this.formationsBaseUrl}/analyze`,
      payload
    );
  }

  analyzeFormationWithFallback(payload: AnalyzeFormationRequestDto): Observable<AnalyzeFormationResponseDto> {
    return this.analyzeFormation(payload).pipe(
      catchError(() => of(this.runLocalQualityAnalysis(payload)))
    );
  }

  generateQuiz(formationId: number): Observable<FormationQuizItemDto[]> {
    return this.http.post<FormationQuizItemDto[] | { quiz?: FormationQuizItemDto[] }>(
      `${this.formationsBaseUrl}/${formationId}/generate-quiz`,
      {}
    ).pipe(
      map((response) => this.extractQuiz(response))
    );
  }

  suggestTitles(query: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.formationsBaseUrl}/suggestions`, {
      params: { q: query }
    });
  }

  improveDraftContent(
    draft: AnalyzeFormationRequestDto,
    levelHint = 'BEGINNER',
    targetUser = 'CLIENT'
  ): Observable<FormationGenerateResponseDto> {
    const subject = this.normalizeSubject(
      this.safeText(draft.title)
      || this.extractSubjectFromDescription(this.safeText(draft.description))
      || 'Choisir un camping adapte'
    );
    const level = this.normalizeLevel(levelHint);
    const base = this.buildMockGeneratedFormation({
      subject,
      level,
      targetUser
    });

    const improved = this.buildImprovedFormationFromDraft(draft, base, subject, level);
    return of(improved);
  }

  suggestMediaHints(topic: string): FormationMediaHintsDto {
    const subject = this.normalizeSubject(topic || 'introduction au camping');
    const imageQueries = this.buildImageSuggestionQueries(subject);
    const videoQueries = this.buildVideoSuggestionQueries(subject);

    return {
      images: imageQueries.slice(0, 3).map((query, index) => this.toImageSuggestion(subject, query, index)),
      videos: videoQueries.slice(0, 3).map((query, index) => this.toVideoSuggestion(subject, query, index))
    };
  }

  getPrimaryVideoSuggestion(topic: string): string {
    const subject = this.normalizeSubject(topic || 'introduction au camping');
    return this.buildLocalVideoUrl(subject, 0);
  }

  suggestRealisticDuration(params: {
    level: string;
    description: string;
    objectives: string[];
    sections: Array<{ title: string; content: string }>;
    summary: string;
    quiz: FormationQuizItemDto[];
    currentDuration?: string;
  }): string {
    const normalizedLevel = this.normalizeLevel(this.safeText(params.level));
    const description = this.safeText(params.description);
    const summary = this.safeText(params.summary);
    const objectives = Array.isArray(params.objectives)
      ? params.objectives.map((item) => this.safeText(item)).filter((item) => item.length > 0)
      : [];
    const sections = Array.isArray(params.sections)
      ? params.sections.map((section) => ({
        title: this.safeText(section?.title),
        content: this.safeText(section?.content)
      })).filter((section) => section.title.length > 0 || section.content.length > 0)
      : [];
    const quiz = Array.isArray(params.quiz) ? params.quiz : [];
    const currentDuration = this.safeText(params.currentDuration || '');

    const currentMinutes = this.extractDurationMinutes(currentDuration);
    if (currentMinutes !== null) {
      return `${this.toClosestDurationSlot(currentMinutes)} minutes`;
    }

    return this.estimateDurationFromContent(
      normalizedLevel,
      description,
      objectives,
      sections,
      summary,
      quiz
    );
  }

  getGeneratedContentWarning(result: FormationGenerateResponseDto): string {
    const description = this.safeText(result?.description);
    const objectives = Array.isArray(result?.objectives)
      ? result.objectives.map((item) => this.safeText(item)).filter((item) => item.length >= 8)
      : [];
    const sections = Array.isArray(result?.sections)
      ? result.sections
        .map((section) => ({
          title: this.safeText(section?.title),
          content: this.safeText(section?.content)
        }))
        .filter((section) => section.title.length > 0 || section.content.length > 0)
      : [];

    const detailedSteps = sections.filter((section) => section.content.length >= 45).length;
    const combined = [
      this.safeText(result?.title),
      description,
      this.safeText(result?.summary),
      ...objectives,
      ...sections.map((section) => `${section.title} ${section.content}`)
    ].join(' ').toLowerCase();

    const issues: string[] = [];
    if (description.length < 90) {
      issues.push('description trop courte');
    }
    if (objectives.length < 3) {
      issues.push('moins de 3 objectifs concrets');
    }
    if (sections.length < 3) {
      issues.push('pas assez d etapes detaillees');
    }
    if (sections.length > 0 && detailedSteps < Math.min(3, sections.length)) {
      issues.push('etapes trop vagues');
    }
    if (!this.hasPracticalCampingAnchors(combined)) {
      issues.push('contenu peu oriente terrain');
    }
    if (this.hasGenericTone(combined)) {
      issues.push('phrases trop generiques');
    }
    if (this.containsCampConnect(combined)) {
      issues.push('mention non autorisee de CampConnect');
    }

    if (issues.length === 0) {
      return '';
    }

    return `Contenu IA a completer (${issues.join(', ')}).`;
  }

  buildMockGeneratedFormation(payload: FormationGenerateRequestDto): FormationGenerateResponseDto {
    const subjectInput = this.safeText(payload.subject) || 'Introduction au camping';
    const subject = this.normalizeSubject(subjectInput);
    const level = this.normalizeLevel(this.safeText(payload.level));

    if (this.isCampingSelectionSubject(subject)) {
      return this.buildCampingSelectionFormation(subject, level);
    }

    const blueprint = this.buildSubjectBlueprint(subject);
    const title = subject;
    const description = blueprint.description;
    const objectives = blueprint.objectives;
    const sections = blueprint.sections;

    const candidate: FormationGenerateResponseDto = {
      title,
      description,
      objectives,
      sections,
      summary: blueprint.summary,
      quiz: this.buildFallbackQuiz(subject, 'apprenants', blueprint.quizKeywordA, blueprint.quizKeywordB),
      level,
      estimatedDuration: ''
    };

    return this.sanitizeGeneratedPayload(candidate, subject, level);
  }

  private buildSubjectBlueprint(subject: string): {
    description: string;
    objectives: string[];
    sections: Array<{ title: string; content: string }>;
    summary: string;
    quizKeywordA: string;
    quizKeywordB: string;
  } {
    const lower = subject.toLowerCase();

    if (this.isTentTopic(lower)) {
      return {
        description: 'Apprendre a monter une tente de facon simple et fiable: choisir un emplacement adapte, installer la structure et verifier la stabilite avant la nuit.',
        objectives: [
          'Choisir un terrain plat, sec et sans risque pour installer la tente.',
          'Preparer correctement le materiel: toile, arceaux, piquets, maillet et haubans.',
          'Monter la tente dans le bon ordre puis ajuster la tension des points d ancrage.',
          'Verifier la stabilite finale pour resister au vent et a une pluie legere.'
        ],
        sections: [
          {
            title: 'Choisir le bon emplacement',
            content: 'Reperez une zone plate, drainee et eloignee des passages d eau. Nettoyez le sol des pierres et racines avant de deplier la toile.'
          },
          {
            title: 'Preparer le materiel',
            content: 'Triez les pieces utiles: arceaux, piquets, haubans et maillet. Verifiez qu il ne manque aucun element avant de commencer.'
          },
          {
            title: 'Monter la tente et fixer les points',
            content: 'Inserez les arceaux, redressez la structure, puis fixez chaque coin avec les piquets. Tendez progressivement les haubans.'
          },
          {
            title: 'Controle de stabilite',
            content: 'Faites le tour de la tente: toile tendue, piquets bien ancres et entrees fonctionnelles. Corrigez les points faibles avant validation.'
          }
        ],
        summary: 'Cette formation donne une methode claire pour monter une tente rapidement, en gardant la securite et la stabilite comme priorites.',
        quizKeywordA: 'ancrage',
        quizKeywordB: 'stabilite'
      };
    }

    if (this.isSafetyTopic(lower)) {
      return {
        description: 'Apprendre les reflexes de securite indispensables en camping pour prevenir les incidents et reagir correctement en cas de risque.',
        objectives: [
          'Identifier les dangers courants: feu, intoxication, coupure et meteo defavorable.',
          'Mettre en place une zone de campement sure avec des regles simples.',
          'Appliquer les bons gestes en cas d urgence avant l arrivee des secours.',
          'Utiliser une checklist de prevention avant, pendant et apres chaque activite.'
        ],
        sections: [
          {
            title: 'Reperez les risques avant installation',
            content: 'Analysez la zone: branches fragiles, pente, proximite du feu et circulation. Eloignez les enfants des zones sensibles.'
          },
          {
            title: 'Securiser le campement',
            content: 'Organisez les espaces: cuisson, repos et stockage. Gardez une distance de securite entre la flamme, la tente et les combustibles.'
          },
          {
            title: 'Reagir en cas d incident',
            content: 'Preparez une trousse, memorisez les numeros utiles et appliquez les gestes essentiels: alerter, proteger, assister.'
          },
          {
            title: 'Controle final quotidien',
            content: 'Avant de dormir, verifiez le feu, l eclairage, l acces a l eau et l etat du materiel critique.'
          }
        ],
        summary: 'La securite en camping repose sur trois reflexes: prevenir les risques, organiser le campement et verifier chaque jour.',
        quizKeywordA: 'prevention',
        quizKeywordB: 'urgence'
      };
    }

    if (this.isEnvironmentTopic(lower)) {
      return {
        description: 'Apprendre a pratiquer le camping en foret en respectant l environnement: limiter l impact, gerer les dechets et proteger le site.',
        objectives: [
          'Choisir un emplacement autorise sans degrader la vegetation.',
          'Organiser la gestion des dechets et du tri pendant le sejour.',
          'Appliquer des gestes simples pour economiser l eau et l energie.',
          'Quitter le site propre avec une verification finale complete.'
        ],
        sections: [
          {
            title: 'Installer le campement sans impact',
            content: 'Utilisez les zones deja prevues, evitez les racines et ne coupez pas la vegetation. Respectez les sentiers et les regles locales.'
          },
          {
            title: 'Gerer les dechets et le tri',
            content: 'Separez recyclable et non recyclable dans des sacs fermes. Ne laissez aucun residu alimentaire sur place.'
          },
          {
            title: 'Limiter consommation et nuisances',
            content: 'Optimisez l usage de l eau, reduisez l eclairage inutile et gardez un niveau sonore raisonnable pour proteger la faune.'
          },
          {
            title: 'Verification avant depart',
            content: 'Faites un dernier passage de controle: aucun dechet, aucune braise active, aucun equipement oublie.'
          }
        ],
        summary: 'Cette formation montre comment camper en foret de facon responsable, pratique et respectueuse du milieu naturel.',
        quizKeywordA: 'dechets',
        quizKeywordB: 'impact environnemental'
      };
    }

    if (this.isEquipmentTopic(lower)) {
      return {
        description: 'Apprendre a choisir et organiser le materiel de camping pour eviter les oublis et rester operationnel sur le terrain.',
        objectives: [
          'Distinguer le materiel indispensable du materiel optionnel selon le sejour.',
          'Construire une checklist claire avant le depart.',
          'Ranger le materiel par usage pour gagner du temps a l installation.',
          'Verifier l etat des equipements critiques avant utilisation.'
        ],
        sections: [
          {
            title: 'Lister les besoins du sejour',
            content: 'Definissez la duree, la meteo et le type de terrain. Adaptez la liste en fonction du confort et de la securite attendus.'
          },
          {
            title: 'Preparer la checklist',
            content: 'Classez le materiel en categories: couchage, cuisine, eclairage, hygiene et securite. Cochez chaque element avant depart.'
          },
          {
            title: 'Organiser le rangement',
            content: 'Placez les objets frequents en acces rapide et protegez le fragile. Evitez les sacs trop lourds et mal equilibres.'
          },
          {
            title: 'Controle avant utilisation',
            content: 'Testez lampe, rechaud et batterie. Verifiez fermetures, etancheite et integrite des equipements critiques.'
          }
        ],
        summary: 'Une bonne preparation du materiel reduit le stress, limite les oublis et rend le sejour plus sur et plus fluide.',
        quizKeywordA: 'checklist',
        quizKeywordB: 'organisation'
      };
    }

    if (this.isCookingTopic(lower)) {
      return {
        description: 'Apprendre a cuisiner en camping avec une methode simple: hygiene, organisation des ingredients et cuisson en securite.',
        objectives: [
          'Organiser un poste de cuisson propre et securise.',
          'Conserver les aliments a la bonne temperature pendant le sejour.',
          'Reussir des cuissons simples avec peu de materiel.',
          'Nettoyer et ranger la zone de cuisine pour eviter les risques.'
        ],
        sections: [
          {
            title: 'Installer la zone cuisine',
            content: 'Choisissez un espace stable, ventile et loin de la tente. Gardez eau, trousse et extincteur de proximite.'
          },
          {
            title: 'Preparer les ingredients',
            content: 'Organisez les portions, respectez la chaine du froid et separez cru/cuit pour limiter la contamination.'
          },
          {
            title: 'Cuisson pratique',
            content: 'Utilisez des recettes courtes, surveillez la flamme et adaptez la cuisson au vent et a la chaleur du rechaud.'
          },
          {
            title: 'Hygiene et fermeture du poste',
            content: 'Nettoyez ustensiles et surfaces, stockez les restes correctement et verifiez qu aucune source chaude n est active.'
          }
        ],
        summary: 'Cette formation permet de cuisiner en camping de maniere sure, propre et efficace, meme avec un equipement limite.',
        quizKeywordA: 'hygiene',
        quizKeywordB: 'chaine du froid'
      };
    }

    if (this.isReservationTopic(lower)) {
      return {
        description: 'Apprendre a reserver un camping avec une methode fiable: comparer les options, verifier les services et confirmer un choix adapte au sejour.',
        objectives: [
          'Comparer plusieurs campings avec des criteres clairs et mesurables.',
          'Verifier les conditions reelles: services, regles, accessibilite et securite.',
          'Analyser les avis recents pour reduire les mauvaises surprises.',
          'Valider une decision finale avec une checklist courte.'
        ],
        sections: [
          {
            title: 'Definir le besoin du sejour',
            content: 'Precisez budget, distance, confort et type d emplacement souhaite. Fixez des priorites avant la recherche.'
          },
          {
            title: 'Comparer les options',
            content: 'Etablissez un tableau simple: prix, services inclus, regles du site, annulation et acces.'
          },
          {
            title: 'Verifier les informations',
            content: 'Controlez photos recentes, disponibilite et details utiles directement aupres du site ou des canaux fiables.'
          },
          {
            title: 'Finaliser la reservation',
            content: 'Validez la meilleure option avec une checklist: avantages, limites et plan de secours si besoin.'
          }
        ],
        summary: 'La reservation devient plus simple quand on suit une methode claire: definir, comparer, verifier puis valider.',
        quizKeywordA: 'comparaison',
        quizKeywordB: 'verification des services'
      };
    }

    return {
      description: `Apprendre ${subject.toLowerCase()} avec une methode pratique orientee terrain: preparation, execution, controle et validation finale.`,
      objectives: [
        `Preparer correctement le contexte avant de commencer ${subject.toLowerCase()}.`,
        `Realiser ${subject.toLowerCase()} en etapes simples et logiques.`,
        'Controler la securite et la qualite apres chaque action importante.',
        'Valider le resultat avec une checklist exploitable sur le terrain.'
      ],
      sections: [
        {
          title: 'Preparation',
          content: `Verifier meteo, terrain et materiel avant de lancer ${subject.toLowerCase()}.`
        },
        {
          title: 'Mise en pratique',
          content: `Executer ${subject.toLowerCase()} pas a pas, sans sauter les controles intermediaires.`
        },
        {
          title: 'Controle securite',
          content: 'Verifier stabilite, securite et qualite du resultat, puis corriger les points faibles.'
        },
        {
          title: 'Validation finale',
          content: 'Completer la checklist finale et confirmer que la solution est fiable en conditions reelles.'
        }
      ],
      summary: `Cette formation rend ${subject.toLowerCase()} plus clair grace a une progression courte, concrete et orientee terrain.`,
      quizKeywordA: 'checklist',
      quizKeywordB: 'controle terrain'
    };
  }

  runLocalQualityAnalysis(payload: AnalyzeFormationRequestDto): AnalyzeFormationResponseDto {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];
    const allText = `${payload.title} ${payload.description} ${payload.content} ${payload.summary}`.toLowerCase();

    if (payload.title.trim().length < 8) {
      score -= 12;
      issues.push('Titre trop court');
      suggestions.push('Ajoutez un titre plus precis.');
    }
    if (payload.description.trim().length < 80) {
      score -= 20;
      issues.push('Description trop courte');
      suggestions.push('Ajoutez le contexte, le public cible et la valeur pedagogique.');
    }
    if (payload.content.trim().length < 180) {
      score -= 22;
      issues.push('Contenu trop court');
      suggestions.push('Detaillez les sections avec des cas pratiques.');
    }
    if (payload.objectives.length < 2) {
      score -= 16;
      issues.push('Objectifs incomplets');
      suggestions.push('Ajoutez au moins deux objectifs mesurables.');
    }
    if (payload.quiz.length < 3) {
      score -= 18;
      issues.push('Quiz incomplet');
      suggestions.push('Ajoutez au moins trois questions.');
    }
    if (this.containsCampConnect(allText)) {
      score -= 20;
      issues.push('Le contenu mentionne CampConnect');
      suggestions.push('Supprimez toute mention de CampConnect et gardez un focus terrain.');
    }
    if (this.hasGenericTone(allText)) {
      score -= 15;
      issues.push('Contenu trop generique');
      suggestions.push('Ajoutez des actions concretes: verifier, installer, fixer, controler.');
    }
    if (!this.hasPracticalCampingAnchors(allText)) {
      score -= 15;
      issues.push('Contenu peu oriente terrain');
      suggestions.push('Ajoutez des details reels: meteo, sol, materiel, securite, checklist.');
    }
    if (this.hasOverRepeatedWords(allText)) {
      score -= 12;
      issues.push('Contenu repetitif');
      suggestions.push('Variez les formulations et gardez des phrases courtes.');
    }
    if (this.hasOverTechnicalTone(allText)) {
      score -= 10;
      issues.push('Contenu trop technique');
      suggestions.push('Utilisez des mots simples et des actions concretes.');
    }

    if (issues.length === 0) {
      suggestions.push('Formation coherente, publication possible.');
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      issues,
      suggestions
    };
  }

  buildFallbackQuiz(
    subject: string,
    audienceLabel = 'participants',
    keywordA = 'processus',
    keywordB = 'qualite'
  ): FormationQuizItemDto[] {
    const cleanSubject = this.normalizeSubject(subject || 'la formation');
    return [
      {
        question: `Quel est l objectif principal de ${cleanSubject} ?`,
        choices: [
          `Realiser ${cleanSubject.toLowerCase()} de facon sure et efficace sur le terrain`,
          'Aller vite sans controle de securite',
          'Ignorer l etat du sol et du materiel'
        ],
        correctAnswer: `Realiser ${cleanSubject.toLowerCase()} de facon sure et efficace sur le terrain`
      },
      {
        question: `Quelle verification est obligatoire avant de terminer ${cleanSubject.toLowerCase()} ?`,
        choices: [
          'Verifier stabilite, fixation et zone de securite',
          'Supposer que tout va bien sans verifier',
          'Sauter la checklist finale'
        ],
        correctAnswer: 'Verifier stabilite, fixation et zone de securite'
      },
      {
        question: `Quel choix aide ${audienceLabel} a progresser en conditions reelles ?`,
        choices: [
          'Suivre des etapes simples, tester et corriger',
          'Memoriser uniquement la theorie',
          `Ignorer ${keywordA} et ${keywordB}`
        ],
        correctAnswer: 'Suivre des etapes simples, tester et corriger'
      }
    ];
  }

  generateGuideStepsFromFormation(params: {
    formationId: number;
    title: string;
    description: string;
    objectives: string[];
    sections: FormationSectionDto[];
    mainImageUrl?: string;
  }): FormationGuideStep[] {
    const subject = this.normalizeSubject(this.safeText(params.title) || 'Introduction au camping');
    const normalizedDescription = this.safeText(params.description);
    const normalizedObjectives = Array.isArray(params.objectives)
      ? params.objectives.map((item) => this.safeText(item)).filter((item) => item.length > 0)
      : [];
    const normalizedSections = Array.isArray(params.sections)
      ? params.sections
        .map((section, index) => ({
          title: this.safeText(section?.title) || `Etape ${index + 1}`,
          content: this.safeText(section?.content),
          mediaType: (this.safeText(section?.mediaType).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
          mediaUrl: this.safeText(section?.mediaUrl)
        }))
        .filter((section) => section.title.length > 0 || section.content.length > 0)
      : [];

    const mediaHints = this.suggestMediaHints(subject);
    const suggestedImages = mediaHints.images.map((hint) => this.safeText(hint.url)).filter((url) => !!url);
    const suggestedVideos = mediaHints.videos.map((hint) => this.safeText(hint.url)).filter((url) => !!url);
    const mainImage = this.normalizeGuideImageUrl(this.safeText(params.mainImageUrl));

    const stepsSource = normalizedSections.length > 0
      ? normalizedSections.slice(0, 6)
      : this.buildFallbackGuideSections(subject, normalizedObjectives, normalizedDescription);
    const minimalCount = Math.max(3, Math.min(5, stepsSource.length || 4));

    const completedSource = [...stepsSource];
    while (completedSource.length < minimalCount) {
      completedSource.push({
        title: `Etape ${completedSource.length + 1}`,
        content: this.buildFallbackGuideDescription(subject, completedSource.length, normalizedObjectives, normalizedDescription),
        mediaType: 'IMAGE',
        mediaUrl: ''
      });
    }

    const finalStepsSource = completedSource.slice(0, 6);
    const phasePlan = this.buildGuidePhasePlan(subject, finalStepsSource.length);
    const usedTitles = new Set<string>();

    return finalStepsSource.map((sourceStep, index): FormationGuideStep => {
      const order = index + 1;
      const phaseLabel = phasePlan[index] || `Etape ${order}`;
      const objectiveHint = normalizedObjectives[index % Math.max(1, normalizedObjectives.length)] || '';
      const sectionImage = this.normalizeGuideImageUrl(sourceStep.mediaType === 'IMAGE' ? sourceStep.mediaUrl : '');
      const sectionVideo = this.toYoutubeEmbedGuideUrl(sourceStep.mediaType === 'VIDEO' ? sourceStep.mediaUrl : '');

      const fallbackImage = this.normalizeGuideImageUrl(suggestedImages[index % Math.max(1, suggestedImages.length)] || '');
      const fallbackVideo = this.toYoutubeEmbedGuideUrl(suggestedVideos[index % Math.max(1, suggestedVideos.length)] || '');

      const imageUrl = order === 1
        ? sectionImage || mainImage || fallbackImage || mainImage
        : '';
      const videoUrl = sectionVideo
        || fallbackVideo
        || this.toYoutubeEmbedGuideUrl(this.getPrimaryVideoSuggestion(subject))
        || 'https://www.youtube.com/embed/M7lc1UVf-VE';
      const title = this.makeDistinctGuideStepTitle(sourceStep.title, phaseLabel, order, usedTitles);
      const description = this.normalizeGuideStepDescription(
        sourceStep.content,
        subject,
        order,
        phaseLabel,
        objectiveHint
      );

      return {
        id: `guide-step-${params.formationId}-${order}`,
        formationId: params.formationId,
        order,
        title,
        description,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined
      };
    });
  }

  private extractQuiz(value: FormationQuizItemDto[] | { quiz?: FormationQuizItemDto[] }): FormationQuizItemDto[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && Array.isArray(value.quiz)) {
      return value.quiz;
    }

    return [];
  }

  private buildFallbackGuideSections(
    subject: string,
    objectives: string[],
    description: string
  ): Array<{ title: string; content: string; mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string }> {
    const shortObjective = objectives.find((objective) => objective.length >= 20) || '';
    const shortDescription = description.length >= 20 ? description : `Executer ${subject.toLowerCase()} en situation reelle.`;
    const blueprintSections = this.buildSubjectBlueprint(subject).sections.slice(0, 5);

    const mappedSections = blueprintSections.map((section, index) => ({
      title: section.title,
      content: index === 0 && shortObjective ? `${section.content} ${shortObjective}` : section.content,
      mediaType: (index === blueprintSections.length - 1 ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
      mediaUrl: ''
    }));

    if (mappedSections.length === 0) {
      return [
        {
          title: 'Preparation du terrain',
          content: `Verifier le terrain, la meteo et le materiel avant de commencer. ${shortObjective}`.trim(),
          mediaType: 'IMAGE',
          mediaUrl: ''
        },
        {
          title: 'Execution pas a pas',
          content: `Appliquer ${subject.toLowerCase()} en etapes courtes et claires sans sauter les controles intermediaires.`,
          mediaType: 'IMAGE',
          mediaUrl: ''
        },
        {
          title: 'Controle de securite',
          content: 'Verifier la stabilite, la securite et corriger les points faibles avant validation.',
          mediaType: 'IMAGE',
          mediaUrl: ''
        },
        {
          title: 'Validation finale',
          content: shortDescription,
          mediaType: 'VIDEO',
          mediaUrl: ''
        }
      ];
    }

    mappedSections[mappedSections.length - 1] = {
      ...mappedSections[mappedSections.length - 1],
      content: shortDescription,
      mediaType: 'VIDEO'
    };

    return mappedSections;
  }

  private buildFallbackGuideDescription(
    subject: string,
    index: number,
    objectives: string[],
    description: string
  ): string {
    const objective = objectives[index % Math.max(1, objectives.length)] || '';
    const fallback = description || `Mettre en pratique ${subject.toLowerCase()} sur terrain camping.`;
    const joined = `${objective} ${fallback}`.trim();
    return this.normalizeGuideStepDescription(joined, subject, index + 1);
  }

  private normalizeGuideStepTitle(rawTitle: string, order: number): string {
    const cleaned = this.safeText(rawTitle)
      .replace(/^section\s*\d+\s*[-:.]\s*/i, '')
      .replace(/^etape\s*\d+\s*[-:.]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || `Etape ${order}`;
  }

  private normalizeGuideStepDescription(
    rawDescription: string,
    subject: string,
    order: number,
    phaseLabel = '',
    objectiveHint = ''
  ): string {
    const cleaned = this.safeText(rawDescription).replace(/\s+/g, ' ').trim();
    const action = cleaned.length >= 20
      ? cleaned
      : this.buildGuideDefaultAction(subject, phaseLabel, order);
    const objective = this.safeText(objectiveHint);
    const purpose = objective.length >= 18
      ? objective
      : this.buildGuidePurposeHint(subject, phaseLabel, order);
    const verification = this.buildGuideVerificationHint(subject, order);

    const normalizedAction = action.replace(/[.;,\s]+$/, '').trim();
    const normalizedPurpose = purpose.replace(/[.;,\s]+$/, '').trim();
    const normalizedVerification = verification.replace(/[.;,\s]+$/, '').trim();
    const composed = `${normalizedAction}. Objectif: ${normalizedPurpose}. Verification: ${normalizedVerification}.`;

    return composed.length > 320 ? `${composed.slice(0, 317).trim()}...` : composed;
  }

  private buildGuidePhasePlan(subject: string, total: number): string[] {
    const lower = this.normalizeSubject(subject).toLowerCase();
    const blueprintPhases = this.buildSubjectBlueprint(subject).sections
      .map((section, index) => this.normalizeGuideStepTitle(section.title, index + 1))
      .filter((title) => title.length > 0);

    let topicPhases: string[];
    if (this.isTentTopic(lower)) {
      topicPhases = [
        'Preparation du terrain',
        'Preparation du materiel',
        'Montage de la structure',
        'Ancrage et tension',
        'Validation de stabilite',
        'Debrief terrain'
      ];
    } else if (this.isSafetyTopic(lower)) {
      topicPhases = [
        'Identification des risques',
        'Mise en place des zones sures',
        'Procedure en cas d incident',
        'Controle des equipements critiques',
        'Validation securite finale',
        'Retour d experience'
      ];
    } else if (this.isEnvironmentTopic(lower)) {
      topicPhases = [
        'Choix du site responsable',
        'Organisation du tri',
        'Gestion de l eau et de l energie',
        'Reduction des nuisances',
        'Verification avant depart',
        'Amelioration continue'
      ];
    } else if (this.isEquipmentTopic(lower)) {
      topicPhases = [
        'Analyse des besoins',
        'Checklist materiel',
        'Organisation des sacs',
        'Test des equipements',
        'Controle avant depart',
        'Bilan de preparation'
      ];
    } else {
      topicPhases = [
        'Preparation',
        'Configuration initiale',
        'Execution principale',
        'Controle intermediaire',
        'Validation finale',
        'Debrief et correction'
      ];
    }

    const uniquePhases: string[] = [];
    const seen = new Set<string>();
    [...blueprintPhases, ...topicPhases].forEach((phase) => {
      const cleaned = this.safeText(phase).replace(/\s+/g, ' ').trim();
      if (!cleaned) {
        return;
      }
      const key = cleaned.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniquePhases.push(cleaned);
      }
    });

    const targetCount = Math.max(3, Math.min(6, total || 4));
    while (uniquePhases.length < targetCount) {
      uniquePhases.push(`Etape ${uniquePhases.length + 1}`);
    }

    return uniquePhases.slice(0, targetCount);
  }

  private makeDistinctGuideStepTitle(rawTitle: string, phaseLabel: string, order: number, usedTitles: Set<string>): string {
    const normalizedRaw = this.normalizeGuideStepTitle(rawTitle, order);
    const cleanedPhase = this.safeText(phaseLabel).replace(/\s+/g, ' ').trim();
    const isGenericRaw = /^etape\s+\d+$/i.test(normalizedRaw);
    const baseTitle = isGenericRaw ? cleanedPhase || normalizedRaw : normalizedRaw;

    let candidate = baseTitle || `Etape ${order}`;
    let suffix = 2;
    let key = candidate.toLowerCase();
    while (usedTitles.has(key)) {
      candidate = `${baseTitle} (${suffix})`;
      key = candidate.toLowerCase();
      suffix += 1;
    }

    usedTitles.add(key);
    return candidate;
  }

  private buildGuideDefaultAction(subject: string, phaseLabel: string, order: number): string {
    const subjectLabel = this.normalizeSubject(subject).toLowerCase();
    const phase = this.safeText(phaseLabel).toLowerCase();
    const actionTemplates = [
      `Definissez le contexte de ${subjectLabel}: contraintes terrain, meteo et roles`,
      `Preparez le materiel utile pour ${subjectLabel} puis testez les points critiques`,
      `Executez ${subjectLabel} en sequence claire sans sauter les controles intermediaires`,
      `Corrigez les ecarts observes pour stabiliser l execution de ${subjectLabel}`,
      `Validez ${subjectLabel} avec une checklist finale et un debrief pratique`
    ];
    const fallback = actionTemplates[(order - 1) % actionTemplates.length];
    if (!phase) {
      return fallback;
    }
    return `${fallback} pendant la phase ${phase}`;
  }

  private buildGuidePurposeHint(subject: string, phaseLabel: string, order: number): string {
    const subjectLabel = this.normalizeSubject(subject).toLowerCase();
    const phase = this.safeText(phaseLabel).toLowerCase();
    if (phase.includes('preparation') || order === 1) {
      return `reduire les erreurs de depart et clarifier les priorites sur ${subjectLabel}`;
    }
    if (phase.includes('controle') || phase.includes('validation')) {
      return `garantir un resultat fiable et securise avant de passer a l etape suivante`;
    }
    return `progresser sur ${subjectLabel} avec une methode claire, pratique et reproductible`;
  }

  private buildGuideVerificationHint(subject: string, order: number): string {
    const lower = this.normalizeSubject(subject).toLowerCase();

    let checkpoints: string[];
    if (this.isTentTopic(lower)) {
      checkpoints = [
        'terrain plat, propre et sans risque immediat',
        'materiel complet: toile, arceaux, piquets et haubans disponibles',
        'structure montee sans torsion et points d appui alignes',
        'ancrage stable avec tension homogene des haubans',
        'checklist finale validee: entree, aeration et stabilite globale'
      ];
    } else if (this.isSafetyTopic(lower)) {
      checkpoints = [
        'risques principaux identifies et zones sensibles balisees',
        'distance de securite respectee entre feu, tente et stockage',
        'trousse de secours accessible et procedure urgence connue',
        'materiel critique controle: lampe, eau, communication',
        'verification finale effectuee avant cloture de l activite'
      ];
    } else if (this.isEnvironmentTopic(lower)) {
      checkpoints = [
        'emplacement autorise et vegetation preservee',
        'tri en place avec separation claire des dechets',
        'consommation d eau et energie suivie et reduite',
        'aucune nuisance excessive pour la faune ou le voisinage',
        'site laisse propre sans residu ni braise active'
      ];
    } else if (this.isEquipmentTopic(lower)) {
      checkpoints = [
        'liste des besoins adaptee a la duree et a la meteo',
        'checklist complete cochee sans oubli critique',
        'rangement logique pour acces rapide sur terrain',
        'equipements sensibles testes avant depart',
        'revision finale confirmee avec plan de secours'
      ];
    } else {
      checkpoints = [
        'pre requis verifies et contexte bien defini',
        'ressources necessaires disponibles avant execution',
        'resultat intermediaire conforme a l objectif de l etape',
        'ecarts corriges avant de poursuivre',
        'validation finale effectuee avec preuve de controle'
      ];
    }

    return checkpoints[(order - 1) % checkpoints.length];
  }

  private normalizeGuideImageUrl(rawUrl: string): string {
    const cleaned = this.safeText(rawUrl);
    if (!cleaned) {
      return '';
    }

    if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith('/assets/') || cleaned.startsWith('assets/')) {
      return cleaned.startsWith('assets/') ? `/${cleaned}` : cleaned;
    }

    return '';
  }

  private normalizeGuideVideoUrl(rawUrl: string): string {
    const cleaned = this.safeText(rawUrl);
    if (!cleaned) {
      return '';
    }

    const youtubeWatchMatch = cleaned.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/i);
    if (youtubeWatchMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
    }

    const youtubeShortMatch = cleaned.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/i);
    if (youtubeShortMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeShortMatch[1]}`;
    }

    const youtubeEmbedMatch = cleaned.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i);
    if (youtubeEmbedMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeEmbedMatch[1]}`;
    }

    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    return '';
  }

  private toYoutubeEmbedGuideUrl(rawUrl: string): string {
    const normalized = this.normalizeGuideVideoUrl(rawUrl);
    return /youtube\.com\/embed\//i.test(normalized) ? normalized : '';
  }

  private humanizeLevel(level: string): string {
    switch (level) {
      case 'ADVANCED':
        return 'avance';
      case 'INTERMEDIATE':
        return 'intermediaire';
      default:
        return 'debutant';
    }
  }

  private normalizeLevel(level: string): string {
    const raw = level.trim().toUpperCase();
    if (raw === 'INTERMEDIATE' || raw === 'ADVANCED') {
      return raw;
    }
    return 'BEGINNER';
  }

  private normalizeGenerationInput(payload: FormationGenerateRequestDto): FormationGenerateRequestDto {
    return {
      subject: this.normalizeSubject(this.safeText(payload.subject) || 'Introduction au camping'),
      level: this.normalizeLevel(this.safeText(payload.level)),
      targetUser: this.normalizeTargetUser(this.safeText(payload.targetUser))
    };
  }

  private buildPromptedSubject(subject: string, _level: string): string {
    const normalizedSubject = this.normalizeSubject(subject);
    return normalizedSubject;
  }

  private normalizeTargetUser(targetUser: string): string {
    const raw = targetUser.trim().toUpperCase();
    if (raw === 'GUIDE') {
      return raw;
    }
    if (raw === 'ADMIN' || raw === 'ADMINISTRATEUR') {
      return 'ADMINISTRATEUR';
    }
    return 'CLIENT';
  }

  private normalizeSubject(subject: string): string {
    const compact = subject.replace(/\s+/g, ' ').trim();
    if (!compact) {
      return 'Introduction au camping';
    }

    const cleaned = compact
      .replace(/^formation\s*:\s*/i, '')
      .replace(/^formation\s+/i, '')
      .replace(/^guide\s*:\s*/i, '')
      .replace(/\bcamp\s*connect\b/gi, '')
      .replace(/\bcampconnect\b/gi, '')
      .trim();

    return cleaned || 'Introduction au camping';
  }

  private buildSubjectKeywords(subject: string): string[] {
    const words = subject
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4)
      .filter((word) => !['dans', 'avec', 'pour', 'campconnect', 'gestion'].includes(word));

    const deduplicated = Array.from(new Set(words));
    return deduplicated.slice(0, 4);
  }

  private buildImageSuggestionQueries(subject: string): string[] {
    const normalizedSubject = this.normalizeSubject(subject);
    const lowerSubject = normalizedSubject.toLowerCase();
    const keywords = this.buildSubjectKeywords(normalizedSubject);
    const keywordTail = keywords.length > 0 ? ` ${keywords.join(' ')}` : '';
    const directSubjectQuery = lowerSubject.includes('camping')
      ? normalizedSubject
      : `${normalizedSubject} camping`;

    const themedQueries = this.isTentTopic(lowerSubject)
      ? [
        `montage tente camping${keywordTail}`,
        `fixation piquets tente${keywordTail}`
      ]
      : this.isSafetyTopic(lowerSubject)
        ? [
          `securite camping terrain${keywordTail}`,
          `prevention risque camping${keywordTail}`
        ]
        : this.isReservationTopic(lowerSubject)
          ? [
            `accueil camping reception${keywordTail}`,
            `checklist reservation camping${keywordTail}`
          ]
          : this.isEnvironmentTopic(lowerSubject)
            ? [
              `nature camping responsable${keywordTail}`,
              `proprete site camping${keywordTail}`
            ]
            : this.isEquipmentTopic(lowerSubject)
              ? [
                `equipement camping essentiel${keywordTail}`,
                `materiel camping terrain${keywordTail}`
              ]
              : this.isCookingTopic(lowerSubject)
                ? [
                  `cuisine camping pratique${keywordTail}`,
                  `repas camping barbecue${keywordTail}`
                ]
                : [
                  `formation camping pratique${keywordTail}`,
                  `tutoriel camping terrain${keywordTail}`
                ];

    return this.uniqueQueries([
      directSubjectQuery,
      ...themedQueries,
      `guide visuel ${normalizedSubject}`
    ]);
  }

  private buildVideoSuggestionQueries(subject: string): string[] {
    const normalizedSubject = this.normalizeSubject(subject);
    const lowerSubject = normalizedSubject.toLowerCase();
    const directSubjectQuery = lowerSubject.includes('camping')
      ? `tutoriel ${normalizedSubject.toLowerCase()}`
      : `tutoriel ${normalizedSubject.toLowerCase()} camping`;
    const themedQueries = this.isTentTopic(lowerSubject)
      ? [
        'montage tente camping etape par etape',
        'fixer les piquets de tente camping'
      ]
      : this.isSafetyTopic(lowerSubject)
        ? [
          'securite camping regles essentielles',
          'prevention incendie camping'
        ]
        : this.isReservationTopic(lowerSubject)
          ? [
            'accueil client camping procedure',
            'checklist reservation camping'
          ]
          : this.isEnvironmentTopic(lowerSubject)
            ? [
              'camping eco responsable bonnes pratiques',
              'respect de l environnement en camping'
            ]
            : this.isEquipmentTopic(lowerSubject)
              ? [
                'materiel camping essentiel guide',
                'checklist equipement camping'
              ]
              : this.isCookingTopic(lowerSubject)
                ? [
                  'cuisine camping facile',
                  'barbecue camping conseils'
                ]
                : [
                  'camping debutant etape par etape',
                  'guide pratique camping terrain'
                ];

    return this.uniqueQueries([
      directSubjectQuery,
      ...themedQueries,
      `formation ${normalizedSubject.toLowerCase()}`
    ]);
  }

  private toImageSuggestion(subject: string, query: string, index: number): FormationMediaSuggestionItemDto {
    const normalizedSubject = this.normalizeSubject(subject);
    return {
      label: `Image ${index + 1} - ${normalizedSubject}`,
      mediaType: 'IMAGE',
      source: 'LOCAL_ASSET',
      url: this.buildLocalImageUrl(subject, index)
    };
  }

  private toVideoSuggestion(subject: string, query: string, index: number): FormationMediaSuggestionItemDto {
    return {
      label: query,
      mediaType: 'VIDEO',
      source: 'YOUTUBE',
      url: this.buildLocalVideoUrl(subject, index)
    };
  }

  private buildLocalImageUrl(subject: string, index: number): string {
    const topicKey = this.resolveImageTopicKey(subject);
    const pool = this.localImagePools[topicKey] ?? this.localImagePools['default'];
    if (!Array.isArray(pool) || pool.length === 0) {
      return '/assets/images/default-image.jpg';
    }

    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    return pool[safeIndex % pool.length];
  }

  private buildLocalVideoUrl(subject: string, index: number): string {
    const topicKey = this.resolveVideoTopicKey(subject);
    const pool = this.localVideoPools[topicKey] ?? this.localVideoPools['default'];
    if (!Array.isArray(pool) || pool.length === 0) {
      return 'https://www.youtube.com/embed/M7lc1UVf-VE';
    }

    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    return pool[safeIndex % pool.length];
  }

  private resolveImageTopicKey(subject: string): keyof FormationAiService['localImagePools'] {
    const lowered = this.normalizeSubject(subject).toLowerCase();
    if (this.isTentTopic(lowered)) {
      return 'tente';
    }
    if (this.isSafetyTopic(lowered)) {
      return 'securite';
    }
    if (this.isReservationTopic(lowered)) {
      return 'reservation';
    }
    if (this.isEnvironmentTopic(lowered)) {
      return 'environnement';
    }
    if (this.isEquipmentTopic(lowered)) {
      return 'materiel';
    }
    if (this.isCookingTopic(lowered)) {
      return 'cuisine';
    }
    return 'default';
  }

  private resolveVideoTopicKey(subject: string): keyof FormationAiService['localVideoPools'] {
    const lowered = this.normalizeSubject(subject).toLowerCase();
    if (this.isTentTopic(lowered)) {
      return 'tente';
    }
    if (this.isSafetyTopic(lowered)) {
      return 'securite';
    }
    if (this.isReservationTopic(lowered)) {
      return 'reservation';
    }
    if (this.isEnvironmentTopic(lowered)) {
      return 'environnement';
    }
    if (this.isEquipmentTopic(lowered)) {
      return 'materiel';
    }
    if (this.isCookingTopic(lowered)) {
      return 'cuisine';
    }
    return 'default';
  }

  private isTentTopic(value: string): boolean {
    return /\b(tente|piquet|arceau|hauban|montage|monter|campement)\b/i.test(value);
  }

  private isSafetyTopic(value: string): boolean {
    return value.includes('securite') || value.includes('incendie') || value.includes('risque') || value.includes('urgence');
  }

  private isReservationTopic(value: string): boolean {
    return value.includes('reservation') || value.includes('accueil') || value.includes('client') || value.includes('reception');
  }

  private isEnvironmentTopic(value: string): boolean {
    return value.includes('environ')
      || value.includes('nature')
      || value.includes('foret')
      || value.includes('ecolog')
      || value.includes('montagne')
      || value.includes('altitude')
      || value.includes('randon');
  }

  private isEquipmentTopic(value: string): boolean {
    return value.includes('materiel') || value.includes('equipement') || value.includes('sac') || value.includes('lampe');
  }

  private isCookingTopic(value: string): boolean {
    return value.includes('cuisine') || value.includes('repas') || value.includes('barbecue') || value.includes('cuisson');
  }

  private uniqueQueries(queries: string[]): string[] {
    const normalizedSet = new Set<string>();
    const result: string[] = [];
    queries.forEach((query) => {
      const cleaned = this.safeText(query).replace(/\s+/g, ' ').trim();
      if (!cleaned) {
        return;
      }

      const key = cleaned.toLowerCase();
      if (normalizedSet.has(key)) {
        return;
      }

      normalizedSet.add(key);
      result.push(cleaned);
    });
    return result;
  }

  private estimateDurationFromContent(
    level: string,
    description: string,
    objectives: string[],
    sections: Array<{ title: string; content: string }>,
    summary: string,
    quiz: FormationQuizItemDto[]
  ): string {
    const descriptionWords = this.countWords(description);
    const summaryWords = this.countWords(summary);
    const objectivesWords = objectives.reduce((total, objective) => total + this.countWords(objective), 0);
    const sectionsWords = sections.reduce((total, section) => {
      return total + this.countWords(section.title) + this.countWords(section.content);
    }, 0);
    const baseWordCount = descriptionWords + summaryWords + objectivesWords + sectionsWords;

    let minutes: number;
    if (baseWordCount <= 120) {
      minutes = 15;
    } else if (baseWordCount <= 260) {
      minutes = 30;
    } else {
      minutes = 45;
    }

    if (sections.length >= 5 || quiz.length >= 5) {
      minutes = Math.min(45, minutes + 15);
    }

    if (level === 'ADVANCED' && minutes < 45 && baseWordCount > 180) {
      minutes = minutes + 15;
    }

    return `${this.toClosestDurationSlot(minutes)} minutes`;
  }

  private toClosestDurationSlot(minutes: number): number {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return 30;
    }

    const sorted = [...this.realisticDurationSlots].sort((a, b) => a - b);
    let closest = sorted[0];
    let smallestGap = Math.abs(minutes - closest);

    for (const slot of sorted) {
      const gap = Math.abs(minutes - slot);
      if (gap < smallestGap) {
        closest = slot;
        smallestGap = gap;
      }
    }

    return closest;
  }

  private extractDurationMinutes(duration: string): number | null {
    const compact = duration.trim();
    if (!compact) {
      return null;
    }

    const match = compact.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private countWords(value: string): number {
    return value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private createSeed(...parts: string[]): number {
    const raw = parts.join('|');
    let hash = 0;
    for (let index = 0; index < raw.length; index += 1) {
      hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }

  private pickVariant(values: string[], seed: number, offset = 0): string {
    if (values.length === 0) {
      return '';
    }
    return values[(seed + offset) % values.length];
  }

  private safeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeGeneratedFormation(
    response: FormationGenerateResponseDto,
    payload: FormationGenerateRequestDto
  ): FormationGenerateResponseDto {
    const fallback = this.buildMockGeneratedFormation(payload);
    if (!response || typeof response !== 'object') {
      return fallback;
    }

    const subject = this.normalizeSubject(this.safeText(payload.subject) || fallback.title);
    const normalizedLevel = this.normalizeLevel(this.safeText(response.level) || this.safeText(payload.level) || fallback.level);
    const normalizedTitle = this.normalizeGeneratedTitle(this.safeText(response.title), subject);
    const normalizedDescription = this.normalizeGeneratedDescription(this.safeText(response.description), subject, fallback.description);
    const normalizedObjectives = this.normalizeGeneratedObjectives(response.objectives, subject, fallback.objectives);
    const normalizedSections = this.normalizeGeneratedSections(response.sections, subject, fallback.sections);
    const normalizedSummary = this.normalizeGeneratedSummary(this.safeText(response.summary), subject, fallback.summary);
    const normalizedQuiz = this.normalizeGeneratedQuiz(response.quiz, subject, fallback.quiz);
    const normalizedDuration = this.normalizeGeneratedDuration(
      this.safeText(response.estimatedDuration),
      fallback.estimatedDuration,
      normalizedLevel,
      normalizedDescription,
      normalizedObjectives,
      normalizedSections,
      normalizedSummary,
      normalizedQuiz
    );

    const rawCandidate: FormationGenerateResponseDto = {
      title: normalizedTitle,
      description: normalizedDescription,
      objectives: normalizedObjectives,
      sections: normalizedSections,
      summary: normalizedSummary,
      quiz: normalizedQuiz,
      level: normalizedLevel,
      estimatedDuration: normalizedDuration
    };

    const candidate = this.sanitizeGeneratedPayload(rawCandidate, subject, normalizedLevel);

    if (this.isCampingSelectionSubject(subject) && !this.hasCampingSelectionSignals(candidate)) {
      return fallback;
    }

    return this.hasAcceptableGeneratedQuality(candidate, subject) ? candidate : fallback;
  }

  private normalizeGeneratedTitle(title: string, subject: string): string {
    const compact = this.sanitizeOutputText(title).replace(/\s+/g, ' ').trim();
    if (!compact) {
      return subject;
    }

    const cleaned = compact
      .replace(/^formation\s*:\s*formation\b/i, 'Formation')
      .replace(/^formation\s+formation\b/i, 'Formation')
      .replace(/^formation\s*:\s*/i, '')
      .replace(/\s*[-:]\s*niveau\s+(debutant|intermediaire|avance)\b/gi, '')
      .replace(/\(\s*niveau\s+(debutant|intermediaire|avance)\s*\)/gi, '')
      .trim();

    if (!cleaned) {
      return subject;
    }

    if (!this.normalizeSubject(cleaned).toLowerCase().includes(subject.toLowerCase())) {
      return `${subject} - ${cleaned}`;
    }

    return this.sanitizeOutputText(cleaned);
  }

  private normalizeGeneratedDescription(description: string, subject: string, fallback: string): string {
    const compact = this.simplifyText(this.sanitizeOutputText(description)).replace(/\s+/g, ' ').trim();
    if (compact.length < 80) {
      return fallback;
    }

    if (this.hasGenericTone(compact) || !this.hasPracticalCampingAnchors(compact)) {
      return fallback;
    }

    if (!compact.toLowerCase().includes(subject.toLowerCase())) {
      return `${compact} Cette formation est centree sur ${subject}.`;
    }

    return this.sanitizeOutputText(compact);
  }

  private normalizeGeneratedObjectives(objectives: unknown, subject: string, fallback: string[]): string[] {
    if (!Array.isArray(objectives)) {
      return fallback;
    }

    const normalized = objectives
      .map((objective) => this.safeText(objective))
      .map((objective) => this.simplifyText(this.sanitizeOutputText(objective)))
      .map((objective) => objective.replace(/\s+/g, ' ').trim())
      .filter((objective) => objective.length >= 12);

    const unique = Array.from(new Set(normalized));
    if (unique.length < 3) {
      return fallback;
    }

    if (!unique.some((objective) => objective.toLowerCase().includes(subject.toLowerCase()))) {
      unique[0] = `Comprendre les principes cles de ${subject}.`;
    }

    const scoped = unique.slice(0, 5);
    if (scoped.some((objective) => this.hasGenericTone(objective))) {
      return fallback;
    }
    return scoped;
  }

  private normalizeGeneratedSections(
    sections: unknown,
    subject: string,
    fallback: Array<{ title: string; content: string }>
  ): Array<{ title: string; content: string }> {
    if (!Array.isArray(sections)) {
      return fallback;
    }

    const normalized = sections
      .map((section) => this.toSection(section))
      .filter((section): section is { title: string; content: string } => section !== null)
      .filter((section) => section.content.length >= 40);

    if (normalized.length < 3) {
      return fallback;
    }

    const containsSubject = normalized.some((section) =>
      `${section.title} ${section.content}`.toLowerCase().includes(subject.toLowerCase())
    );
    if (!containsSubject) {
      normalized[0] = {
        title: `Introduction a ${subject}`,
        content: normalized[0].content
      };
    }

    const scoped = normalized.slice(0, 6);
    const compactSections = scoped.map((section) => `${section.title} ${section.content}`).join(' ');
    if (this.hasGenericTone(compactSections) || !this.hasPracticalCampingAnchors(compactSections)) {
      return fallback;
    }
    return scoped;
  }

  private normalizeGeneratedSummary(summary: string, subject: string, fallback: string): string {
    const compact = this.simplifyText(this.sanitizeOutputText(summary)).replace(/\s+/g, ' ').trim();
    if (compact.length < 35) {
      return fallback;
    }

    if (!compact.toLowerCase().includes(subject.toLowerCase())) {
      return `${compact} Focus principal: ${subject}.`;
    }

    return compact;
  }

  private normalizeGeneratedDuration(
    duration: string,
    fallback: string,
    level: string,
    description: string,
    objectives: string[],
    sections: Array<{ title: string; content: string }>,
    summary: string,
    quiz: FormationQuizItemDto[]
  ): string {
    const contentBased = this.estimateDurationFromContent(level, description, objectives, sections, summary, quiz);
    const hintMinutes = this.extractDurationMinutes(duration);
    if (hintMinutes === null) {
      return contentBased || fallback || '30 minutes';
    }

    const clampedHint = this.toClosestDurationSlot(hintMinutes);
    const contentMinutes = this.extractDurationMinutes(contentBased) ?? 30;
    const finalMinutes = Math.abs(clampedHint - contentMinutes) <= 15 ? clampedHint : contentMinutes;
    return `${finalMinutes} minutes`;
  }

  private normalizeGeneratedQuiz(
    quiz: unknown,
    subject: string,
    fallback: FormationQuizItemDto[]
  ): FormationQuizItemDto[] {
    if (!Array.isArray(quiz)) {
      return fallback;
    }

    const normalized = quiz
      .map((item) => this.toQuizItem(item))
      .filter((item): item is FormationQuizItemDto => item !== null);

    if (normalized.length < 3) {
      return fallback;
    }

    if (!normalized.some((item) => item.question.toLowerCase().includes(subject.toLowerCase()))) {
      normalized[0] = {
        ...normalized[0],
        question: `Quelle pratique est essentielle pour ${subject} ?`
      };
    }

    const scoped = normalized.slice(0, 6);
    const quizText = scoped.map((item) => `${item.question} ${item.choices.join(' ')}`).join(' ');
    if (this.containsCampConnect(quizText) || this.hasGenericTone(quizText)) {
      return fallback;
    }
    return scoped;
  }

  private hasAcceptableGeneratedQuality(result: FormationGenerateResponseDto, subject: string): boolean {
    if (result.title.length < 8 || result.description.length < 80 || result.summary.length < 30) {
      return false;
    }

    if (result.objectives.length < 3 || result.sections.length < 3 || result.quiz.length < 3) {
      return false;
    }

    const detailedSections = result.sections.filter((section) => this.countWords(section.content) >= 10).length;
    if (detailedSections < Math.min(3, result.sections.length)) {
      return false;
    }

    const subjectLower = subject.toLowerCase();
    const combined = [
      result.title,
      result.description,
      result.summary,
      ...result.objectives,
      ...result.sections.map((section) => `${section.title} ${section.content}`)
    ].join(' ').toLowerCase();

    if (!combined.includes(subjectLower)) {
      return false;
    }

    if (this.containsCampConnect(combined)) {
      return false;
    }

    if (this.hasGenericTone(combined)) {
      return false;
    }

    if (!this.hasPracticalCampingAnchors(combined)) {
      return false;
    }

    if (this.hasOverRepeatedWords(combined) || this.hasOverTechnicalTone(combined)) {
      return false;
    }

    const duplicateCheck = new Set(result.objectives.map((objective) => objective.toLowerCase()));
    if (duplicateCheck.size < Math.min(3, result.objectives.length)) {
      return false;
    }

    return true;
  }

  private toSection(value: unknown): { title: string; content: string } | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as { title?: unknown; content?: unknown };
    const title = this.simplifyText(this.sanitizeOutputText(this.safeText(record.title))).replace(/\s+/g, ' ').trim();
    const content = this.simplifyText(this.sanitizeOutputText(this.safeText(record.content))).replace(/\s+/g, ' ').trim();
    if (!title || !content) {
      return null;
    }

    return { title, content };
  }

  private toQuizItem(value: unknown): FormationQuizItemDto | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as { question?: unknown; choices?: unknown; correctAnswer?: unknown };
    const question = this.simplifyText(this.sanitizeOutputText(this.safeText(record.question))).replace(/\s+/g, ' ').trim();
    const choices = Array.isArray(record.choices)
      ? record.choices
        .map((choice) => this.simplifyText(this.sanitizeOutputText(this.safeText(choice))))
        .filter((choice) => choice.length >= 2)
      : [];
    const correctAnswer = this.simplifyText(this.sanitizeOutputText(this.safeText(record.correctAnswer))).replace(/\s+/g, ' ').trim();

    if (!question || choices.length < 2 || !correctAnswer) {
      return null;
    }

    return { question, choices: Array.from(new Set(choices)).slice(0, 5), correctAnswer };
  }

  private sanitizeGeneratedPayload(
    payload: FormationGenerateResponseDto,
    subject: string,
    level: string
  ): FormationGenerateResponseDto {
    const safeTitle = this.simplifyText(this.sanitizeOutputText(payload.title)) || `${subject} - ${this.humanizeLevel(level)}`;
    const safeDescription = this.simplifyText(this.sanitizeOutputText(payload.description))
      || `Formation pratique sur ${subject.toLowerCase()} en camping reel, avec des etapes simples et une validation claire.`;
    const safeObjectives = payload.objectives
      .map((objective) => this.simplifyText(this.sanitizeOutputText(objective)))
      .filter((objective) => objective.length >= 10);
    const safeSections = payload.sections
      .map((section) => ({
        title: this.simplifyText(this.sanitizeOutputText(section.title)),
        content: this.simplifyText(this.sanitizeOutputText(section.content))
      }))
      .filter((section) => section.title.length > 3 && section.content.length > 20);
    const safeSummary = this.simplifyText(this.sanitizeOutputText(payload.summary));
    const safeQuiz = payload.quiz
      .map((item) => ({
        question: this.simplifyText(this.sanitizeOutputText(item.question)),
        choices: item.choices.map((choice) => this.simplifyText(this.sanitizeOutputText(choice))).filter((choice) => choice.length >= 2),
        correctAnswer: this.simplifyText(this.sanitizeOutputText(item.correctAnswer))
      }))
      .filter((item) => item.question.length >= 8 && item.choices.length >= 2 && item.correctAnswer.length >= 2);
    const safeDuration = this.normalizeGeneratedDuration(
      payload.estimatedDuration,
      '30 minutes',
      this.normalizeLevel(level),
      safeDescription,
      safeObjectives.length > 0 ? safeObjectives : payload.objectives,
      safeSections.length > 0 ? safeSections : payload.sections,
      safeSummary || payload.summary,
      safeQuiz.length > 0 ? safeQuiz : payload.quiz
    );

    return {
      title: safeTitle,
      description: safeDescription,
      objectives: safeObjectives.length > 0 ? safeObjectives : payload.objectives,
      sections: safeSections.length > 0 ? safeSections : payload.sections,
      summary: safeSummary || payload.summary,
      quiz: safeQuiz.length > 0 ? safeQuiz : payload.quiz,
      level: this.normalizeLevel(level),
      estimatedDuration: safeDuration
    };
  }

  private sanitizeOutputText(value: string): string {
    if (!value) {
      return '';
    }

    return value
      .replace(/\bcamp\s*connect\b/gi, '')
      .replace(/\bcampconnect\b/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;!?])/g, '$1')
      .replace(/([,.;!?])([^\s])/g, '$1 $2')
      .trim();
  }

  private simplifyText(value: string): string {
    if (!value) {
      return '';
    }

    return value
      .replace(/\borientee action\b/gi, 'pratique')
      .replace(/\bmethode\b/gi, 'approche')
      .replace(/\boptimiser\b/gi, 'ameliorer')
      .replace(/\bfiabiliser\b/gi, 'securiser')
      .replace(/\bamelioration continue\b/gi, 'progres regulier')
      .replace(/\bcoordonner\b/gi, 'organiser')
      .replace(/\bstrat(e|é)gie\b/gi, 'plan')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private containsCampConnect(value: string): boolean {
    return /\bcamp\s*connect\b/i.test(value) || /\bcampconnect\b/i.test(value);
  }

  private hasGenericTone(value: string): boolean {
    const text = value.toLowerCase();
    const genericSignals = [
      'parcours progressif',
      'synergie',
      'levier',
      'optimisation globale',
      'gouvernance',
      'coherent',
      'strategie transversale',
      'alignement',
      'pilotage'
    ];
    const score = genericSignals.reduce((count, signal) => count + (text.includes(signal) ? 1 : 0), 0);
    return score >= 2;
  }

  private hasOverRepeatedWords(value: string): boolean {
    const words = value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length > 4);

    if (words.length < 12) {
      return false;
    }

    const counts = new Map<string, number>();
    words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
    return Array.from(counts.values()).some((count) => count >= 6);
  }

  private hasOverTechnicalTone(value: string): boolean {
    const text = value.toLowerCase();
    const technicalSignals = [
      'architecture',
      'gouvernance',
      'orchestration',
      'protocole',
      'industrialiser',
      'kpi'
    ];
    const matches = technicalSignals.filter((signal) => text.includes(signal));
    return matches.length >= 2;
  }

  private hasPracticalCampingAnchors(value: string): boolean {
    const text = value.toLowerCase();
    const anchors = [
      'terrain',
      'camping',
      'tente',
      'piquet',
      'sol',
      'meteo',
      'materiel',
      'securite',
      'checklist',
      'etape',
      'verifier',
      'installer',
      'fixer',
      'stabilite'
    ];
    const hits = anchors.filter((anchor) => text.includes(anchor)).length;
    return hits >= 2;
  }

  private getPracticalFocus(subject: string): string {
    const lower = subject.toLowerCase();
    if (lower.includes('tente') || lower.includes('mont') || lower.includes('piquet')) {
      return 'montage, fixation et stabilite de la tente';
    }
    if (lower.includes('securite') || lower.includes('risque') || lower.includes('incendie')) {
      return 'prevention des risques et reflexes de securite';
    }
    if (lower.includes('reservation') || lower.includes('accueil') || lower.includes('client')) {
      return 'accueil terrain, verification des infos et gestion des imprevus';
    }
    if (lower.includes('environnement') || lower.includes('ecologie')) {
      return 'respect du site, tri et reduction de l impact';
    }
    return 'organisation du terrain, execution et controle final';
  }

  private capitalize(value: string): string {
    return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
  }

  private buildImprovedFormationFromDraft(
    draft: AnalyzeFormationRequestDto,
    base: FormationGenerateResponseDto,
    subject: string,
    level: string
  ): FormationGenerateResponseDto {
    const improvedTitle = this.normalizeGeneratedTitle(this.safeText(draft.title) || base.title, subject);
    const improvedDescription = this.buildImprovedDescription(subject, draft.description, base.description);
    const improvedObjectives = this.buildImprovedObjectives(subject, draft.objectives, base.objectives);
    const improvedSections = this.buildImprovedSections(subject, draft.content, base.sections);
    const improvedSummary = this.buildImprovedSummary(subject, draft.summary, improvedDescription, improvedSections, base.summary);
    const improvedQuiz = this.normalizeGeneratedQuiz(draft.quiz, subject, base.quiz);

    const candidate: FormationGenerateResponseDto = {
      title: improvedTitle,
      description: improvedDescription,
      objectives: improvedObjectives,
      sections: improvedSections,
      summary: improvedSummary,
      quiz: improvedQuiz,
      level: this.normalizeLevel(level),
      estimatedDuration: ''
    };

    const sanitized = this.sanitizeGeneratedPayload(candidate, subject, level);
    return this.hasAcceptableGeneratedQuality(sanitized, subject) ? sanitized : base;
  }

  private buildImprovedDescription(subject: string, description: string, fallback: string): string {
    const clean = this.simplifyText(this.sanitizeOutputText(description));
    if (clean.length >= 80 && this.hasPracticalCampingAnchors(clean)) {
      return clean;
    }

    return [
      `Apprendre ${subject.toLowerCase()} avec une approche simple et pratique.`,
      'La formation montre quoi faire, dans quel ordre, et quels points verifier sur le terrain.',
      'Chaque etape est reliee a une situation concrete de camping.'
    ].join(' ');
  }

  private buildImprovedObjectives(subject: string, objectives: string[], fallback: string[]): string[] {
    const drafted = Array.isArray(objectives)
      ? objectives
        .map((objective) => this.simplifyText(this.sanitizeOutputText(this.safeText(objective))))
        .map((objective) => objective.replace(/\s+/g, ' ').trim())
        .filter((objective) => objective.length >= 10)
      : [];

    const merged = [...drafted, ...fallback];
    const unique = Array.from(new Set(merged.map((item) => item.trim()))).filter((item) => item.length > 0);

    const normalized = unique.slice(0, 5).map((objective, index) => {
      if (/^(identifier|comparer|verifier|appliquer|choisir|preparer|controler)\b/i.test(objective)) {
        return objective;
      }

      const defaultStarts = ['Identifier', 'Comparer', 'Verifier', 'Appliquer', 'Valider'];
      const verb = defaultStarts[index % defaultStarts.length];
      return `${verb} ${objective.charAt(0).toLowerCase()}${objective.slice(1)}`;
    });

    if (normalized.length >= 3) {
      return normalized;
    }

    return [
      `Identifier les etapes cles pour ${subject.toLowerCase()}.`,
      `Comparer les options et choisir une solution adaptee au terrain.`,
      'Verifier les points de securite avant validation finale.'
    ];
  }

  private buildImprovedSections(
    subject: string,
    content: string,
    fallback: Array<{ title: string; content: string }>
  ): Array<{ title: string; content: string }> {
    const parsed = this.parseSectionsFromDraftContent(content);
    if (parsed.length >= 3) {
      return parsed.slice(0, 6);
    }

    return fallback.map((section) => ({
      title: this.simplifyText(section.title),
      content: this.simplifyText(section.content)
    }));
  }

  private buildImprovedSummary(
    subject: string,
    summary: string,
    description: string,
    sections: Array<{ title: string; content: string }>,
    fallback: string
  ): string {
    const cleanedSummary = this.simplifyText(this.sanitizeOutputText(summary));
    if (cleanedSummary.length >= 35) {
      return cleanedSummary;
    }

    const firstSection = sections[0]?.title || 'la premiere etape';
    const shortDescription = description.length > 120 ? `${description.slice(0, 117).trim()}...` : description;
    const generated = `Resume: ${shortDescription} Priorite sur ${firstSection.toLowerCase()} pour ${subject.toLowerCase()}.`;
    return generated.length >= 35 ? generated : fallback;
  }

  private parseSectionsFromDraftContent(content: string): Array<{ title: string; content: string }> {
    const cleanContent = content
      .replace(/\bcamp\s*connect\b/gi, '')
      .replace(/\bcampconnect\b/gi, '')
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (!cleanContent) {
      return [];
    }

    const lines = cleanContent.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) {
      return [];
    }

    const sections: Array<{ title: string; content: string }> = [];
    let currentTitle = '';
    const currentContent: string[] = [];

    const pushSection = () => {
      const title = currentTitle || `Etape ${sections.length + 1}`;
      const contentText = this.simplifyText(currentContent.join(' ').trim());
      if (contentText.length >= 20) {
        sections.push({
          title: this.simplifyText(title),
          content: contentText
        });
      }
      currentTitle = '';
      currentContent.length = 0;
    };

    lines.forEach((line) => {
      const heading = line.replace(/^#+\s*/, '').trim();
      const isHeading = /^#+\s*/.test(line) || /^\d+\s*[-.)]/.test(line);
      if (isHeading) {
        if (currentTitle || currentContent.length > 0) {
          pushSection();
        }
        currentTitle = heading || `Etape ${sections.length + 1}`;
        return;
      }
      currentContent.push(line);
    });

    if (currentTitle || currentContent.length > 0) {
      pushSection();
    }

    if (sections.length >= 3) {
      return sections;
    }

    const paragraphs = cleanContent
      .split(/\n{2,}/)
      .map((paragraph) => this.simplifyText(paragraph.trim()))
      .filter((paragraph) => paragraph.length >= 20);

    if (paragraphs.length < 3) {
      return [];
    }

    return paragraphs.slice(0, 5).map((paragraph, index) => ({
      title: `Etape ${index + 1}`,
      content: paragraph
    }));
  }

  private extractSubjectFromDescription(description: string): string {
    const normalized = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !['avec', 'dans', 'pour', 'une', 'des', 'les', 'sur', 'par'].includes(word))
      .slice(0, 5)
      .join(' ');

    return this.capitalize(normalized.trim());
  }

  private isCampingSelectionSubject(subject: string): boolean {
    const text = subject.toLowerCase();
    const hasCamping = text.includes('camping') || text.includes('camp');
    const hasSelectionIntent = text.includes('choisir')
      || text.includes('selection')
      || text.includes('meilleur')
      || text.includes('compar');
    return hasCamping && hasSelectionIntent;
  }

  private buildCampingSelectionFormation(subject: string, level: string): FormationGenerateResponseDto {
    const cleanSubject = this.normalizeSubject(subject);
    const title = `${cleanSubject} - guide pratique ${this.humanizeLevel(level)}`;
    const description = [
      'Apprendre a choisir un camping qui correspond vraiment au sejour prevu.',
      'La methode est simple: comparer les options, verifier les services annonces, analyser les avis et valider un choix final avec une checklist.'
    ].join(' ');

    const objectives = [
      'Comparer plusieurs campings avec des criteres clairs: prix, acces, confort et securite.',
      'Verifier les services essentiels avant de reserver: sanitaires, eau, electricite et regles du site.',
      'Lire les avis de facon utile: prioriser les retours recents et detaillees.',
      'Valider le choix final avec une checklist simple et une decision argumentee.'
    ];

    const sections = [
      {
        title: 'Etape 1 - Definir le besoin terrain',
        content: 'Preciser le type de sejour, le budget, la distance acceptable et le niveau de confort attendu.'
      },
      {
        title: 'Etape 2 - Comparer les options',
        content: 'Comparer 3 a 5 campings avec un tableau simple: prix, services inclus, acces, environnement et conditions du site.'
      },
      {
        title: 'Etape 3 - Verifier les services annonces',
        content: 'Verifier les informations importantes avec des preuves: photos recentes, disponibilite reelle et regles officielles.'
      },
      {
        title: 'Etape 4 - Lire les avis intelligemment',
        content: 'Lire d abord les avis recents et precis. Reperez les points qui reviennent souvent: proprete, bruit, securite et accueil.'
      },
      {
        title: 'Etape 5 - Valider le choix final',
        content: 'Finaliser le choix avec une checklist courte: avantages, limites et solution de secours si besoin.'
      }
    ];

    const candidate: FormationGenerateResponseDto = {
      title,
      description,
      objectives,
      sections,
      summary: 'Choisir un camping devient plus fiable avec quatre reflexes: comparer, verifier, lire les avis et valider.',
      quiz: [
        {
          question: 'Quel critere doit etre verifie avant de comparer les prix ?',
          choices: [
            'Les services essentiels et la securite du site',
            'Uniquement la note globale',
            'Seulement la distance'
          ],
          correctAnswer: 'Les services essentiels et la securite du site'
        },
        {
          question: 'Pourquoi filtrer les avis trop vagues ?',
          choices: [
            'Parce qu ils donnent peu d informations exploitables',
            'Parce qu ils sont toujours faux',
            'Parce qu ils sont plus anciens'
          ],
          correctAnswer: 'Parce qu ils donnent peu d informations exploitables'
        },
        {
          question: 'Quelle action finalise le choix d un camping ?',
          choices: [
            'Valider une checklist objective avant decision',
            'Choisir le premier resultat',
            'Ignorer les contraintes de securite'
          ],
          correctAnswer: 'Valider une checklist objective avant decision'
        }
      ],
      level: this.normalizeLevel(level),
      estimatedDuration: ''
    };

    return this.sanitizeGeneratedPayload(candidate, cleanSubject, level);
  }

  private hasCampingSelectionSignals(result: FormationGenerateResponseDto): boolean {
    const text = [
      result.description,
      result.summary,
      ...result.objectives,
      ...result.sections.map((section) => `${section.title} ${section.content}`)
    ].join(' ').toLowerCase();

    const needed = ['comparer', 'service', 'avis'];
    return needed.every((keyword) => text.includes(keyword));
  }
}
