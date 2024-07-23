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

export const formatCourseEvent = (raw: rawEvent): CourseEvent => {
    const res = {
        type: "未知",
        startTime: raw.startTime as number,
        endTime: raw.endTime as number, 
    }

    if (raw.type === 2) {
        res.type = "签到"
        return { ...res, url: "" } as CourseEventSignIn
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
        const briefContent = raw.nameOne as string

        return {
            ...res, 
            url: "",
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
    
    if (raw.type === 4) {
        res.type = "抢答"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 11) {
        res.type = "选人"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 17) {
        res.type = "直播"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 19) {
        res.type = "作业"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 23) {
        res.type = "评分"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 34) {
        res.type = "通知"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 35) {
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 42) {
        res.type = "随堂练习"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 43) {
        res.type = "投票"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 44) {
        res.type = "课程章节"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 46) {
        res.type = "群聊"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 47) {
        res.type = "计时器"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 48) {
        res.type = "课程章节"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 49) {
        res.type = "白板"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 50) {
        res.type = "主题讨论"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 51) {
        res.type = "同步课堂"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 56) {
        res.type = "泛雅课堂"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 57) {
        res.type = "PPT文档"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 58) {
        res.type = "教案"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 60) {
        res.type = "教案"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 61) {
        res.type = "WORD文档"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 62) {
        res.type = "PDF文档"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 63) {
        res.type = "阅读任务"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 68) {
        res.type = "互动练习"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }
    
    if (raw.type === 59) {
        res.type = "抽签"
        const title = raw.nameOne as string
        const briefContent = raw.nameOne as string
    
        return {
            ...res, 
            url: "",
            title,
            briefContent,
        } as CourseEvent
    }

    throw new Error("不合法的输入")
}
