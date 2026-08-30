export default class Utils {
    static debug(log: any) {
        if(process.env!.NODE_ENV === "development") {
            console.log(log);
        }
    }
    static stringIsNullOrBlank(str:any):Boolean{
        try {
            if (!str){
                return true
            }
            if (str.toString().trim().length===0){
                return true
            }
            return false
        }catch (e) {
            return true
        }
    }
    static isNumber(val?:string):boolean{
        if (val==null)return false
        return isNaN(Number(val.toString()))
    }
    static isEmail(email:string):boolean{
        const expression: RegExp = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
        try {
            return expression.test(email)
        }catch (e) {
            return false
        }
    }
}