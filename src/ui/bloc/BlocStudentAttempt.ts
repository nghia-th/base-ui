import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi, quizUploadSpeakingAnswer } from "../../api/QuizStudentAttemptApi";
import { QuizStudentLessonApi } from "../../api/QuizStudentLessonApi";

// Khớp StudentChoiceResponse.java - CỐ Ý không có field "correct" (khác ChoiceResponse.java bên
// Phụ huynh, task 4) - học sinh không được biết đáp án đúng trước khi nộp bài.
export interface QuizStudentChoice {
    choiceId: number;
    content: string;
}

// Khớp StudentQuestionResponse.java. lessonId thêm 2026-09-01 để "xem lại bài học" (nút mở
// QuizStudentLesson của đúng bài chứa câu hỏi này, xem TakeTest.tsx). hasAudio/content (thêm
// 2026-09-01, tính năng "Câu hỏi dạng âm thanh") - content có thể là null: backend TỰ ẩn content
// (không phải FE ẩn) khi câu hỏi có audio VÀ Phụ huynh chọn "ẩn nội dung khi làm bài" cho câu đó -
// xem StudentQuestionResponse.java's javadoc, KHÔNG được tự suy ra/hiện lại content ở FE trong
// trường hợp null (server đã cố tình không gửi).
export interface QuizStudentQuestion {
    questionId: number;
    lessonId: number;
    content: string | null;
    hasAudio: boolean;
    choices: QuizStudentChoice[];
    // Thêm 2026-09-01, tính năng "Câu hỏi dạng tự luận/thu âm" - SPEAKING thì choices luôn rỗng
    // (không có đáp án đúng/sai để chọn), xem TakeTest.tsx nhánh hiện nút ghi âm thay vì RadioGroup.
    questionType: 'MULTIPLE_CHOICE' | 'SPEAKING';
    // answerMode/answerText thêm 2026-09-01 (theo góp ý anh: cho phép trả lời tự luận gõ chữ, không
    // chỉ ghi âm) - answerMode quyết định TakeTest.tsx hiện nút ghi âm/ô gõ chữ/cả 2 cho câu SPEAKING
    // này; chỉ có ý nghĩa khi questionType là SPEAKING. answerText là câu trả lời gõ chữ ĐÃ LƯU TỪ
    // TRƯỚC (nếu có) - gửi kèm ngay trong response start() để hỗ trợ "làm dở quay lại" mà không cần
    // gọi API riêng như audio (xem BlocStudentAttempt's phần init 'speakingTextAnswers' bên dưới).
    answerMode: 'AUDIO' | 'TEXT' | 'BOTH';
    answerText: string | null;
}

// Khớp StudentLessonResponse.java (task "Backend: Student xem lai noi dung bai hoc", 2026-09-01).
export interface QuizStudentLesson {
    id: number;
    name: string;
    summary?: string;
    content?: string;
    textbookPage?: number;
    hasImage: boolean;
}

// Khớp SubmitAttemptResponse.java.
export interface QuizSubmitResult {
    attemptId: number;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
}

// Bloc trang "Làm bài" (khu vực Học sinh, /app/student/tests/:testId/take - Task 6 backend, luồng
// bắt đầu/lưu đáp án/nộp bài).
//
// ĐÃ ĐỔI 2026-09-01 (xem claude/ui-base-status.md "Quy ước state mới"): trước đây cố ý dùng
// useState cục bộ ở TakeTest.tsx (attemptId/questions/answers) với lý do "luồng tuyến tính theo 1
// component, không cần re-render từ nhiều nơi khác nhau" - nhưng để THỐNG NHẤT 1 cách quản lý
// state duy nhất trong toàn app (không còn ngoại lệ), toàn bộ dời vào đây qua setStream, cùng
// pattern mọi Bloc khác.
export class BlocStudentAttempt extends IBlocUI {
    // Session ghi âm đang chạy (nếu có) - field nội bộ thuần (không phải stream, TakeTest.tsx không
    // cần đọc trực tiếp mấy field này) - chỉ 'recordingQuestionId' bên dưới mới là stream cho UI.
    private mediaRecorder?: MediaRecorder
    private mediaStream?: MediaStream
    private recordedChunks: Blob[] = []

