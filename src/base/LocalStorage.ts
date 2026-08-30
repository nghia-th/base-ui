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
}