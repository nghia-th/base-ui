import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi } from "../../api/QuizStudentAttemptApi";
import { QuizStudentLibraryApi } from "../../api/QuizStudentLibraryApi";
import { QuizSubjectLibraryLink } from "../../api/QuizLibraryApi";

export interface QuizStudentSubjectLite {
    id: number;
    name: string;
}

// Bloc for the Student "Textbook library" page (/app/student/library, 2026-09-05, "thu vien sach
// giao khoa" feature) - reuses the existing GET /api/student/subjects endpoint (same one
// BlocStudentTests.ts uses for its practice-test subject picker) to list the student's own
// classroom's subjects, then loads/downloads the documents linked to whichever subject the
// student expands (StudentLibraryApi.java - access is enforced server-side by classroom match,
// no extra check needed here).
export class BlocStudentLibrary extends IBlocUI {
    loadSubjects() {
        this.apiRequest(QuizStudentAttemptApi.listSubjects(), (res) => {
            this.setStream('subjects', res.data as QuizStudentSubjectLite[])
        })
    }

    loadLinks(subjectId: number) {
        this.apiRequest(QuizStudentLibraryApi.listLinks(subjectId), (res) => {
            this.setStream('links', res.data as QuizSubjectLibraryLink[])
        })
    }

    // res (the apiRequest onData param, from CallApi.ts's blob branch) has shape {data: Blob,
    // disposition: string}, same as BlocParentQuestions.downloadTemplate / the Parent library
    // download above.
    downloadFile(subjectId: number, documentId: number, defaultFilename: string, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLibraryApi.downloadFile(subjectId, documentId), (res: any) => {
            const blob: Blob = res.data
            const disposition: string | undefined = res.disposition
            const match = disposition?.match(/filename="?([^"]+)"?/)
            const filename = match?.[1] ?? defaultFilename
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        }, { onError })
    }

    // Opens the PDF in a new tab instead of forcing a save-to-disk - same endpoint as
    // downloadFile above, see BlocAdminLibrary.view's comment for why the frontend decides this.
    viewFile(subjectId: number, documentId: number, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLibraryApi.downloadFile(subjectId, documentId), (res: any) => {
            const blob: Blob = res.data
            window.open(URL.createObjectURL(blob), '_blank')
        }, { onError })
    }
}
