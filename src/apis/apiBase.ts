import { Toast } from "@/components";
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

// 服务器地址
    const baseUrl='http://localhost:3000';


//请求携带的参数
const baseParams: AxiosRequestConfig = {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: true,
};

const ajax = async <T = any>(
    url: string,
    params: Omit<AxiosRequestConfig, "url"> = {}
): Promise<T> => {
    const response = await axios({
        url: baseUrl + url,
        ...baseParams,
        ...params,
    }).catch((err) => {
        console.log("ajax error", err);
        Toast.show("请求失败");
        return null;
    });
    if (response) {
        return response.data;
    }
    return Promise.reject(null);
};

export default ajax;
