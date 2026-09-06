import { IBlocUI } from "../../base/IBlocUI";
import {
    QuizLibraryApi,
    QuizLibraryDocument,
    QuizLibraryImportResult,
    quizImportLibraryDocuments,
    quizAddLibraryFile
} from "../../api/QuizLibraryApi";
import { QuizCurriculumApi, QuizCurriculum } from "../../api/QuizCurriculumApi";

// Bloc for the Admin "Thu vien mon hoc" page (/app/admin/library, 2026-09-05, mo rong 2026-09-06)
// - list/create/delete document rows via /api/admin/library (AdminLibraryApi.java), moi file
// (PDF/PowerPoint) cua 1 document duoc quan ly rieng qua addFile/removeFile (2026-09-06 revision -
// "cho phep tao muon hoc khong thuoc lop nao, tai lieu la 1 file hoac nhieu slide bai giang" - 1
// document gio co the co NHIEU file, khong con upload kem file ngay luc tao). grade/subjectName/
// curriculum/volume/title van nam duoi 'req' object key (uncontrolled-form, giong BlocAdminAdmins.
// ts) - grade/curriculum gio co the de trong (khong chon) khi document la 1 "mon hoc" khong thuoc
// Khoi/Lop nao.
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

    // JSON create, khong con file kem theo (2026-09-06 revision) - grade/curriculum optional,
    // '' tren form nghia la "khong chon", chuyen thanh undefined truoc khi gui len backend.
    create(onComplete: () => void, onError: (error: any) => void) {
        const req = this.getField('req') ?? {}
        if (!req.subjectName) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const request = {
            grade: req.grade === '' || req.grade == null ? undefined : Number(req.grade),
            subjectName: req.subjectName,
            curriculum: req.curriculum || undefined,
            volume: req.volume || undefined,
            title: req.title || undefined
        }
        this.apiRequest(QuizLibraryApi.create(request), () => {
            this.setStream('submitting', false)
            onComplete()
            this.reload()
        }, { onError: (error) => { this.setStream('submitting', false); onError(error) } })
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

    // Opens a file in a new browser tab (native viewer) rather than forcing a save-to-disk -
    // backend already sends Content-Disposition: inline for this endpoint, but that header only
    // matters for a real navigation, not a blob already fetched via axios, so the frontend must
    // choose "view" vs "download" behavior itself (see downloadFile below for the save variant).
    // The object URL is intentionally left un-revoked - it is only reachable from the new tab, and
    // is reclaimed when that tab is closed or the page is refreshed.
    view(documentId: number, fileId: number, onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.file(documentId, fileId), (res: any) => {
            const blob: Blob = res.data
            window.open(URL.createObjectURL(blob), '_blank')
        }, { onError })
    }

    // Forces a save-to-disk via a temporary <a download> element - same pattern as
    // BlocParentQuestions.downloadTemplate.
    downloadFile(documentId: number, fileId: number, filename: string, onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.file(documentId, fileId), (res: any) => {
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
    // manual code===100 check, same shape as create() above.
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

    // --- Manage a document's files (2026-09-06 revision) - "manage files" dialog opened per
    // document from admin/Library.tsx; that dialog reads the current file list straight out of
    // the 'documents' stream (find-by-id) rather than a dedicated stream, since reload() below
    // already refreshes 'documents' (with its nested files) after every add/remove.

    async addFile(documentId: number, file: File, onComplete: () => void, onError: (error: any) => void) {
        this.setStream('addingFile', true)
        try {
            const res = await quizAddLibraryFile(documentId, file)
            this.setStream('addingFile', false)
            if (res.code === 100) {
                onComplete()
                this.reload()
            } else {
                onError(res)
            }
        } catch (e) {
            this.setStream('addingFile', false)
            onError(e)
        }
    }

    removeFile(documentId: number, fileId: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLibraryApi.removeFile(documentId, fileId), () => {
            onComplete()
            this.reload()
        }, { onError })
    }
}
