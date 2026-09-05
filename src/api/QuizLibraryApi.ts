import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
import { QUIZ_ADMIN_PREFIX } from "../base/PrefixService";

// Matches AdminLibraryApi.java (2026-09-05, textbook PDF library feature). grade is a fixed 1-12
// dropdown and curriculum is a fixed 3-value list on the UI side; the backend re-validates both
// anyway (QUIZ_032 LIBRARY_INVALID_TAXONOMY).
export interface QuizLibraryDocument {
    id: number;
    grade: number;
    subjectName: string;
    curriculum: string;
    volume?: string;
    title: string;
    fileSize: number;
    createdAt: string;
}

// Matches SubjectLibraryLinkResponse.java - one row of "documents linked to this subject",
// used by both Parent and Student link-listing endpoints.
export interface QuizSubjectLibraryLink {
    id: number;
    subjectId: number;
    document: QuizLibraryDocument;
    linkedAt: string;
}

export class QuizLibraryApi {
    static list(grade?: number, subjectName?: string, curriculum?: string) {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/library`, {
            params: { grade, subjectName, curriculum }
        });
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_ADMIN_PREFIX}/library/${id}`);
    }

    // responseType 'blob' - same reasoning as QuizLessonApi.getImage (used for both view-in-new-tab
    // and forced download, see BlocAdminLibrary.ts).
    static file(id: number) {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/library/${id}/file`, { responseType: 'blob' });
    }
}

// Multipart upload - called directly through QUIZ_API rather than QuizRequestBase, same reasoning
// as quizUploadLessonImage in QuizLessonApi.ts: QUIZ_API defaults to Content-Type: application/
// json, so it must be overridden to undefined here so axios does not convert the FormData into
// JSON (never hardcode 'multipart/form-data' either - it would be missing its boundary).
export async function quizUploadLibraryDocument(
    grade: number,
    subjectName: string,
    curriculum: string,
    file: File,
    volume?: string,
    title?: string
) {
    const formData = new FormData();
    formData.append('grade', String(grade));
    formData.append('subjectName', subjectName);
    formData.append('curriculum', curriculum);
    if (volume) formData.append('volume', volume);
    if (title) formData.append('title', title);
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_ADMIN_PREFIX}/library`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
