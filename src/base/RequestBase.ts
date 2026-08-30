import { deleteRequest, getRequest, headRequest, optionsRequest, patchRequest, postRequest, putRequest } from './ApiService';
import {AxiosRequestConfig} from "axios";
export class RequestBase{
    public url=""
    public config?:AxiosRequestConfig
    public method='GET'
    public data:any = null
    public responseHeader=false
    constructor(url: string, data = null, config: any,method='GET',responseHeader=false) {
        this.url=url
        this.config=config
        this.data = data
        this.method = method
        this.responseHeader=responseHeader
    }
    static get(url: string, config?: any,responseHeader=false):RequestBase{
        return new RequestBase(url,null,config,'GET',responseHeader)
    }
    static post(url: string, data: any, config?: any,responseHeader=false):RequestBase{
        return new RequestBase(url,data,config,'POST',responseHeader)
    }

    static delete(url: string, config?:any| null,responseHeader?:boolean|false):RequestBase{
        return new RequestBase(url,null,config,'DELETE',responseHeader)
    }
    static head(url: string, config=null,responseHeader=false):RequestBase{
        return new RequestBase(url,null,config,'HEAD',responseHeader)
    }
    static options(url: string, config=null,responseHeader=false):RequestBase{
        return new RequestBase(url,null,config,'options',responseHeader)
    }

    static put(url: string, data: any, config?: any,responseHeader=false):RequestBase{
        return new RequestBase(url,data,config,'put',responseHeader)
    }
    static patch(url: string, data: any, config?: any,responseHeader=false):RequestBase{
        return new RequestBase(url,data,config,'patch',responseHeader)
    }

    async run() {
        if (this.method === 'GET') {
            return await getRequest(this.url, this.config)
        }
        if (this.method === 'POST') {
            return await postRequest(this.url, this.data, this.config)
        }
        if (this.method === 'DELETE') {
            return await deleteRequest(this.url, this.config)
        }
        if (this.method === 'HEAD') {
            return await headRequest(this.url, this.config)
        }
        if (this.method === 'options') {
            return await optionsRequest(this.url, this.config)
        }
        if (this.method === 'put') {
            return await putRequest(this.url, this.data, this.config)
        }
        if (this.method === 'patch') {
            return await patchRequest(this.url, this.data, this.config)
        }
    }
}
