import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Matches ParentLibraryApi.java (2026-09-05, textbook PDF library feature) - browse the whole
// catalog, link/unlink the parent's own Subject rows, download a linked document. See
// QuizLibraryDocument in QuizLibraryApi.ts for the document shape.
export class QuizParentLibraryApi {
    static browse(grade?: number, subjectName?: string, curriculum?: string) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/library`, {
            params: { grade, subjectName, curriculum }
        });
    }

    static listLinks(subjectId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/subjects/${subjectId}/library-links`);
    }

    static link(subjectId: number, documentId: number) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/subjects/${subjectId}/library-links/${documentId}`, {});
    }

    static unlink(subjectId: number, documentId: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/subjects/${subjectId}/library-links/${documentId}`);
    }

    // responseType 'blob' - same reasoning as QuizLessonApi.getImage: the download endpoint needs
    // an Authorization header, so it cannot be used directly as an <img>/<a> src.
    static downloadFile(subjectId: number, documentId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/subjects/${subjectId}/library-links/${documentId}/file`, { responseType: 'blob' });
    }
}
