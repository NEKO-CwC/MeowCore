import axios, { head } from "axios"
import { CookieJar, Cookie } from "tough-cookie"
import { generateConfig, generateCookieString, updateCookie } from "../../util/requests.ts"
import { CollegeCookie } from "../type.ts"

export const getCookie = async (): Promise<Cookie[]> => {
    const url = "https://i.chaoxing.com"
    const cookieJar = new CookieJar()

    try {
        const res = await axios.get(url, generateConfig({ Referer: "https://www.google.com/" }))

        const setCookieHeaders = res.headers["set-cookie"]

        if (setCookieHeaders) {
            setCookieHeaders.forEach((cookieString: string) => {
                cookieJar.setCookieSync(cookieString, url)
            })
        }

        return cookieJar.getCookiesSync(url)
    } catch (error) {
        console.error("Error making request:", error)
        return []
    }
}

export const initChaoxingCookie = async (): Promise<Record<string, string>> => {
    const updatedCookieRecord: Record<string, string> = {
        retainlogin: "1",
        fid: Math.floor(Math.random() * 250).toString(),
        source: "",
    }

    const cookies = await getCookie()

    cookies.forEach((cookie) => {
        updatedCookieRecord[cookie.key] = cookie.value
    })

    return updatedCookieRecord
}

export const initMoocCookie = async (cookie: Record<string, string>): Promise<Record<string, string>> => {
    const url = "https://mooc2-ans.chaoxing.com/mooc2-ans/api/workTestPendingNew"

    const {
        status, statusText, headers, data,
    } = await axios.post(url, "classIds=", generateConfig(
        {
            Accept: "*/*",
            Cookie: generateCookieString(cookie),
            Host: "mooc2-ans.chaoxing.com",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Content-Length": Buffer.byteLength("classIds=", "utf-8"),
        },
    ))

    const moocCookie = updateCookie({}, headers["set-cookie"], "https://mooc2-ans.chaoxing.com")

    return moocCookie
}
