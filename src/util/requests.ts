import { AxiosRequestConfig } from "axios"
import { CookieJar } from "tough-cookie"

export const generateConfig = (
    headers?: {
        Accept?: string
        Host?: string
        Origin?: string
        Referer?: string
        ["Content-Length"]?: string
        ["Sec-Fetch-Mode"]?: string
        ["Sec-Fetch-Site"]?: string
        ["Sec-Fetch-Dest"]?: string
        ["Sec-Fetch-User"]?: string
        ["X-Requested-With"]?: string
        Cookie?: string
        [key: string]: string | undefined
    },
): AxiosRequestConfig => {
    const defaultHeaders: { [key: string]: string } = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Connection: "keep-alive",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "Windows",
        "X-Requested-With": headers?.["X-Requested-With"] ? headers?.["X-Requested-With"] : "XMLHttpRequest",
        "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
    }

    if (headers) {
        return {
            headers: {
                ...defaultHeaders,
                ...headers,
            },
        } as AxiosRequestConfig
    }

    return {
        headers: {
            ...defaultHeaders,
        },
    } as AxiosRequestConfig
}

export const generateCookieString = (cookies: Record<string, string>): string => Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ")

export const updateCookie = (rawCookie: Record<string, string>, cookies: string[], url: string): Record<string, string> => {
    const updatedCookieRecord: Record<string, string> = { ...rawCookie }

    const cookieJar = new CookieJar()

    if (cookies) {
        cookies.forEach((cookieString: string) => {
            cookieJar.setCookieSync(cookieString, url)
        })
    }

    cookieJar.getCookiesSync(url).forEach((cookie) => {
        updatedCookieRecord[cookie.key] = cookie.value
    })
    return updatedCookieRecord
}

export const formatUrlQueryToRecord = (url: string) :Record<string, string> => {
    const queryList: string[] = url.split("?")[1].split("&")
    const res: Record<string, string> = {}

    queryList.forEach((query) => {
        const [key, value] = query.split("=")
        res[key] = value
    })

    return res
}
