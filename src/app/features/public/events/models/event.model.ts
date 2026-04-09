export interface EventImageDTO {
  id: number;
  imageName: string;
  imageUrl: string;
  description?: string;
  isPrimary: boolean;
  displayOrder: number;
  mimeType: string;
  fileSize: number;
  eventId: number;
  uploadDate: string;
  lastModified: string;
  isAvailable: boolean;
}

export interface EventFeedbackDTO {
  reviewerName: string;
  rating: number;
  comment?: string;
  submittedAt?: string;
}

export type EventCategory =
  | 'GUIDED_TOUR'
  | 'CAMPING_ACTIVITY'
  | 'WORKSHOP'
  | 'WELLNESS'
  | 'RESTORATION'
  | 'SOCIAL_EVENT'
  | 'ADVENTURE'
  | 'EDUCATIONAL';

export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface EventRequestDTO {
  titre: string;
  description: string;
  categorie: EventCategory;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  capaciteMax: number;
  capaciteWaitlist: number;
  reservationApprovalRequired?: boolean;
  prix: number;
  dureeMinutes: number;
  published?: boolean;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'FAILED'
  | 'REFUNDED';

export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type PromotionScope = 'GLOBAL' | 'EVENTS';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_CONFIRMED'
  | 'WAITLIST_JOINED'
  | 'WAITLIST_PROMOTED'
  | 'WAITLIST_OFFER_EXPIRED'
  | 'REFUND_PROCESSED'
  | 'EVENT_REMINDER'
  | 'EVENT_POSTPONED'
  | 'EVENT_CANCELLED'
  | 'EVENT_STARTED'
  | 'EVENT_COMPLETED'
  | 'ATTENDANCE_RECORDED'
  | 'FEEDBACK_REQUESTED';

export type CancellationPolicyTier =
  | 'FREE_CANCEL'
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'NO_REFUND'
  | 'CLOSED';

export interface EventResponseDTO {
  id: number;
  titre: string;
  description: string;
  categorie: EventCategory;
  statut: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  dateDebut: string;
  dateFin: string;
  lieu: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  hasMapLocation?: boolean;
  capaciteMax: number;
  capaciteWaitlist: number;
  reservationApprovalRequired?: boolean;
  prix: number;
  dureeMinutes: number;
  published?: boolean;
  publishedAt?: string;
  sourceEventId?: number;
  recurrenceFrequency?: RecurrenceFrequency;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string;
  primaryImageUrl?: string;
  galleryImageUrls?: string[];
  imageCount?: number;
  organizerId: number;
  organizerNom: string;
  organizerEmail: string;
  participantsCount: number;
  waitlistCount: number;
  availableSeats: number;
  isFullyBooked: boolean;
  isAlmostFull?: boolean;
  occupancyRate?: number;
  favoriteCount?: number;
  averageRating?: number;
  feedbackCount?: number;
  dateCreation: string;
  dateModification: string;
  images?: EventImageDTO[];
  feedbackEntries?: EventFeedbackDTO[];
}

export interface EventDuplicateRequestDTO {
  frequency: RecurrenceFrequency;
  occurrences: number;
  publishCopies?: boolean;
}

export interface ReservationCancellationPolicyDTO {
  tier: CancellationPolicyTier;
  title: string;
  description: string;
  canCancel: boolean;
  eligibleRefundAmount: number;
  eligibleRefundPercentage: number;
  fullRefundDeadline?: string;
  partialRefundDeadline?: string;
}

export interface EventLocationSelection {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string | null;
}

export interface ReservationRequestDTO {
  utilisateurId?: number;
  eventId: number;
  nombreParticipants: number;
  remarques?: string;
  promoCode?: string;
}

export interface ReservationFeedbackRequestDTO {
  rating: number;
  comment?: string;
}

export interface ReservationResponseDTO {
  id: number;
  utilisateurId: number;
  utilisateurNom: string;
  utilisateurEmail: string;
  eventId: number;
  eventTitre: string;
  eventDateDebut: string;
  eventDateFin: string;
  eventLieu: string;
  statut: ReservationStatus;
  statusDescription?: string;
  nextStepMessage?: string;
  nombreParticipants: number;
  basePriceTotal?: number;
  discountAmount?: number;
  promoCode?: string;
  discountLabel?: string;
  discountAutoApplied?: boolean;
  prixTotal: number;
  estEnAttente: boolean;
  statutPaiement: PaymentStatus;
  remarques?: string;
  dateCreation: string;
  dateModification: string;
  datePaiement?: string;
  transactionId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceHostedUrl?: string;
  invoicePdfUrl?: string;
  refundAmount?: number;
  refundPercentage?: number;
  netPaidAmount?: number;
  cancelledAt?: string;
  refundedAt?: string;
  cancellationReason?: string;
  waitlistOfferedAt?: string;
  waitlistOfferExpiresAt?: string;
  waitlistOfferActive?: boolean;
  receiptAvailable?: boolean;
  cancellationPolicy?: ReservationCancellationPolicyDTO;
  calendarExportAvailable?: boolean;
  googleCalendarUrl?: string;
  calendarIcsDownloadUrl?: string;
  calendarIcsFileName?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: string;
  feedbackEligible?: boolean;
}

export interface StripeCheckoutSessionResponseDTO {
  sessionId: string;
  checkoutUrl: string;
}

export interface StripeSessionSyncRequestDTO {
  sessionId: string;
}

export interface UserReservationStatsDTO {
  totalReservations: number;
  upcomingBookings: number;
  eventsAttended: number;
  totalSpent: number;
  favoriteEventCategory: string;
  billedReservations: number;
  waitlistReservations: number;
}

export interface PromotionOfferResponseDTO {
  id: number;
  name: string;
  code?: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minimumSubtotal?: number;
  minimumParticipants?: number;
  autoApply: boolean;
  discoverable: boolean;
  active: boolean;
  currentlyAvailable: boolean;
  maxRedemptions?: number;
  usageCount?: number;
  remainingRedemptions?: number;
  startsAt?: string;
  endsAt?: string;
  dateCreation?: string;
  dateModification?: string;
  appliesToAllEvents?: boolean;
  scope?: PromotionScope;
  eventIds?: number[];
  targetedEvents?: PromotionTargetEventSummaryDTO[];
}

export interface PromotionTargetEventSummaryDTO {
  id: number;
  titre: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
}

export interface PromotionOfferRequestDTO {
  name: string;
  code?: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minimumSubtotal?: number;
  minimumParticipants?: number;
  autoApply: boolean;
  discoverable: boolean;
  active: boolean;
  maxRedemptions?: number;
  startsAt?: string;
  endsAt?: string;
  appliesToAllEvents: boolean;
  scope?: PromotionScope;
  eventIds?: number[];
}

export interface PromotionPreviewDTO {
  eventId: number;
  numberOfParticipants: number;
  unitPrice: number;
  basePriceTotal: number;
  discountAmount: number;
  totalPrice: number;
  discountApplied: boolean;
  autoApplied: boolean;
  invalidPromoCode: boolean;
  promoCode?: string;
  promotionName?: string;
  discountLabel?: string;
  validationMessage?: string;
}

export interface UserNotificationResponseDTO {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  reservationId?: number;
  eventId?: number;
  actionLabel?: string;
  actionUrl?: string;
}

export type Event = EventResponseDTO;
export type EventReservation = ReservationResponseDTO;

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
}
