import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

const GEMINI_URL = environment.geminiApiUrl;

export interface AiTextQuality {
  score: number;
  sentiment: 'positif' | 'neutre' | 'negatif';
  risk: 'faible' | 'moyen' | 'eleve';
  suggestions: string[];
  tags: string[];
}

// Mots bannis pour moderation locale rapide
const BANNED_WORDS = ['spam', 'insulte', 'idiot', 'stupide', 'nul', 'honte', 'hate', 'kill'];

@Injectable({ providedIn: 'root' })
export class AiService {
  private cache = new Map<string, string>();
  private readonly maxCacheSize = 40;

  constructor(private http: HttpClient) {}

  suggestContent(theme: string, forumName = ''): Observable<string> {
    if (!theme?.trim()) return of('');

    const prompt = `Tu es un assistant pour un forum de camping en Tunisie appele CampConnect.
Contexte forum: "${forumName || 'general'}".
Genere une publication de forum en francais (3 a 4 phrases maximum) sur le theme suivant : "${theme}".
La publication doit etre engageante, utile et adaptee a une communaute de campeurs.
Retourne uniquement le texte de la publication.`;

    return this.callGemini(prompt, 380, 0.72).pipe(
      map((text) => text || this.buildContentFallback(theme, forumName))
    );
  }

  suggestTitle(content: string, theme = ''): Observable<string> {
    const source = `${theme} ${content}`.trim();
    if (!source) return of('');

    const prompt = `Propose un titre unique de publication de forum en francais.
Contraintes:
- 8 a 12 mots maximum
- style naturel et accrocheur
- pas de guillemets
- pas de prefixe "Titre:"

Texte source:
"${source}"`;

    return this.callGemini(prompt, 80, 0.55).pipe(
      map((title) => this.cleanOneLine(title || this.buildTitleFallback(source)))
    );
  }

  summarizeContent(text: string, maxWords = 40): Observable<string> {
    if (!text?.trim()) return of('');

    const prompt = `Resumer le texte suivant en francais en ${maxWords} mots maximum.
Donner un resume utile et fidele. Retourner uniquement le resume.

Texte:
"${text}"`;

    return this.callGemini(prompt, 160, 0.35).pipe(
      map((summary) => this.cleanOneLine(summary || this.buildSummaryFallback(text, maxWords)))
    );
  }

  analyzeTextQuality(text: string): Observable<AiTextQuality> {
    if (!text?.trim()) return of(this.getHeuristicQuality(text));

    const prompt = `Analyse le texte suivant pour un forum.
Retourne uniquement un JSON valide avec cette structure:
{
  "score": number de 0 a 100,
  "sentiment": "positif" | "neutre" | "negatif",
  "risk": "faible" | "moyen" | "eleve",
  "suggestions": ["3 conseils max"],
  "tags": ["3 tags max sans #"]
}

Texte:
"${text}"`;

    return this.callGemini(prompt, 260, 0.25).pipe(
      map((raw) => this.parseQuality(raw, text)),
      catchError(() => of(this.getHeuristicQuality(text)))
    );
  }

  suggestCommentForPublication(
    publicationTitle: string,
    publicationContent: string,
    tone: 'friendly' | 'curious' | 'expert' = 'friendly'
  ): Observable<string> {
    const toneMap: Record<string, string> = {
      friendly: 'amical',
      curious: 'curieux',
      expert: 'expert'
    };

    const prompt = `Tu rediges un commentaire humain pour un forum de camping.
Ecris UNIQUEMENT en francais.
Ton: ${toneMap[tone]}.
Contraintes strictes:
- une seule phrase complete
- 12 a 24 mots
- utile, naturelle, respectueuse
- sans emoji
- sans guillemets
- pas de prefixe "Commentaire:"

Publication:
Titre: "${publicationTitle}"
Contenu: "${publicationContent}"`;

    return this.callGemini(prompt, 140, 0.6).pipe(
      map((result) => {
        const fallback = this.buildCommentFallback(publicationTitle, publicationContent, tone);
        return this.normalizeGeneratedComment(result, fallback);
      })
    );
  }

