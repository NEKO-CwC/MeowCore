export interface CollegeCookie {
    chaoxing: Record<string, string>
    mooc: Record<string, string>
}

export interface CourseEventAttachment {
    downPath: string
    name: string
    suffix: string
}

export interface CourseEventNotice {
    type: string
    startTime: number
    endTime: number
    url: string
    title: string
    briefContent: string
    detail?: {
        detailContent:string
        attachment: CourseEventAttachment[]
    }
}

export interface CourseEventSignIn {
    type: string
    startTime: number
    endTime: number
}
export interface CourseEventDiscuss {
    type: string
    startTime: number
    endTime: number
    url: string
    title: string
    briefContent: string
}

export interface CourseEventQuestionnaire {
    type: string
    startTime: number
    endTime: number
    url: string
    title: string
    briefContent: string
}

export type CourseEvent = CourseEventNotice | CourseEventSignIn | CourseEventDiscuss | CourseEventQuestionnaire

export interface CourseHomeworkDetail {
    detailContent: string,
    attachment: CourseEventAttachment[]
}

export interface CourseHomework {
    url: string
    title: string
    remainTime: string
    status: string
    detail: CourseHomeworkDetail
}

export interface CourseExam {
    startTime: string
}

export interface SpecialValue {
    encs: {
        enc: string
        oldenc: string
        workenc: string
        examenc: string
        openc: string
    }
    cpi: string
}

export interface Course {
    name: string
    url: string
    teacher: string
    specialValue?: SpecialValue

    classId: number
    courseId: number
    courseCount: number
    courseFinish: number
    startTime: number
    endTime: number
    finished: boolean
    events: CourseEvent[]
    homework: CourseHomework[]
    exam: CourseExam[]
}

export interface specialValue {
    enc?: string
}

export interface UserInfo {
    cookie: CollegeCookie
    specialValue: specialValue
}

export interface rawEvent {
    type: number
    [key: string]: string | number
}

export interface ChaoxingUser {
    cookie: CollegeCookie,
    courses: Course[]
}

export interface Config {
    name: string
    contentPath: string
    mode: string
    lastModify: number
}

export interface User {
    config: Config
    xxt: ChaoxingUser
}
