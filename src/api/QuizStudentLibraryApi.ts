import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Matches StudentLibraryApi.java (2026-09-05, textbook PDF library feature) - read-only view of
// documents linked to a subject in the student's own classroom.
export class QuizStudentLibraryApi {
    static listLinks(subjectId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/subjects/${subjectId}/library-links`);
    }

    // responseType 'blob' - same reasoning as QuizStudentLessonApi.getImage. fileId (2026-09-06
    // revision) - a document can now hold more than one file.
    static downloadFile(subjectId: number, documentId: number, fileId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/subjects/${subjectId}/library-links/${documentId}/files/${fileId}`, { responseType: 'blob' });
    }
}
