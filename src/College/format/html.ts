import * as cheerio from "cheerio"
import { formatUrlQueryToRecord } from "../../../src/util/requests"
import {
    Course, CourseEventAttachment, CourseHomework, CourseHomeworkDetail, SpecialValue, 
} from "../interface"

// export const 

export const parseCourseHTML = (courseHTML: string): Course[] => {
    const $ = cheerio.load(courseHTML)
    const courses: Course[] = []

    $(".course-info").each((_, element) => {
        let startTime = 0
        let endTime = 0
        let finished = false
        const courseElement = $(element)
        const url: string = courseElement.find("a").attr("href") as string
        const queryRecord = formatUrlQueryToRecord(url)
        const classId = parseInt(queryRecord.clazzid, 10) 
        const courseId = parseInt(queryRecord.courseid, 10) 
        if (courseElement.find(".not-open-tip").html()) {
            console.log(courseElement.find(".not-open-tip"))
            finished = true
        }
        const name = courseElement.find(".course-name").attr("title")
        const teacher = courseElement.find(".color3").attr("title")
        if (courseElement.find("p").last().text().indexOf("开课时间") !== -1) {
            startTime = Date.parse(courseElement.find("p").last().text().split("～")[0].replace("开课时间：", "").trim())
            endTime = Date.parse(courseElement.find("p").last().text().split("～")[1].trim())
            if (endTime < Date.now()) {
                finished = true
            }
        }
        courses.push({
            name,
            teacher,
            url,
            classId,
            courseId,
            startTime,
            endTime,
            finished,
            events: [],
            homework: [],
            exam: [],
            courseCount: -1,
            courseFinish: -1,
        } as Course)
    })

    return courses
}

export const parseEncHTML = (html: string): string => {
    const $ = cheerio.load(html)
    if (!$("#enc").attr("value")) {
        throw new Error("enc value notFound.")
    }

    return $("#enc").attr("value") as string
}

export const parseSpecialValue = (html: string): SpecialValue => {
    const $ = cheerio.load(html)

    if (!$(".stuNavigationList")) {
        throw new Error("html 字符串不合法，可能请求部分未达到预期值")
    }

    return {
        encs: {
            enc: $("#enc").attr("value") as string,
            oldenc: $("#oldenc").attr("value") as string,
            openc: $("#openc").attr("value") as string,
            examenc: $("#examEnc").attr("value") as string,
            workenc: $("#workEnc").attr("value") as string,
        },
        cpi: $("#cpi").attr("value") as string,
    }
}

export const parseHomeworkHTML = (html: string): CourseHomework[] => {
    const $ = cheerio.load(html)
    const res:CourseHomework[] = []

    console.log(html)

    if ($("title").text() !== "作业列表") {
        throw new Error("请求返回错误，没有正确获取作业列表")
    }

    $("li[onClick='goTask(this);']").each((_, element) => {
        const homeworkElement = $(element)
        
        const url = homeworkElement.attr("data")
        const title = homeworkElement.find(".overHidden2").text()
        const remainTime = homeworkElement.find(".verticalMiddle").text()
        const status = homeworkElement.find(".status").text()
        res.push({
            url, 
            title,
            remainTime,
            status,
        } as CourseHomework)
    })

    return res
}

export const parseHomeworkDetailHTML = (html: string): CourseHomeworkDetail => {
    const $ = cheerio.load(html)

    if ($("title").text() !== "查看详情") {
        throw new Error("html 字符串格式返回有误")
    }

    const attachment: CourseEventAttachment[] = []

    $(".attach-iframe").each((_, ele) => {
        const element = $(ele)
        attachment.push({
            downPath: `https://mooc1.chaoxing.com/mooc-ans/ueditorupload/read?objectId=${element.attr("objectid")}`,
            name: element.attr("filename") as string,
            suffix: element.attr("filename")!.split(".").at(-1) as string, 
        })
    })

    return { detailContent: $(".mark_item").html() as string, attachment }
}
