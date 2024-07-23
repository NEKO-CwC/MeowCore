import {
    CourseEventAttachment, rawEvent, CourseEvent, CourseEventSignIn,
    CourseEventNotice,
    CourseEventDiscuss,
    CourseEventQuestionnaire, 
} from "../interface"

export const formatCourseEventAttachment = (raw: string): CourseEventAttachment[] => {
    const json = JSON.parse(raw)
    const res: CourseEventAttachment[] = []
    json.forEach((attachment: {att_clouddisk:{ downPath: string; name: string; suffix: string} }) => {
        res.push({
            downPath: attachment.att_clouddisk.downPath,
            name: attachment.att_clouddisk.name,
            suffix: attachment.att_clouddisk.suffix,
        })
    })

    return res
}

export const formatCourseEvent = (raw: rawEvent) => {
    const res: CourseEvent = {
        type: "未知",
        startTime: raw.startTime as number,
        endTime: raw.endTime as number, 
    }

    if (raw.type === 2) {
        res.type = "签到"
        return res as CourseEventSignIn
    }

    if (raw.type === 45) {
        res.type = "通知"
        const title = raw.nameOne as string
        const briefContent = raw.content as string

        const id = JSON.parse(raw.content as string).idCode
        const url = `https://notice.chaoxing.com/pc/course/notice/${id}/getNoticeDetail`
        
        return {
            ...res, 
            url,
            title,
            briefContent,
        } as CourseEventNotice
    }

    if (raw.type === 5) {
        res.type = "主题讨论"
        const title = raw.nameOne as string
        const briefContent = raw.content as string

        const id = JSON.parse(raw.content as string).idCode
        const url = `https://notice.chaoxing.com/pc/course/notice/${id}/getNoticeDetail`
        
        return {
            ...res, 
            url,
            title,
            briefContent,
        } as CourseEventDiscuss
    }

    if (raw.type === 14) {
        res.type = "问卷"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string

        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEventQuestionnaire
    }
    
    throw new Error(`不合法的输入: ${raw}`)
}
