import axios from "axios"
import * as fs from "fs/promises"
import { onceRedirectRequest, retryRequests } from "../util/index.ts"
import {
    generateConfig, generateCookieString, updateCookie, 
} from "../util/requests.ts"
import { encryptByAES } from "./chaoxing/crypto.ts"
import {
    ChaoxingUser,
    CollegeCookie, Course, CourseEvent, CourseEventAttachment,
    CourseEventNotice,
    CourseEventSignIn,
    CourseHomework,
    CourseHomeworkDetail,
    rawEvent,
    SpecialValue,
    User,
} from "./interface.ts"
import { formatCourseEventAttachment, formatCourseEvent } from "./format/json.ts"
import {
    parseCourseHTML, parseHomeworkDetailHTML, parseHomeworkHTML, parseSpecialValue, 
} from "./format/html.ts"
import { CONFIG_MODE_SIMPLE, CONFIG_MODE_STRICT } from "./constants.ts"

const transferKey = "u2oh6Vu^HWe4_AES"

export const initCookie = async (): Promise<CollegeCookie> => ({
    chaoxing: {},
    mooc: {},
})

// export const initConfig = async (rawConfig: Record<string, string>): Promise<Config> => {
//     if (!rawConfig.mode) {}
// }

export const initUser = async (name: string, contentPath: string, mode = "default"): Promise<User> => (
    {
        config: {
            name, contentPath, mode, lastModify: Date.now(), 
        },
        xxt: {
            cookie: await initCookie(),
            courses: [],
        } as ChaoxingUser, 
    }
)

export const login = async (uid: string, pwd: string, user: User)
    : Promise<[string, CollegeCookie]> => {
    const url = "https://passport2.chaoxing.com/fanyalogin"

    const requestBody = {
        fid: "-1",
        uname: encryptByAES(uid, transferKey),
        password: encryptByAES(pwd, transferKey),
        refer: "https%3A%2F%2Fi.chaoxing.com",
        t: "true",
        forbidotherlogin: "0",
        validate: "",
        doubleFactorLogin: "0",
        independentId: "0",
        independentNameId: "0",
    }    

    const formData = new URLSearchParams(requestBody).toString()

    try {
        const {
            status,
            headers,
            data,
        } = await axios.post(url, formData, generateConfig(
            {
                Accept: "application/json, text/javascript, */*; q=0.01",
                Cookie: generateCookieString(user.xxt.cookie.chaoxing),
                Host: "passport2.chaoxing.com",
                Origin: "https://passport2.chaoxing.com",
                Referer: "https://passport2.chaoxing.com/login",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Content-Length": Buffer.byteLength(formData, "utf-8").toString(),
            },
        ))
        
        if (status !== 200) {
            throw new Error(`未能正确登录，错误码为${status}`)
        }

        console.log(data)

        if (data.status && headers["set-cookie"]) {
            const chaoxingCookie = updateCookie(user.xxt.cookie.chaoxing, headers["set-cookie"], url)
            const cacheCookie: CollegeCookie = {
                chaoxing: chaoxingCookie,
                mooc: user.xxt.cookie.mooc,
            }
            return ["登录成功", cacheCookie]
        }

        if (data.msg2 === "用户名或密码错误") {
            return ["用户名或密码错误", user.xxt.cookie]
        }
        throw new Error("未知错误，可能是学习通寄了")
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status !== 200) {
            console.log(error.response?.status)
            throw error
        }

        throw error
    }
}