  improveCommentText(
    text: string,
    tone: 'friendly' | 'curious' | 'expert' = 'friendly'
  ): Observable<string> {
    const source = this.cleanOneLine(text);
    if (!source) return of('');

    const toneMap: Record<string, string> = {
      friendly: 'amical',
      curious: 'curieux',
      expert: 'expert'
    };

    const prompt = `Corrige ce commentaire en francais.
Objectif: orthographe, grammaire et fluidite.
Garde exactement l idee de depart.
Ton souhaite: ${toneMap[tone]}.
Contraintes:
- une seule phrase complete
- 8 a 24 mots
- sans emoji
- sans guillemets
- pas d explication

Commentaire:
"${source}"`;

    return this.callGemini(prompt, 90, 0.25).pipe(
      map((result) => this.normalizeGeneratedComment(result, this.buildImproveCommentFallback(source)))
    );
  }

  improveContent(texte: string): Observable<string> {
    if (!texte?.trim()) return of('');

    const prompt = `Tu es un assistant editorial pour un forum de camping en Tunisie.
Ameliore le texte suivant pour le rendre plus clair, engageant et bien structure.
Garde la meme langue : francais.
Retourne uniquement le texte ameliore, sans explication.

Texte :
"${texte}"`;

    return this.callGemini(prompt, 420, 0.65).pipe(
      map((result) => result || this.buildImproveFallback(texte))
    );
  }

  moderateComment(texte: string): Observable<boolean> {
    const normalized = (texte || '').trim();
    if (!normalized) return of(false);

    const lower = normalized.toLowerCase();
    if (BANNED_WORDS.some((w) => lower.includes(w)) || this.isLikelySpam(normalized)) {
      return of(false);
    }

    const prompt = `Analyse ce commentaire de forum.
Reponds uniquement par OUI si le commentaire est approprie et respectueux.
Reponds uniquement par NON s'il contient des insultes, du spam, de la haine ou du contenu inapproprie.
Un texte court, familier, avec fautes ou style oral n'est pas automatiquement inapproprie.

Commentaire :
"${normalized}"`;

    return this.callGemini(prompt, 30, 0).pipe(
      map((response) => {
        const verdict = this.cleanOneLine(response).toUpperCase();

        // Eviter les faux refus quand le service IA ne repond pas clairement.
        if (!verdict) return true;
        if (verdict.startsWith('NON')) return false;
        if (verdict.startsWith('OUI')) return true;
        return true;
      }),
      catchError(() => of(true))
    );
  }