    startAttempt(testId: number, onError: (error: any) => void) {
        this.setStream('questions', null)
        this.setStream('result', null)
        this.setStream('answers', {})
        this.setStream('speakingAudioUrls', {})
        this.setStream('speakingLoadingIds', {})
        this.setStream('recordingQuestionId', null)
        this.setStream('speakingTextAnswers', {})
        this.start(testId, (attemptId, questions) => {
            this.setStream('attemptId', attemptId)
            this.setStream('questions', questions)
            // Prefetch âm thầm (không loading spinner, không báo lỗi) câu trả lời ĐÃ ghi âm từ trước
            // của mọi câu SPEAKING - phục vụ "làm dở quay lại" (resume): học sinh thấy ngay đáp án cũ
            // thay vì phải bấm mới biết đã trả lời hay chưa. 404 "chưa ghi âm" là trạng thái bình
            // thường ở đây, không phải lỗi - im lặng bỏ qua (xem loadSpeakingAnswer's tham số silent).
            questions.filter((q) => q.questionType === 'SPEAKING').forEach((q) => {
                this.loadSpeakingAnswer(attemptId, q.questionId, () => {}, true)
            })
            // Câu trả lời gõ chữ (tự luận) ĐÃ LƯU TỪ TRƯỚC được gửi kèm ngay trong response start()
            // (answerText, xem QuizStudentQuestion's comment) - KHÔNG cần prefetch riêng như audio,
            // chỉ cần đổ thẳng vào map ở đây để TakeTest.tsx hiện lại ngay khi mở lại đề.
            const initialTextAnswers: Record<number, string> = {}
            questions.filter((q) => q.questionType === 'SPEAKING' && q.answerText).forEach((q) => {
                initialTextAnswers[q.questionId] = q.answerText as string
            })
            this.setStream('speakingTextAnswers', initialTextAnswers)
        }, onError)
    }

