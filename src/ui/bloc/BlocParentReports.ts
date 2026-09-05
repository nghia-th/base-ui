import { IBlocUI } from "../../base/IBlocUI";
import { QuizReportApi } from "../../api/QuizReportApi";
import { QuizStudentApi } from "../../api/QuizStudentApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizTimetableApi, QuizTimetableLessonPreparation } from "../../api/QuizTimetableApi";
import { QuizLessonReportApi, QuizLessonReportHistoryItem } from "../../api/QuizLessonReportApi";

// Chi lay 2 field can cho dropdown loc Mon hoc o phan "Bao bai" (2026-09-06) - moi Bloc "content"
// tu khai bao shape rieng, khong import cheo interface Bloc khac (cung ly do QuizSubjectLite o
// BlocParentTimetable.ts).
export interface QuizReportSubjectLite {
    id: number;
    name: string;
}

// Chi lay field can cho viec suy ra classroomId tu Hoc sinh dang chon (de tai danh sach Mon hoc
// cho bo loc "Bao bai") - cung ly do QuizStudentLite o BlocParentTimetable.ts.
export interface QuizReportStudentLite {
    id: number;
    classroomId: number;
}

// Khớp StudentAttemptHistoryItem.java.
export interface QuizAttemptHistoryItem {
    attemptId: number;
    testName: string;
    submittedAt: string;
    correctCount: number;
    totalQuestions: number;
    testType: string;
}

// Khớp AttemptAnswerDetail.java - Phụ huynh-facing nên CÓ correctChoiceContent (khác view học
// sinh ở task 6). questionType/hasSpeakingAnswer/parentMarkedCorrect thêm 2026-09-01 (câu hỏi dạng
// tự luận/thu âm) - correctChoiceContent là null cho câu SPEAKING (không có Choice nào), 'correct'
// vẫn luôn false cho câu SPEAKING (không được backend tự chấm, xem ReportService.java's comment) -
// KHÔNG dùng field 'correct' để hiện icon Đúng/Sai cho câu SPEAKING, dùng parentMarkedCorrect.
export interface QuizAttemptAnswerDetail {
    questionId: number;
    questionContent: string;
    chosenChoiceContent: string | null;
    correctChoiceContent: string | null;
    correct: boolean;
    knowledgeTag: string;
    questionType: 'MULTIPLE_CHOICE' | 'SPEAKING';
    hasSpeakingAnswer: boolean;
    parentMarkedCorrect: boolean | null;
    // Thêm 2026-09-01 cùng đợt AnswerMode - answerText: câu trả lời gõ chữ của học sinh (null nếu
    // chưa gõ/chỉ ghi âm); answerMode: chế độ Phụ huynh đã cấu hình cho câu hỏi này lúc tạo (chỉ có
    // ý nghĩa với câu SPEAKING); referenceAnswer: đáp án tham khảo Phụ huynh tự nhập lúc tạo câu hỏi
    // (không phải đáp án đúng do hệ thống chấm - chỉ để đối chiếu, có thể null).
    answerText: string | null;
    answerMode: 'AUDIO' | 'TEXT' | 'BOTH' | null;
    referenceAnswer: string | null;
}

// Khớp KnowledgeTagBreakdown.java - tính năng cốt lõi của sản phẩm (xem hieu-bai-app-phan-tich.md):
// không chỉ điểm số mà còn sai ở mảng kiến thức nào.
export interface QuizKnowledgeTagBreakdown {
    knowledgeTag: string;
    correctCount: number;
    totalCount: number;
}

// Khớp AttemptReportResponse.java.
export interface QuizAttemptReport {
    attemptId: number;
    testName: string;
    studentName: string;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
    submittedAt: string;
    answers: QuizAttemptAnswerDetail[];
    byKnowledgeTag: QuizKnowledgeTagBreakdown[];
}

// Bloc trang "Báo cáo" (khu vực Phụ huynh, /app/parent/reports - Task 7 backend). ĐÃ THÊM 2026-
// 09-01: nghe lại + chấm Đúng/Sai câu trả lời dạng tự luận/thu âm (đọc-only mọi phần khác vẫn giữ
// nguyên, chỉ riêng thao tác chấm này là ghi - xem gradeSpeakingAnswer bên dưới).
export class BlocParentReports extends IBlocUI {
    async initData() {
        this.apiRequest(QuizStudentApi.list(), (res) => {
            this.setStream('students', res.data)
        })
    }

