import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
import { QUIZ_ADMIN_PREFIX } from "../base/PrefixService";

// Matches LibraryDocumentFileResponse.java (2026-09-06 revision - "thu vien mon hoc" mo rong, xem
// claude/subject-import-feature... va yeu cau moi: "cho phep tao muon hoc khong thuoc lop nao,
// tai lieu la 1 file hoac nhieu slide bai giang"). 1 LibraryDocument gio co the co NHIEU file
// (truoc day chi 1 PDF duy nhat, field fileSize/hasFile nam thang tren LibraryDocument) - moi file
// la 1 dong rieng o day, giu nguyen originalName de phan biet cac file voi nhau tren UI.
export interface QuizLibraryDocumentFile {
    id: number;
    originalName: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
}

// Matches AdminLibraryApi.java / LibraryDocumentResponse.java. grade/curriculum la fixed dropdown
// (1-12 / danh sach Curriculum do Admin quan ly) nhung backend van validate lai (QUIZ_032
// LIBRARY_INVALID_TAXONOMY) - CA HAI GIO CO THE null (2026-09-06 revision) khi document la 1 "mon
// hoc" (VD: "Lap trinh Python") khong thuoc Lop/Khoi nao, khong phai sach giao khoa theo Khoi.
export interface QuizLibraryDocument {
    id: number;
    grade: number | null;
    subjectName: string;
    curriculum: string | null;
    volume?: string;
    title: string;
    // Danh sach file dinh kem (0..N) - hasFile suy ra tu files.length > 0 (khop
    // LibraryDocumentResponse.java's hasFile, van la field rieng cho tien dung tren UI thay vi
    // phai check files.length moi noi).
    files: QuizLibraryDocumentFile[];
    hasFile: boolean;
    createdAt: string;
}

// Matches LibraryDocumentCreateRequest.java (2026-09-06) - tao truoc metadata, file(s) them sau
// qua addFile - khong con nhan file ngay luc tao nua (khac model cu 1-document-1-file).
export interface QuizLibraryCreateRequest {
    grade?: number;
    subjectName: string;
    curriculum?: string;
    volume?: string;
    title?: string;
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

    // JSON body, khong con file - "them file" gio la addFile ben duoi, tach rieng khoi tao
    // metadata (2026-09-06 revision, xem LibraryDocumentCreateRequest.java's javadoc).
    static create(request: QuizLibraryCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_ADMIN_PREFIX}/library`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_ADMIN_PREFIX}/library/${id}`);
    }

    static removeFile(documentId: number, fileId: number) {
        return QuizRequestBase.delete(`${QUIZ_ADMIN_PREFIX}/library/${documentId}/files/${fileId}`);
    }

    // responseType 'blob' - same reasoning as QuizLessonApi.getImage (used for both view-in-new-tab
    // and forced download, see BlocAdminLibrary.ts). documentId + fileId (2026-09-06 revision) -
    // 1 document co the co nhieu file, khong con GET /{id}/file duy nhat nua.
    static file(documentId: number, fileId: number) {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/library/${documentId}/files/${fileId}`, { responseType: 'blob' });
    }

    // responseType:'blob' - same reasoning/shape as QuizQuestionApi.downloadTemplate.
    static importTemplate(format: 'xlsx' | 'csv') {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/library/import-template`, { params: { format }, responseType: 'blob' });
    }
}

// Import Excel/CSV (multipart/form-data) - same "call QUIZ_API directly, override Content-Type to
// undefined" workaround as quizAddLibraryFile below / QuizQuestionApi.quizImportQuestions (see
// that function's comment for the full axios FormData->JSON bug explanation). No fixed FK param
// (unlike quizImportQuestions' lessonId) - see LibraryImportService.java's javadoc.
export async function quizImportLibraryDocuments(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_ADMIN_PREFIX}/library/import`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}

// Adds a lecture/document file to a LibraryDocument - NEVER replaces an existing one (2026-09-06
// revision, replaces the old quizAttachLibraryFile "attach/replace single PDF" behaviour). A
// document may now hold any number of files (PDF or PowerPoint). Same multipart workaround as
// quizImportLibraryDocuments above.
export async function quizAddLibraryFile(documentId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_ADMIN_PREFIX}/library/${documentId}/files`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
