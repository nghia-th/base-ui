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
    // 2026-09-05 (item 1 of the 11-item batch request) - false for a row created via bulk import
    // before its PDF is attached (see quizAttachLibraryFile below). Matches
    // LibraryDocumentResponse.java's hasFile field.
    hasFile: boolean;
    createdAt: string;
}

// Matches ImportRowError.java / LibraryImportResponse.java.
export interface QuizLibraryImportRowError {
    rowNumber: number;
    reason: string;
}

export interface QuizLibraryImportResult {
    totalRows: number;
    successCount: number;
    errors: QuizLibraryImportRowError[];
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

    // responseType:'blob' - same reasoning/shape as QuizQuestionApi.downloadTemplate.
    static importTemplate(format: 'xlsx' | 'csv') {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/library/import-template`, { params: { format }, responseType: 'blob' });
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

// Import Excel/CSV (multipart/form-data) - same "call QUIZ_API directly, override Content-Type to
// undefined" workaround as quizUploadLibraryDocument above / QuizQuestionApi.quizImportQuestions
// (see that function's comment for the full axios FormData->JSON bug explanation). No fixed FK
// param (unlike quizImportQuestions' lessonId) - see LibraryImportService.java's javadoc.
export async function quizImportLibraryDocuments(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_ADMIN_PREFIX}/library/import`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}

// Attaches (or replaces) a library document's PDF - the second half of "import metadata now,
// upload the file later" (see LibraryService#attachFile's javadoc). Same multipart workaround as
// the two upload functions above.
export async function quizAttachLibraryFile(id: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.put(`${QUIZ_ADMIN_PREFIX}/library/${id}/file`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
