import type { Flashcard } from "@/types/api/flashcard";
import type { MediaDetail, MediaMindMap, Transcript } from "@/types/api/media";
import type { GradeRequestItem, GradeResponse, QuizQuestion } from "@/types/api/quiz";

import {
  getClassroomMedia,
  getClassroomMediaMindMap,
  getClassroomTranscript,
  gradeClassroomMediaQuiz,
  listClassroomMediaFlashcards,
  listClassroomMediaQuiz,
  regenerateClassroomMediaArtifacts,
} from "./classroomMedia";
import { getClassroomDownloadUrl } from "./classrooms";
import { getDownloadUrl } from "./content";
import {
  getMedia,
  getMediaMindMap,
  getTranscript,
  gradeMediaQuiz,
  listMediaFlashcards,
  listMediaQuiz,
  regenerateMediaArtifacts,
} from "./media";

/**
 * De onde a tela do áudio ou vídeo lê tudo: o material pessoal e o de uma turma têm os
 * mesmos recursos e os mesmos formatos, só o caminho muda. A tela recebe uma fonte pronta e
 * não sabe de qual dos dois se trata.
 */
export interface MediaSource {
  getMedia(signal?: AbortSignal): Promise<MediaDetail>;
  getTranscript(signal?: AbortSignal): Promise<Transcript>;
  /** A URL presignada do arquivo, que expira em 15 minutos (o player a renova). */
  getDownloadUrl(): Promise<string>;
  listQuiz(signal?: AbortSignal): Promise<QuizQuestion[]>;
  gradeQuiz(answers: GradeRequestItem[]): Promise<GradeResponse>;
  listFlashcards(signal?: AbortSignal): Promise<Flashcard[]>;
  getMindMap(signal?: AbortSignal): Promise<MediaMindMap>;
  /** Ausente quando quem olha não pode gerar de novo: a tela esconde o botão. */
  regenerate?: () => Promise<void>;
}

/** O áudio ou vídeo do próprio usuário. */
export function personalMediaSource(contentId: string): MediaSource {
  return {
    getMedia: (signal) => getMedia(contentId, signal),
    getTranscript: (signal) => getTranscript(contentId, signal),
    getDownloadUrl: async () => (await getDownloadUrl(contentId)).url,
    listQuiz: (signal) => listMediaQuiz(contentId, signal),
    gradeQuiz: (answers) => gradeMediaQuiz(contentId, answers),
    listFlashcards: (signal) => listMediaFlashcards(contentId, signal),
    getMindMap: (signal) => getMediaMindMap(contentId, signal),
    regenerate: () => regenerateMediaArtifacts(contentId),
  };
}

/**
 * O áudio ou vídeo de uma turma. `canRegenerate` é o papel de quem olha (dono ou editor): sem
 * ele a fonte não oferece `regenerate`. O servidor recusa com `403` de qualquer modo.
 */
export function classroomMediaSource(
  classroomId: string,
  folderId: string,
  contentId: string,
  canRegenerate: boolean,
): MediaSource {
  return {
    getMedia: (signal) => getClassroomMedia(classroomId, folderId, contentId, signal),
    getTranscript: (signal) => getClassroomTranscript(classroomId, folderId, contentId, signal),
    getDownloadUrl: async () => (await getClassroomDownloadUrl(classroomId, folderId, contentId)).url,
    listQuiz: (signal) => listClassroomMediaQuiz(classroomId, folderId, contentId, signal),
    gradeQuiz: (answers) => gradeClassroomMediaQuiz(classroomId, folderId, contentId, answers),
    listFlashcards: (signal) => listClassroomMediaFlashcards(classroomId, folderId, contentId, signal),
    getMindMap: (signal) => getClassroomMediaMindMap(classroomId, folderId, contentId, signal),
    regenerate: canRegenerate
      ? () => regenerateClassroomMediaArtifacts(classroomId, folderId, contentId)
      : undefined,
  };
}
