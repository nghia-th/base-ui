import { IBlocUI } from "../../base/IBlocUI";
import { QuizLibraryApi, QuizLibraryDocument, quizUploadLibraryDocument } from "../../api/QuizLibraryApi";

// Bloc for the Admin "Textbook library" page (/app/admin/library, 2026-09-05) - list/upload/
// delete PDF textbooks via /api/admin/library (AdminLibraryApi.java). Same "content" bloc /
// uncontrolled-form shape as BlocAdminAdmins.ts (grade/subjectName/curriculum/volume/title live
// under the 'req' object key, same setStream(field, value, 'req') convention). The PDF File
// itself is NOT put into bloc state (it is transient UI-only state, same reasoning as
// Subjects.tsx's onImageFileSelected keeping the picked File in a local variable rather than a
// bloc field) - the page passes it directly into upload() at save time.
export class BlocAdminLibrary extends IBlocUI {
    reload() {
        this.apiRequest(QuizLibraryApi.list(), (res) => {
            this.setStream('documents', res.data as QuizLibraryDocument[])
        })
    }

    // Not routed through apiRequest/QuizRequestBase since quizUploadLibraryDocument calls QUIZ_API
    // directly for multipart/form-data (see its own comment) - same manual code===100 check as
    // BlocParentSubjects.uploadLessonImage.
    async upload(file: File, onComplete: () => void, onError: (error: any) => void) {
        const req = this.getField('req') ?? {}
        if (!req.grade || !req.subjectName || !req.curriculum || !file) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        try {
            const res = await quizUploadLibraryDocument(
                Number(req.grade), req.subjectName, req.curriculum, file, req.volume || undefined, req.title || undefined
            )
            this.setStream('submitting', false)
            if (res.code === 100) {
                onComplete()
                this.reload()
            } else {
                onError(res)
            }
        } catch (e) {
            this.setStream('submitting', false)
            onError(e)
        }
    }

    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.remove(id), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    openNew() {
        this.setField('req', { grade: '', subjectName: '', curriculum: '', volume: '', title: '' })
        this.setStream('form_view', { isShow: true })
    }

    closeForm() {
        this.setStream('form_view', { isShow: false })
        this.setStream('submitting', false)
    }

    // Opens the PDF in a new browser tab (native PDF viewer) rather than forcing a save-to-disk -
    // backend already sends Content-Disposition: inline for this endpoint, but that header only
    // matters for a real navigation, not a blob already fetched via axios, so the frontend must
    // choose "view" vs "download" behavior itself (see downloadFile below for the save variant).
    // The object URL is intentionally left un-revoked - it is only reachable from the new tab, and
    // is reclaimed when that tab is closed or the page is refreshed.
    view(id: number, onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.file(id), (res: any) => {
            const blob: Blob = res.data
            window.open(URL.createObjectURL(blob), '_blank')
        }, { onError })
    }

    // Forces a save-to-disk via a temporary <a download> element - same pattern as
    // BlocParentQuestions.downloadTemplate.
    downloadFile(id: number, filename: string, onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.file(id), (res: any) => {
            const blob: Blob = res.data
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        }, { onError })
    }
}
