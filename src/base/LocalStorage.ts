export default class LocalStorage{
    static setItem(key: string, value: string){
        window.localStorage.setItem(key,value);
    }
    static getItem(key: string){
        if (key==='i18nextLng'){
            const lang = window.localStorage.getItem(key)??'vi';
            if (lang!=='vi' && lang!=='en')
                return 'vi'
            return lang
        }
        return window.localStorage.getItem(key);
    }
    static getToken() {
        return window.localStorage.getItem('token');
    }
    static delete(key: string){
        window.localStorage.removeItem(key)
    }
    static deleteToken(){
        window.localStorage.removeItem('token')
    }
    // Refresh token (Hiểu Bài/quiz-service, 2026-09-04) - lưu RIÊNG key 'quiz_refresh_token',
    // không dùng chung 'token' (đó vẫn là access token) - xem QuizApiService.ts's error
    // interceptor (chỗ DUY NHẤT tự gọi refresh khi gặp 401) và BlocQuizLogin.ts (chỗ lưu lần đầu
    // sau login/register).
    static getRefreshToken() {
        return window.localStorage.getItem('quiz_refresh_token');
    }
    static setRefreshToken(token: string) {
        window.localStorage.setItem('quiz_refresh_token', token);
    }
    static deleteRefreshToken() {
        window.localStorage.removeItem('quiz_refresh_token')
    }
}