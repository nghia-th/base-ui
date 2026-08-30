import moment from "moment/moment";

export default class DateUtils {
    static stringToTimestamp(input:string, format:string) {
        return moment(input, format).unix() * 1000
    }

    static stringToDate(str: any, format: any) {
        return moment(str, format).toDate()
    }

    static timestampToDate(timestamp: number, format: any) {

        if (timestamp === 0) return null
        return moment(timestamp).format(format)
    }

    static timestampToDateObj(timestamp: number) {
        if (timestamp === 0 || timestamp === null)
            return null
        try {
            return moment.unix(timestamp / 1000).toDate()
        } catch (e) {
            return null
        }
    }
    static now(format: string){
        return this.stringToTimestamp(moment().format(format),format)
    }
    static dateToTimestamp(date: moment.MomentInput):any {
        if (!date) {
            return 0
        }
        try {
            return moment(date).unix() * 1000
        } catch (e) {
            return 0
        }

    }
    static addTime(date: moment.MomentInput, hours: moment.DurationInputArg1, minutes: moment.DurationInputArg1){
        return moment(date).add(hours,'hours').add(minutes,'minutes')
    }
    static setTime(date:Date,hours: number, minutes: number){
        date.setHours(hours)
        date.setMinutes(minutes)
        date.setSeconds(0)
        return date
    }
    static yearOldCurrent(date:Date){
        try {
            const current =moment().year()
            return current-moment(date).year()
        }catch (e) {
            return 0
        }
    }
    static timestampToString(timestamp: number, format: string){
        if (timestamp===0)
            return ""
        return moment(DateUtils.timestampToDateObj(timestamp)!!).format(format);
    }
    static dhm(t:number){
        let cd = 24 * 60 * 60 * 1000,
            ch = 60 * 60 * 1000,
            d = Math.floor(t / cd),
            h = Math.floor((t - d * cd) / ch),
            m = Math.round((t - d * cd - h * ch) / 60000),
            pad = function (n:number) {
                return n < 10 ? '0' + n : n;
            };

        if( m === 60 ){
            h++;
            m = 0;
        }
        if( h === 24 ){
            d++;
            h = 0;
        }
        if (d<0)return "--"
        return [d+"d", pad(h)+"h", pad(m)+"m"].join(':');
    }
}