    // Item 8 (dot 11 yeu cau, 2026-09-05) - "phu huynh xem duoc lich su hoc tap cua con trong 1
    // tuan": mac dinh chi hien TUAN NAY (weekOffset=0), co the bam Truoc/Sau de xem tuan khac,
    // hoac "Xem tat ca" (weekOffset=null) de quay lai xem toan bo lich su nhu truoc day (khong bo
    // kha nang cu, chi them bo loc). Tuan tinh theo Thu Hai-Chu Nhat, dung quy uoc ISO 1..7 giong
    // het TimetableEntry/StudentTimetableService ben backend (jsDay===0 -> 7).
    private weekRange(weekOffset: number): { from: string; to: string } {
        const now = new Date();
        now.setDate(now.getDate() + weekOffset * 7);
        const jsDay = now.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() - (isoDay - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { from: fmt(monday), to: fmt(sunday) };
    }

    loadHistory(studentId: number, weekOffset: number | null) {
        const range = weekOffset == null ? undefined : this.weekRange(weekOffset);
        this.apiRequest(QuizReportApi.getStudentAttemptHistory(studentId, range?.from, range?.to), (res) => {
            this.setStream('history', res.data as QuizAttemptHistoryItem[])
        })
    }

    changeWeek(studentId: number, weekOffset: number | null) {
        this.setStream('weekOffset', weekOffset)
        this.loadHistory(studentId, weekOffset)
    }

    loadAttemptReport(attemptId: number, onComplete: (report: QuizAttemptReport) => void, onError: (error: any) => void) {
        this.apiRequest(QuizReportApi.getAttemptReport(attemptId), (res) => {
            onComplete(res.data as QuizAttemptReport)
        }, { onError })
    }

    // State giao diện dời từ useState vào đây (2026-09-01, xem BlocParentStudents.ts's comment).
    changeStudent(value: number) {
        this.setStream('studentId', value)
        this.setStream('weekOffset', 0)
        this.loadHistory(value, 0)
        this.loadPreparation(value)

        // "Bao bai" (2026-09-06) - mac dinh xem HOM NAY, khong loc theo Mon (subjectId undefined).
        const todayIso = this.todayIsoDate()
        this.setStream('lessonReportDate', todayIso)
        this.setStream('lessonReportSubjectId', '')
        this.loadLessonReportHistory(value, todayIso, '')

        const students: QuizReportStudentLite[] = this.getField('students') ?? []
        const classroomId = students.find((s) => s.id === value)?.classroomId
        if (classroomId != null) {
            this.apiRequest(QuizSubjectApi.list(classroomId), (res) => {
                this.setStream('lessonReportSubjects', res.data as QuizReportSubjectLite[])
            })
        } else {
            this.setStream('lessonReportSubjects', [])
        }
    }

    private todayIsoDate(): string {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // "Bao bai" (2026-09-06, "ben phu huynh co the xem duoc hom nay con hoc gi va cung co the xem
    // lai nhung ngay truoc con da chon"): 1 ngay (mac dinh hom nay) + loc theo Mon hoc (optional).
    loadLessonReportHistory(studentId: number, date: string, subjectId: number | '') {
        this.apiRequest(QuizLessonReportApi.getStudentHistory(studentId, date, subjectId === '' ? undefined : subjectId), (res) => {
            this.setStream('lessonReportHistory', res.data as QuizLessonReportHistoryItem[])
        })
    }

    changeLessonReportDate(studentId: number, date: string) {
        this.setStream('lessonReportDate', date)
        const subjectId = this.getField('lessonReportSubjectId') ?? ''
        this.loadLessonReportHistory(studentId, date, subjectId)
    }

    changeLessonReportSubject(studentId: number, subjectId: number | '') {
        this.setStream('lessonReportSubjectId', subjectId)
        const date = this.getField('lessonReportDate') ?? this.todayIsoDate()
        this.loadLessonReportHistory(studentId, date, subjectId)
    }

    // Item 10 (dot 11 yeu cau, 2026-09-05) - "phu huynh dua vao ket qua cua 9 de biet con da
    // chuan bi bai cho ngay mai hay chua va mon nao chua hoc". Doc-only, dung lai chinh
    // LessonPreparationStatus backend tra ve cho Hoc sinh (xem QuizTimetableApi.ts's comment).
    loadPreparation(studentId: number) {
        this.apiRequest(QuizTimetableApi.getStudentTomorrowPreparation(studentId), (res) => {
            this.setStream('preparation', res.data as QuizTimetableLessonPreparation[])
        })
    }

    openReport(attemptId: number, onError: (error: any) => void) {
        this.revokeSpeakingAudioUrls()
        this.setStream('speakingAudioUrls', {})
        this.setStream('speakingLoadingIds', {})
        this.loadAttemptReport(attemptId, (r) => this.setStream('report', r), onError)
    }

    closeReport() {
        this.setStream('report', null)
        this.revokeSpeakingAudioUrls()
        this.setStream('speakingAudioUrls', {})
    }

    private revokeSpeakingAudioUrls() {
        const urls: Record<number, string> = this.getField('speakingAudioUrls') ?? {}
        Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }

    // Nghe lại câu trả lời con đã ghi âm cho 1 câu hỏi SPEAKING - cache theo questionId, CÙNG
    // PATTERN loadQuestionAudio bên BlocStudentAttempt.ts (không tải lại nếu đã có url).
    loadSpeakingAnswer(attemptId: number, questionId: number, onError: (error: any) => void) {
        if ((this.getField('speakingAudioUrls') ?? {})[questionId]) return
        this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: true })
        this.apiRequest(QuizReportApi.getSpeakingAnswer(attemptId, questionId), (res: any) => {
            this.setStream('speakingAudioUrls', { ...(this.getField('speakingAudioUrls') ?? {}), [questionId]: URL.createObjectURL(res.data as Blob) })
            this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
        }, {
            onError: (error: any) => {
                this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
                onError(error)
            }
        })
    }

    // Đánh dấu Đúng/Sai/Chưa chấm cho 1 câu SPEAKING - chỉ là ghi chú tham khảo, KHÔNG gọi lại
    // loadAttemptReport (tránh mất state speakingAudioUrls đã tải + tránh nhấp nháy cả Dialog), tự
    // cập nhật report đang có trong stream để UI phản hồi ngay (xem QuestionType.java's javadoc:
    // không ảnh hưởng correctCount/scorePercent nên không cần đồng bộ lại phần điểm số).
    gradeSpeakingAnswer(attemptId: number, questionId: number, correct: boolean | null, onError: (error: any) => void) {
        this.apiRequest(QuizReportApi.gradeSpeakingAnswer(attemptId, questionId, correct), () => {
            const report: QuizAttemptReport | null = this.getField('report')
            if (!report) return
            const answers = report.answers.map((a) => a.questionId === questionId ? { ...a, parentMarkedCorrect: correct } : a)
            this.setStream('report', { ...report, answers })
        }, { onError })
    }
}