export const getSpecialValue = async (course: Course, user: User): Promise<SpecialValue> => {
    const { url } = course
    
    console.log(`${course.name}当前课程正在执行`)
    const { data } : { data : string} = await onceRedirectRequest(axios.get, url, {
        maxRedirects: 0,
        headers: {
            Origin: "https://mooc1.chaoxing.com",
            Referer: "https://i.chaoxing.com/base",
            Accept: "*/*",
            Cookie: `${generateCookieString(user.xxt.cookie.chaoxing)};${generateCookieString(user.xxt.cookie.mooc)}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
    }, {
        maxRedirects: 0,
        headers: {
            Accept: "*/*",
            Cookie: `${generateCookieString(user.xxt.cookie.chaoxing)};${generateCookieString(user.xxt.cookie.mooc)}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
    })

    return parseSpecialValue(data)
}

export const getCourseList = async (user: User): Promise<[Course[], CollegeCookie]> => {
    if (user.config.mode === CONFIG_MODE_SIMPLE && Date.now() - user.config.lastModify > 1000 * 60 * 60 * 24 * 30) {
        return [user.xxt.courses, user.xxt.cookie]
    } 
    const url = "https://mooc2-ans.chaoxing.com/mooc2-ans/visit/courselistdata"

    const requestBody: Record<string, string> = {
        courseType: "1",
        courseFolderId: "0",
        query: "",
        pageHeader: "-1",
        superstarClass: "0",
    }

    const formData = new URLSearchParams(requestBody).toString()

    let headers
    let data
    try {
        ({
            headers, data,
        } = await axios.post(url, formData, generateConfig(
            {
                Accept: "text/html, */*; q=0.01",
                Cookie: generateCookieString(user.xxt.cookie.chaoxing) + generateCookieString(user.xxt.cookie.mooc),
                Host: "mooc2-ans.chaoxing.com",
                Origin: "https://mooc2-ans.chaoxing.com",
                Referer: "https://mooc2-ans.chaoxing.com/visit/interaction",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Content-Length": Buffer.byteLength(formData, "utf-8").toString(),
            },
        )))
    } catch (error) {
        if (!(axios.isAxiosError(error))) {
            console.log("学习通寄辣")
            throw error
        }
        
        throw new Error("未知错误，可能是该提交 issue 了")
    }

    const resCookie = {
        chaoxing: user.xxt.cookie.chaoxing,
        mooc: updateCookie(
            user.xxt.cookie.mooc,
            headers["set-cookie"] as unknown as string[],
            "https://mooc2-ans.chaoxing.com",
        ),
    } as CollegeCookie

    const raw = parseCourseHTML(data)

    if (user.config.mode === CONFIG_MODE_STRICT) {
        return [raw, resCookie]
    }

    const res: Course[] = []
    raw.forEach((course: Course) => {
        if (!course.finished) {
            res.push(course)
        }
    })

    return [res, resCookie]
}

// 获取任务详细信息
export const getEventDetail = async (event: CourseEvent, user: User): Promise<CourseEvent> => {
    if (event.type === "签到") {
        const res = event as CourseEventSignIn

        return res as CourseEventSignIn
    }

    if (event.type === "通知") {
        const res = event as CourseEventNotice
        
        const { url } = res
        const detail: {
            detailContent: string
            attachment: CourseEventAttachment[]
        } = {
            detailContent: "",
            attachment: [],
        }

        const { data } = await axios.get(url, generateConfig({
            Cookie: generateCookieString(user.xxt.cookie.chaoxing), 
        }))
    
        if (data.msg.attachment !== undefined) {
            detail.attachment = formatCourseEventAttachment(data.msg.attachment)
        }
    
        if (data.msg.rtf_content !== undefined) {
            detail.detailContent = data.msg.rtf_content
        } else {
            detail.detailContent = data.msg.content
        }
    
        res.detail = detail

        return res as CourseEventNotice
    }

    throw new Error("获取事件详细信息失败")
}

// TODO: 文件在线预览
export const downloadAttachment = async (attachment: CourseEventAttachment, user: User) => {
    const url = attachment.downPath

    const { data } = await axios.get(url, generateConfig({
        Cookie: generateCookieString(user.xxt.cookie.chaoxing),
    }))
    console.log("🚀 ~ downloadAttachment ~ data:", data)
}

export const getCourseEvents = async (course: Course, user: User): Promise<[CourseEvent[], CollegeCookie]> => {
    const url = `https://mobilelearn.chaoxing.com/v2/apis/active/student/activelist?classId=${course.classId}&courseId=${course.courseId}&fid=${user.xxt.cookie.chaoxing.fid}`

    let attempts = 0
    let data

    do {
        try {
            const response = await axios.get(url, generateConfig({
                Cookie: `${generateCookieString(user.xxt.cookie.chaoxing)};${generateCookieString(user.xxt.cookie.mooc)}`,
            }))
            data = response.data
    
            if (data) {
                break
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log(error)
                throw error
            } else {
                throw new Error("未知错误")
            }
        }
    
        attempts += 1
        console.warn(`getCourseEvents 第 ${attempts} 次尝试失败`)
    
        if (attempts >= 10) {
            throw new Error("达到最大重试次数")
        }
    } while (!data)

    console.log(data.data.activeList)

    const res = data.data.activeList.reduce((prev: CourseEvent[], raw: rawEvent): CourseEvent[] => [...prev, formatCourseEvent(raw)], [] as CourseEvent[])

    return [res, user.xxt.cookie]
}

export const getCourseHomework = async (course: Course, user: User): Promise<[CourseHomework[], CollegeCookie]> => {
    const url = `https://mooc1.chaoxing.com/mooc2/work/list?courseId=${course.courseId}&classId=${course.classId}&status=2&enc=${course.specialValue?.encs.workenc}&cpi=${course.specialValue?.cpi}`

    const { data } = await axios.get(url, generateConfig({
        Host: "mooc1.chaoxing.com",
        Referer: "https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu?",
        Cookie: `${generateCookieString(user.xxt.cookie.chaoxing)};${generateCookieString(user.xxt.cookie.mooc)}`,
    }))

    console.log(data)

    const res = parseHomeworkHTML(data)

    return [res, user.xxt.cookie]
}

export const initCourseInfo = async (course: Course, user: User): Promise<[Course, CollegeCookie]> => {
    const [resEvent] = await retryRequests<[CourseEvent[], CollegeCookie]>(() => getCourseEvents(course, user))
    const [resHomework] = await retryRequests<[CourseHomework[], CollegeCookie]>(() => getCourseHomework(course, user))

    course.events = resEvent
    course.homework = resHomework

    return [course, user.xxt.cookie]
}

export const loadUserInfo = async (path: string): Promise<User> => {
    const content = await fs.readFile(path, "utf-8")
    return JSON.parse(content) as User
}

export const dumpUserInfo = async (path: string, content: User): Promise<void> => {
    content.config.lastModify = Date.now()
    await fs.writeFile(path, JSON.stringify(content, null, 4))
}

export const getHomeworkDetail = async (homework: CourseHomework, user: User): Promise<CourseHomeworkDetail> => {
    const { url } = homework
    const config = {
        headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-",
            Host: "mooc1.chaoxing.com",
            Cookie: generateCookieString(user.xxt.cookie.chaoxing) + generateCookieString(user.xxt.cookie.mooc),
        }, 
    }
    const { data }: { data: string} = await onceRedirectRequest(axios.get, url, config, config)

    return parseHomeworkDetailHTML(data)
}
