import { IBlocUI } from "../../base/IBlocUI";
import {
    QuizLibraryApi,
    QuizLibraryDocument,
    QuizLibraryImportResult,
    quizUploadLibraryDocument,
    quizImportLibraryDocuments,
    quizAttachLibraryFile
} from "../../api/QuizLibraryApi";
import { QuizCurriculumApi, QuizCurriculum } from "../../api/QuizCurriculumApi";

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

    // 2026-09-05 - Curriculum ('bo sach') is now an Admin-managed list (CurriculumService.java)
    // instead of a hardcoded 3-value array - loaded once here to populate the upload form's
    // dropdown (see admin/Library.tsx), same 'content bloc extra stream' shape as
    // BlocParentSubjects.ts's 'library_links'/'library_catalog' streams.
    loadCurricula() {
        this.apiRequest(QuizCurriculumApi.list(), (res) => {
            this.setStream('curricula', res.data as QuizCurriculum[])
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

    // --- Bulk import dialog (2026-09-05, item 1 of the 11-item batch request) - same
    // open/close/download/run shape as BlocParentQuestions.ts's import dialog methods.

    downloadImportTemplate(format: 'xlsx' | 'csv', onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.importTemplate(format), (res: any) => {
            const blob: Blob = res.data
            const disposition: string | undefined = res.disposition
            const match = disposition?.match(/filename="?([^"]+)"?/)
            const filename = match?.[1] ?? `library-import-template.${format}`
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        }, { onError })
    }

    openImport() {
        this.setStream('importResult', null)
        this.setStream('import_view', { isShow: true })
    }

    closeImport() {
        this.setStream('import_view', { isShow: false })
        this.setStream('importing', false)
        this.setStream('importResult', null)
    }

    // Not routed through apiRequest (multipart, see quizImportLibraryDocuments's own comment) -
    // manual code===100 check, same shape as upload() above.
    async importFile(file: File, onComplete: (result: QuizLibraryImportResult) => void, onError: (error: any) => void) {
        try {
            const res = await quizImportLibraryDocuments(file)
            if (res.code === 100) {
                onComplete(res.data as QuizLibraryImportResult)
                this.reload()
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }

    runImport(file: File, onError: (error: any) => void) {
        this.setStream('importing', true)
        this.importFile(file, (result) => {
            this.setStream('importing', false)
            this.setStream('importResult', result)
        }, (error) => { this.setStream('importing', false); onError(error) })
    }

    // --- Attach PDF to a metadata-only row created via import (row.hasFile === false) - also
    // usable as a general "replace the PDF" action, see LibraryService#attachFile's javadoc.
    async attachFile(id: number, file: File, onComplete: () => void, onError: (error: any) => void) {
        this.setStream('attaching', id)
        try {
            const res = await quizAttachLibraryFile(id, file)
            this.setStream('attaching', null)
            if (res.code === 100) {
                onComplete()
                this.reload()
            } else {
                onError(res)
            }
        } catch (e) {
            this.setStream('attaching', null)
            onError(e)
        }
    }
}
