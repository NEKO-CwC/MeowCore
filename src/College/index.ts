import axios from "axios"
import * as fs from "fs/promises"
import { retryRequests } from "../util/index.ts"
import {
    generateConfig, generateCookieString, updateCookie, 
} from "../util/requests.ts"
import { encryptByAES } from "./chaoxing/crypto.ts"
import {
    ChaoxingUser,
    CollegeCookie, Config, Course, CourseEvent, CourseEventAttachment,
    CourseEventNotice,
    CourseEventSignIn,
    CourseHomework,
    rawEvent,
    SpecialValue,
    User,
} from "./interface.ts"
import { formatCourseEventAttachment, formatCourseEvent } from "./format/json.ts"
import {
    parseCourseHTML, parseHomeworkHTML, parseSpecialValue, 
} from "./format/html.ts"

const transferKey = "u2oh6Vu^HWe4_AES"

export const initCookie = async (): Promise<CollegeCookie> => ({
    chaoxing: {},
    mooc: {},
})

export const initUser = async (config: Config): Promise<User> => (
    {
        config,
        chaoxing: {
            cookie: await initCookie(),
            courses: [],
        } as ChaoxingUser, 
    }
)

export const login = async (uid: string, pwd: string, cookie: CollegeCookie)
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
                Cookie: generateCookieString(cookie.chaoxing),
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

        if (data.status && headers["set-cookie"]) {
            const chaoxingCookie = updateCookie(cookie.chaoxing, headers["set-cookie"], url)
            const cacheCookie: CollegeCookie = {
                chaoxing: chaoxingCookie,
                mooc: cookie.mooc,
            }
            return ["登录成功", cacheCookie]
        }

        if (data.msg2 === "用户名或密码错误") {
            return ["用户名或密码错误", cookie]
        }
        throw new Error("未知错误，可能是学习通寄了")
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status !== 200) {
            console.log(error.response?.status)
            throw error
        }

        throw new Error("其他未知错误")
    }
}

export const getSpecialValue = async (course: Course, cookie: CollegeCookie): Promise<SpecialValue> => {
    const { url } = course
    
    console.log(`${course.name}当前课程正在执行`)
    let data

    try {
        await axios.get(url, {
            maxRedirects: 0,
            headers: {
                Origin: "https://mooc1.chaoxing.com",
                Referer: "https://i.chaoxing.com/base",
                Accept: "*/*",
                Cookie: `${generateCookieString(cookie.chaoxing)};${generateCookieString(cookie.mooc)}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            }, 
        })
    } catch (error) {
        if (!(axios.isAxiosError(error) && error.response?.status === 302)) {
            throw error 
        }

        if (!error.response?.headers?.location) {
            throw new Error("Location Not Found")
        }

        ({ data } = await axios.get(error.response.headers.location, {
            maxRedirects: 0,
            headers: {
                Accept: "*/*",
                Cookie: `${generateCookieString(cookie.chaoxing)};${generateCookieString(cookie.mooc)}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            },
        }))
    }

    return parseSpecialValue(data)
}

export const getCourseList = async (cookie: CollegeCookie): Promise<[Course[], CollegeCookie]> => {
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
                Cookie: generateCookieString(cookie.chaoxing) + generateCookieString(cookie.mooc),
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

    const rseCookie = {
        chaoxing: cookie.chaoxing,
        mooc: updateCookie(
            cookie.mooc,
            headers["set-cookie"] as unknown as string[],
            "https://mooc2-ans.chaoxing.com",
        ),
    } as CollegeCookie

    const res = parseCourseHTML(data)

    return [res, rseCookie]
}

// 获取任务详细信息
export const getEventDetail = async (event: CourseEvent, cookie: CollegeCookie): Promise<CourseEvent> => {
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
            Cookie: generateCookieString(cookie.chaoxing), 
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
export const downloadAttachment = async (attachment: CourseEventAttachment, cookie: CollegeCookie) => {
    const url = attachment.downPath

    const { data } = await axios.get(url, generateConfig({
        Cookie: generateCookieString(cookie.chaoxing),
    }))
    console.log("🚀 ~ downloadAttachment ~ data:", data)
}

export const getCourseEvents = async (course: Course, cookie: CollegeCookie): Promise<[CourseEvent[], CollegeCookie]> => {
    const url = `https://mobilelearn.chaoxing.com/v2/apis/active/student/activelist?classId=${course.classId}&courseId=${course.courseId}&fid=${cookie.chaoxing.fid}`

    let attempts = 0
    let data

    do {
        try {
            const response = await axios.get(url, generateConfig({
                Cookie: `${generateCookieString(cookie.chaoxing)};${generateCookieString(cookie.mooc)}`,
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

    return [res, cookie]
}

export const getCourseHomework = async (course: Course, cookie: CollegeCookie): Promise<[CourseHomework[], CollegeCookie]> => {
    const url = `https://mooc1.chaoxing.com/mooc2/work/list?courseId=${course.courseId}&classId=${course.classId}&status=2&enc=${course.specialValue?.encs.workenc}&cpi=${course.specialValue?.cpi}`

    const { data } = await axios.get(url, generateConfig({
        Host: "mooc1.chaoxing.com",
        Referer: "https://mooc1.chaoxing.com/mooc2/work/list",
        Cookie: `${generateCookieString(cookie.chaoxing)};${generateCookieString(cookie.mooc)}`,
    }))

    // console.log(data)

    const res = parseHomeworkHTML(data)

    return [res, cookie]
}

export const initCourseInfo = async (course: Course, cookie: CollegeCookie): Promise<[Course, CollegeCookie]> => {
    const [resEvent] = await retryRequests<[CourseEvent[], CollegeCookie]>(() => getCourseEvents(course, cookie))
    const [resHomework] = await retryRequests<[CourseHomework[], CollegeCookie]>(() => getCourseHomework(course, cookie))

    course.events = resEvent
    course.homework = resHomework

    return [course, cookie]
}

export const loadUserInfo = async (path: string): Promise<User> => {
    const content = await fs.readFile(path, "utf-8")
    return JSON.parse(content) as User
}

export const dumpUserInfo = async (path: string, content: User): Promise<void> => {
    await fs.writeFile(path, JSON.stringify(content, null, 4))
}

export const filterEndCourses = async (courses: Course[]): Promise<Course[]> => {
    const res: Course[] = []
    courses.forEach((course) => {
        if (!course.finished) {
            res.push(course)
        }
    })
    return res
}