  private callGemini(prompt: string, maxOutputTokens = 300, temperature = 0.7): Observable<string> {
    const cacheKey = `${maxOutputTokens}|${temperature}|${prompt}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return of(cached);
    }

    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens,
        temperature
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-goog-api-key': environment.geminiApiKey
    });

    return this.http.post<any>(GEMINI_URL, body, { headers }).pipe(
      map((res) => this.normalizeText(res?.candidates?.[0]?.content?.parts?.[0]?.text ?? '')),
      tap((text) => this.storeInCache(cacheKey, text)),
      catchError((err) => {
        console.error('Erreur Gemini API:', err);
        return of('');
      })
    );
  }

  private normalizeText(text: string): string {
    return (text || '').replace(/\r/g, '').trim();
  }

  private cleanOneLine(text: string): string {
    return this.normalizeText(text).replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  private storeInCache(key: string, value: string): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  private isLikelySpam(text: string): boolean {
    const urlMatches = text.match(/https?:\/\//gi) ?? [];
    if (urlMatches.length >= 2) return true;

    const repeatedWord = /(\b\w+\b)(?:\s+\1){3,}/i;
    if (repeatedWord.test(text)) return true;

    const punctuationSpam = /[!?]{6,}/.test(text);
    if (punctuationSpam) return true;

    const compact = text.replace(/\s+/g, '');
    const upperRatio = compact.length
      ? compact.split('').filter((char) => /[A-Z]/.test(char)).length / compact.length
      : 0;

    return upperRatio > 0.65 && compact.length > 20;
  }

  private parseQuality(raw: string, sourceText: string): AiTextQuality {
    const fallback = this.getHeuristicQuality(sourceText);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<AiTextQuality>;
      const score = this.clampNumber(parsed.score, fallback.score, 0, 100);
      const sentiment = this.normalizeSentiment(parsed.sentiment, fallback.sentiment);
      const risk = this.normalizeRisk(parsed.risk, fallback.risk);
      const suggestions = this.normalizeStringArray(parsed.suggestions, fallback.suggestions, 3);
      const tags = this.normalizeStringArray(parsed.tags, fallback.tags, 3).map((tag) => tag.replace(/^#/, ''));
      return { score, sentiment, risk, suggestions, tags };
    } catch {
      return fallback;
    }
  }

  private getHeuristicQuality(text: string): AiTextQuality {
    const value = (text || '').trim();
    if (!value) {
      return {
        score: 0,
        sentiment: 'neutre',
        risk: 'moyen',
        suggestions: ['Ajoute des details concrets pour la communaute.'],
        tags: ['camping']
      };
    }

    const words = value.split(/\s+/).filter(Boolean);
    const sizeScore = Math.min(55, words.length * 1.6);
    const punctuationBonus = /[.!?]/.test(value) ? 12 : 0;
    const actionableBonus = /(conseil|astuce|etape|materiel|budget|securite)/i.test(value) ? 18 : 0;
    const spamPenalty = this.isLikelySpam(value) ? 30 : 0;
    const score = Math.max(0, Math.min(100, Math.round(sizeScore + punctuationBonus + actionableBonus - spamPenalty)));

    let sentiment: 'positif' | 'neutre' | 'negatif' = 'neutre';
    if (/(super|genial|top|merci|utile|excellent)/i.test(value)) sentiment = 'positif';
    if (/(nul|horrible|deteste|mauvais)/i.test(value)) sentiment = 'negatif';

    const risk: 'faible' | 'moyen' | 'eleve' =
      spamPenalty >= 30 ? 'eleve' : words.length < 5 ? 'moyen' : 'faible';

    const suggestions: string[] = [];
    if (words.length < 15) suggestions.push('Ajoute plus de contexte pour aider les lecteurs.');
    if (!/[.!?]/.test(value)) suggestions.push('Ajoute une ponctuation claire pour ameliorer la lecture.');
    if (!/(conseil|astuce|etape|materiel|budget|securite)/i.test(value)) {
      suggestions.push('Ajoute une astuce concrete ou un retour d experience.');
    }
    if (suggestions.length === 0) suggestions.push('Texte clair, tu peux publier.');

    const tags = this.extractTagsFromText(value).slice(0, 3);
    return { score, sentiment, risk, suggestions: suggestions.slice(0, 3), tags };
  }

  private extractTagsFromText(text: string): string[] {
    const dictionary = [
      'tente',
      'randonnee',
      'securite',
      'famille',
      'montagne',
      'plage',
      'materiel',
      'budget',
      'recette',
      'nuit'
    ];
    const lower = text.toLowerCase();
    const tags = dictionary.filter((tag) => lower.includes(tag));
    return tags.length ? tags : ['camping'];
  }

  private clampNumber(value: unknown, fallback: number, min: number, max: number): number {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, Math.round(num)));
  }

  private normalizeSentiment(value: unknown, fallback: AiTextQuality['sentiment']): AiTextQuality['sentiment'] {
    const normalized = String(value ?? '').toLowerCase();
    if (normalized === 'positif' || normalized === 'neutre' || normalized === 'negatif') {
      return normalized;
    }
    return fallback;
  }

  private normalizeRisk(value: unknown, fallback: AiTextQuality['risk']): AiTextQuality['risk'] {
    const normalized = String(value ?? '').toLowerCase();
    if (normalized === 'faible' || normalized === 'moyen' || normalized === 'eleve') {
      return normalized;
    }
    return fallback;
  }

  private normalizeStringArray(value: unknown, fallback: string[], maxLength: number): string[] {
    if (!Array.isArray(value)) return fallback;
    const cleaned = value
      .map((entry) => String(entry ?? '').trim())
      .filter(Boolean)
      .slice(0, maxLength);
    return cleaned.length ? cleaned : fallback;
  }

  private buildContentFallback(theme: string, forumName: string): string {
    const cleanTheme = this.cleanOneLine(theme) || 'camping';
    const cleanForum = this.cleanOneLine(forumName) || 'la communaute';
    return `Salut la team ${cleanForum}, je partage une idee autour de "${cleanTheme}". `
      + `Avez-vous des conseils pratiques, materiel recommande ou retour d experience sur ce sujet ? `
      + `Merci d avance pour vos astuces afin d aider les nouveaux campeurs.`;
  }

  private buildTitleFallback(source: string): string {
    const words = source
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 10);

    if (!words.length) {
      return 'Conseils pratiques pour une sortie camping reussie';
    }

    const title = words.join(' ');
    return this.cleanOneLine(title.charAt(0).toUpperCase() + title.slice(1));
  }

  private buildSummaryFallback(text: string, maxWords: number): string {
    const words = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, Math.max(8, maxWords));

    if (!words.length) {
      return '';
    }

    const summary = words.join(' ');
    return summary.endsWith('.') ? summary : `${summary}.`;
  }

  private buildCommentFallback(
    publicationTitle: string,
    publicationContent: string,
    tone: 'friendly' | 'curious' | 'expert'
  ): string {
    const topic = this.extractTopic(publicationTitle, publicationContent);

    if (tone === 'expert') {
      return `Merci pour ce partage sur ${topic}, ajoute aussi des conseils de securite et de materiel pour aider les campeurs.`;
    }

    if (tone === 'curious') {
      return `Super sujet sur ${topic}, peux tu partager plus de details pratiques sur l acces et les conditions sur place ?`;
    }

    return `Merci pour ton partage sur ${topic}, ton retour est utile pour la communaute et donne envie de tester ce spot.`;
  }

  private buildImproveCommentFallback(text: string): string {
    const compact = this.cleanOneLine(text).replace(/\s+/g, ' ').trim();
    if (!compact) {
      return '';
    }

    const normalized = compact.charAt(0).toUpperCase() + compact.slice(1);
    return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
  }

  private normalizeGeneratedComment(result: string, fallback: string): string {
    const cleaned = this.cleanOneLine(result)
      .replace(/^(commentaire|reponse|suggestion)\s*[:\-]\s*/i, '')
      .replace(/^"(.*)"$/i, '$1')
      .trim();

    const base = cleaned || fallback;
    if (!base) {
      return '';
    }

    const oneLine = base.replace(/\s+/g, ' ').trim();
    if (!oneLine) {
      return '';
    }

    const capped = oneLine.charAt(0).toUpperCase() + oneLine.slice(1);
    return /[.!?]$/.test(capped) ? capped : `${capped}.`;
  }

  private extractTopic(title: string, content: string): string {
    const cleanTitle = this.cleanOneLine(title);
    if (cleanTitle) {
      return cleanTitle.split(' ').slice(0, 5).join(' ').toLowerCase();
    }

    const fromContent = this.cleanOneLine(content).split(' ').slice(0, 5).join(' ').toLowerCase();
    return fromContent || 'ce sujet';
  }

  private buildImproveFallback(text: string): string {
    const clean = (text || '').trim();
    if (!clean) {
      return '';
    }

    const normalized = clean.replace(/\s+/g, ' ');
    if (/[.!?]$/.test(normalized)) {
      return normalized;
    }
    return `${normalized}.`;
  }
}
