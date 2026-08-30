import axios, {AxiosRequestConfig, CreateAxiosDefaults} from "axios";
import {AUTH_PREFIX} from "./PrefixService";
import LocalStorage from "./LocalStorage";
import qs from "qs";

const API = axios.create({
    timeout: 600000,
    headers: {
        'Content-Type': 'application/json',
    },
    paramsSerializer: (params) => {
        return qs.stringify(params, {
            encode: true
        })
    }
} as CreateAxiosDefaults);
function refreshToken () {
    return API.post(AUTH_PREFIX+'/refresh_token',null,{
        headers:{
            'token':getToken(),
            'lang':getLang()
        }
    } as AxiosRequestConfig)
}
function getToken():string {
    return window.localStorage.getItem('token')??'';
}
function getLang():string{
    return LocalStorage.getItem('i18nextLng')??'vi'
}
API.interceptors.request.use((request)=>{
    if(!request.url!!.startsWith("/auth-service/api/login")){
        const token = getToken()
        if (token){
            request.headers['token']=token
        }
    }
    return request
})
API.interceptors.response.use( (response):any => {

    if (response.config.url!!.startsWith(AUTH_PREFIX + '/login')) {
        const token = response.headers['token']
        if (token){
            localStorage.setItem('token', token);
        }
    }else {
        let { code, message,messageKey } = response.data;
        if (code===999){
            if (!messageKey){
                messageKey=message
            }
            return {'data':{'code':code,'message':message,'messageKey':messageKey,'httpError':true,'data':null}}
        }else if (code===998){
            return refreshToken().then((rs):any => {
                let {code,message,messageKey} = rs.data
                if (code===100){
                    const  token  = rs.headers['token']
                    if (token){
                        window.localStorage.setItem('token', token);
                    }
                    const config = response.config
                    config.headers['token'] = token
                    return API(config)
                }else {
                    return {'data':{'code':code,'message':message,'messageKey':messageKey,'httpError':true,'data':null}}
                }
            })
        }
    }
    return response;
},(error):any=>{
    try {

        const {status, statusText} = error.response
        if (status===403){
            return refreshToken().then((rs):any => {
                let {code,message,messageKey} = rs.data
                if (code===100){
                    const  token  = rs.headers['token']
                    if (token){
                        window.localStorage.setItem('token', token);
                    }
                    const config = error.response.config
                    config.headers['token'] = token
                    return API(config)
                }else {
                    return {'data':{'code':code,'message':message,'messageKey':messageKey,'httpError':true,'data':null}}
                }
            })
        }
        return {'data':{'code':status,'message':statusText,'messageKey':statusText,'httpError':true,'data':null}}
    }catch (e) {
        return {'data':{'code':400,'message':'error','messageKey':'error','httpError':true,'data':null}}
    }

})
export async function getRequest(url:string, config?:AxiosRequestConfig) {
    return await API.get(url, config)
}
export async function postRequest(url:string, data?:any, config?:AxiosRequestConfig) {
    return await API.post(url, data, config)
}
export async function deleteRequest(url:string, config?:AxiosRequestConfig){
    return await API.delete(url,config)
}
export async function headRequest(url:string, config?:AxiosRequestConfig){
    return await API.head(url,config)
}
export async function optionsRequest(url:string, config?:AxiosRequestConfig){
    return await API.options(url,config)
}
export async function putRequest (url:string, data?:any, config?:AxiosRequestConfig){
    return await API.put(url,data,config)
}
export async function patchRequest(url:string, data?:any, config?:AxiosRequestConfig){
    return await API.patch(url,data,config)
}
export default API;