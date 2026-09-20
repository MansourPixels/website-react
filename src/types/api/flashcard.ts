export interface Flashcard {
  id: string;
  position: number;
  front: string;
  back: string;
  /** O segundo do áudio a que o cartão se refere; só nos cartões de um áudio. */
  startSeconds?: number | null;
}