    start(testId: number, onComplete: (attemptId: number, questions: QuizStudentQuestion[]) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.start(testId), (res) => {
            onComplete(res.data.attemptId, res.data.questions as QuizStudentQuestion[])
        }, { onError })
    }

    chooseAnswer(questionId: number, choiceId: number, onError: (error: any) => void) {
        const attemptId = this.getField('attemptId')
        const answers = { ...(this.getField('answers') ?? {}), [questionId]: choiceId }
        this.setStream('answers', answers)
        if (attemptId != null) this.saveAnswer(attemptId, questionId, choiceId, onError)
    }

    doSubmit(onError: (error: any) => void) {
        const attemptId = this.getField('attemptId')
        if (attemptId == null) return
        const questions: QuizStudentQuestion[] = this.getField('questions') ?? []
        const answers = this.getField('answers') ?? {}
        const speakingUrls = this.getField('speakingAudioUrls') ?? {}
        const speakingTexts: Record<number, string> = this.getField('speakingTextAnswers') ?? {}
        // Gộp cả 2 loại câu hỏi khi tính "đã trả lời" cho lời nhắc xác nhận nộp bài - cùng lý do như
        // TakeTest.tsx's answeredCount ở Card đầu trang (xem comment ở đó): 'answers' chỉ chứa câu
        // MULTIPLE_CHOICE, câu SPEAKING coi là đã trả lời khi đã có bản ghi âm HOẶC đã gõ chữ (không
        // phân biệt answerMode ở đây - có 1 trong 2 là đủ, xem AnswerMode.java's javadoc).
        const answeredCount = questions.filter((q) => q.questionType === 'SPEAKING'
            ? (speakingUrls[q.questionId] != null || !!speakingTexts[q.questionId]?.trim())
            : answers[q.questionId] != null).length
        this.confirm({
            title: 'quiz-submit-test',
            message: answeredCount < questions.length ? 'quiz-submit-test-confirm-incomplete' : 'quiz-submit-test-confirm',
            onYes: () => {
                this.setStream('submitting', true)
                this.submit(attemptId, (res) => {
                    this.setStream('submitting', false)
                    this.setStream('result', res)
                }, (error: any) => { this.setStream('submitting', false); onError(error) })
            }
        })
    }

    // "Xem lại bài học" Dialog - dùng chung 1 bộ stream cho cả lúc làm bài lẫn sau khi nộp (xem
    // comment ở TakeTest.tsx). lessonImageUrl là 1 object URL tải riêng, phải revoke khi đóng/đổi -
    // giống hệt pattern BlocParentSubjects.ts's lessonImagePreviewUrl phía Phụ huynh.
    openLessonDialog(lessonId: number, onError: (error: any) => void) {
        this.setStream('lesson_dialog_view', { isShow: true })
        this.setStream('lessonLoading', true)
        this.setStream('lessonData', null)
        this.loadLesson(lessonId, (lesson) => {
            this.setStream('lessonLoading', false)
            this.setStream('lessonData', lesson)
            if (lesson.hasImage) {
                this.loadLessonImage(lessonId, (blob) => {
                    const old = this.getField('lessonImageUrl')
                    if (old) URL.revokeObjectURL(old)
                    this.setStream('lessonImageUrl', URL.createObjectURL(blob))
                }, () => {})
            }
        }, (error) => {
            this.setStream('lessonLoading', false)
            this.setStream('lesson_dialog_view', { isShow: false })
            onError(error)
        })
    }

    closeLessonDialog() {
        this.setStream('lesson_dialog_view', { isShow: false })
        this.setStream('lessonData', null)
        const old = this.getField('lessonImageUrl')
        if (old) URL.revokeObjectURL(old)
        this.setStream('lessonImageUrl', null)
    }

    // Nghe audio câu hỏi (2026-09-01, "Câu hỏi dạng âm thanh") - cache theo questionId trong 1 map
    // {questionId: url}, KHÔNG tải lại nếu đã có (không giới hạn số lần bấm nghe lại - phát lại
    // trực tiếp qua thẻ <audio controls> của trình duyệt một khi đã có url, xem TakeTest.tsx) và
    // KHÔNG revoke url của câu khác khi tải câu mới - khác BlocParentSubjects.loadLessonImagePreview
    // (chỉ 1 ảnh hiện tại 1 lúc trong Dialog), ở đây nhiều câu hỏi audio có thể cùng hiện trên 1
    // trang nên mỗi câu giữ url riêng suốt vòng đời trang TakeTest.
    loadQuestionAudio(questionId: number, onError: (error: any) => void) {
        const urls = this.getField('audioUrls') ?? {}
        if (urls[questionId]) return
        this.setStream('audioLoadingIds', { ...(this.getField('audioLoadingIds') ?? {}), [questionId]: true })
        this.apiRequest(QuizStudentAttemptApi.getQuestionAudio(questionId), (res: any) => {
            const nextUrls = { ...(this.getField('audioUrls') ?? {}), [questionId]: URL.createObjectURL(res.data as Blob) }
            this.setStream('audioUrls', nextUrls)
            this.setStream('audioLoadingIds', { ...(this.getField('audioLoadingIds') ?? {}), [questionId]: false })
        }, {
            onError: (error: any) => {
                this.setStream('audioLoadingIds', { ...(this.getField('audioLoadingIds') ?? {}), [questionId]: false })
                onError(error)
            }
        })
    }

    // Lưu ngay khi học sinh chọn 1 đáp án (progressive save, đúng như API cho phép gọi lặp lại
    // nhiều lần trước khi nộp - xem AnswerRequest.java) - không hiện loading spinner cho thao tác
    // nền này, tránh giật màn hình mỗi lần bấm chọn đáp án.
    saveAnswer(attemptId: number, questionId: number, choiceId: number, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.saveAnswers(attemptId, [{ questionId, choiceId }]), () => {}, { onError, isShowLoading: false })
    }

    submit(attemptId: number, onComplete: (result: QuizSubmitResult) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.submit(attemptId), (res) => {
            onComplete(res.data as QuizSubmitResult)
        }, { onError })
    }

    // "Xem lại bài học" (task 2026-09-01) - gọi khi học sinh bấm mở panel nội dung 1 câu hỏi, cả
    // lúc đang làm bài lẫn sau khi đã nộp (cùng 1 màn hình TakeTest.tsx, xem file đó). Không cache
    // gì ở Bloc - TakeTest.tsx tự giữ state theo questionId đang mở, load lại mỗi lần mở khác câu.
    loadLesson(lessonId: number, onComplete: (lesson: QuizStudentLesson) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLessonApi.get(lessonId), (res) => {
            onComplete(res.data as QuizStudentLesson)
        }, { onError })
    }

    // responseType:'blob' -> CallApi.ts's nhánh blob trả {data,disposition} - xem
    // BlocParentSubjects.loadLessonImage cho pattern gốc (phía Phụ huynh).
    loadLessonImage(lessonId: number, onData: (blob: Blob) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLessonApi.getImage(lessonId), (res: any) => {
            onData(res.data as Blob)
        }, { onError })
    }

    // ==================== Câu hỏi dạng tự luận/thu âm (2026-09-01) ====================
    // Quyết định đã chốt qua AskUserQuestion (xem claude/ đoạn ghi lại): chỉ ghi âm giọng nói (không
    // gõ chữ), KHÔNG tính điểm (backend đã tự loại SPEAKING khỏi correctCount/totalQuestions), chỉ
    // được xoá-ghi-lại TRONG LÚC đang làm bài (khoá lại sau khi nộp - backend tự chặn bằng
    // ATTEMPT_ALREADY_SUBMITTED), không vào đề "Ôn tập kiến thức" (backend tự loại khi random).

    // Tải lại (hoặc lần đầu tải) câu trả lời đã ghi âm của 1 câu SPEAKING, cache theo questionId
    // trong 1 object URL - CÙNG PATTERN loadQuestionAudio ở trên, khác 1 điểm: silent=true (dùng khi
    // prefetch hàng loạt lúc mới start()) thì 404 "chưa ghi âm" bị nuốt êm, không gọi onError - đây
    // là trạng thái bình thường (học sinh chưa trả lời câu này), không phải lỗi cần báo.
    loadSpeakingAnswer(attemptId: number, questionId: number, onError: (error: any) => void, silent: boolean = false) {
        if ((this.getField('speakingAudioUrls') ?? {})[questionId]) return
        this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: true })
        this.apiRequest(QuizStudentAttemptApi.getSpeakingAnswer(attemptId, questionId), (res: any) => {
            this.setStream('speakingAudioUrls', { ...(this.getField('speakingAudioUrls') ?? {}), [questionId]: URL.createObjectURL(res.data as Blob) })
            this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
        }, {
            onError: (error: any) => {
                this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
                if (!silent) onError(error)
            },
            isShowLoading: false
        })
    }

    // Bắt đầu ghi âm - xin quyền micro (getUserMedia) rồi mở MediaRecorder. Chỉ 1 câu ghi âm cùng
    // lúc trên toàn trang (recordingQuestionId là stream duy nhất, TakeTest.tsx tự vô hiệu hoá nút
    // "Ghi âm" của các câu khác khi đang có 1 câu ghi dở). Ưu tiên mimeType webm/opus (Chrome/Edge/
    // Firefox tạo mặc định) - StudentAttemptService.ALLOWED_SPEAKING_ANSWER_TYPES đã được thêm
    // "audio/webm" riêng cho việc này (2026-09-01, xem service đó's comment).
    async startRecording(questionId: number, onError: (error: any) => void) {
        if (this.getField('recordingQuestionId') != null) return
        if (!navigator.mediaDevices?.getUserMedia) {
            onError({ messageKey: 'quiz-speaking-mic-not-supported', message: 'Recording is not supported on this browser' })
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
            const mimeType = typeof MediaRecorder !== 'undefined'
                ? candidates.find((type) => MediaRecorder.isTypeSupported?.(type))
                : undefined
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
            this.recordedChunks = []
            this.mediaStream = stream
            this.mediaRecorder = recorder
            recorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data) }
            recorder.start()
            this.setStream('recordingQuestionId', questionId)
        } catch (err) {
            onError({ messageKey: 'quiz-speaking-mic-permission-denied', message: 'Could not access the microphone' })
        }
    }

    // Dừng ghi âm - SỬA LỖI 2026-09-01 (anh báo bấm "Dừng ghi âm" không phản hồi): bản cũ chỉ đổi
    // UI (recordingQuestionId) BÊN TRONG callback 'onstop' của MediaRecorder - nếu recorder rơi vào
    // trạng thái không khớp (ví dụ 'inactive' vì lý do trình duyệt/thiết bị nào đó) thì
    // `recorder.stop()` ném lỗi NGAY LẬP TỨC, 'onstop' không bao giờ chạy, và nút vẫn kẹt ở trạng
    // thái "đang ghi" mãi mãi - không có try/catch nào bắt lỗi đó nên trông như nút không phản hồi
    // gì cả. Sửa bằng 2 việc: (1) dọn UI (`recordingQuestionId` về null) NGAY khi bấm Dừng, không
    // đợi 'onstop' - nút đổi trạng thái tức thì dù việc dừng track/tải lên phía dưới có trục trặc
    // hay không; (2) bọc `recorder.stop()` trong try/catch, lỡ ném lỗi vẫn tự dọn track micro luôn
    // ở nhánh catch thay vì để mic treo. Bỏ qua (không upload) nếu bấm dừng quá nhanh chưa kịp có
    // dữ liệu (blob rỗng).
    stopRecording(attemptId: number, questionId: number, onError: (error: any) => void) {
        const recorder = this.mediaRecorder
        this.setStream('recordingQuestionId', null)
        if (!recorder) return
        recorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data) }
        recorder.onstop = () => {
            this.mediaStream?.getTracks().forEach((t) => t.stop())
            this.mediaStream = undefined
            this.mediaRecorder = undefined
            const mimeType = recorder.mimeType || 'audio/webm'
            const blob = new Blob(this.recordedChunks, { type: mimeType })
            this.recordedChunks = []
            if (blob.size === 0) return
            this.uploadSpeakingAnswer(attemptId, questionId, blob, mimeType, onError)
        }
        try {
            if (recorder.state !== 'inactive') recorder.stop()
        } catch (err) {
            this.mediaStream?.getTracks().forEach((t) => t.stop())
            this.mediaStream = undefined
            this.mediaRecorder = undefined
        }
    }

    // Không qua apiRequest (không phải QuizRequestBase call) vì quizUploadSpeakingAnswer gọi thẳng
    // QUIZ_API - CÙNG PATTERN uploadQuestionAudio bên BlocParentQuestions.ts. Thành công thì cache
    // luôn blob vừa ghi thành object URL mới (không cần gọi lại loadSpeakingAnswer/GET lần nữa).
    async uploadSpeakingAnswer(attemptId: number, questionId: number, blob: Blob, mimeType: string, onError: (error: any) => void) {
        this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: true })
        const baseType = mimeType.split(';')[0]
        const extension = baseType.includes('mp4') ? 'm4a' : baseType.includes('ogg') ? 'ogg' : baseType.includes('wav') ? 'wav' : 'webm'
        const file = new File([blob], `answer-${questionId}.${extension}`, { type: baseType })
        try {
            const res = await quizUploadSpeakingAnswer(attemptId, questionId, file)
            this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
            if (res.code === 100) {
                const old = (this.getField('speakingAudioUrls') ?? {})[questionId]
                if (old) URL.revokeObjectURL(old)
                this.setStream('speakingAudioUrls', { ...(this.getField('speakingAudioUrls') ?? {}), [questionId]: URL.createObjectURL(blob) })
            } else {
                onError(res)
            }
        } catch (e) {
            this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
            onError(e)
        }
    }

    // Xoá bản ghi âm hiện tại để ghi lại từ đầu - revoke object URL cache rồi xoá khỏi map, nút
    // "Ghi âm" tự hiện lại (TakeTest.tsx đọc speakingAudioUrls[questionId] để quyết định hiện
    // <audio>+nút Xoá hay hiện nút Ghi âm). Backend tự chặn nếu attempt đã nộp.
    deleteSpeakingAnswer(attemptId: number, questionId: number, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.removeSpeakingAnswer(attemptId, questionId), () => {
            const old = (this.getField('speakingAudioUrls') ?? {})[questionId]
            if (old) URL.revokeObjectURL(old)
            const next = { ...(this.getField('speakingAudioUrls') ?? {}) }
            delete next[questionId]
            this.setStream('speakingAudioUrls', next)
        }, { onError })
    }

    // Lưu câu trả lời gõ chữ (tự luận, thêm 2026-09-01) - gọi lúc rời khỏi ô nhập (onBlur ở
    // TakeTest.tsx, KHÔNG lưu mỗi lần gõ 1 ký tự) - text rỗng gửi lên backend tự xoá về chưa trả
    // lời. Không hiện loading riêng (isShowLoading:false) - thao tác nền, giống hệt saveAnswer.
    saveSpeakingTextAnswer(attemptId: number, questionId: number, text: string, onError: (error: any) => void) {
        this.setStream('speakingTextAnswers', { ...(this.getField('speakingTextAnswers') ?? {}), [questionId]: text })
        this.apiRequest(QuizStudentAttemptApi.saveSpeakingTextAnswer(attemptId, questionId, text), () => {}, { onError, isShowLoading: false })
    }
}
