import {
    getCourseList, initCookie, login,
    initCourseInfo,
    getSpecialValue,
} from "./College"
import { Course } from "./College/type.ts"
import { retryRequests, sleep } from "./util/index.ts"

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error.stack)
})

const main = async () => {
    let cookie = await initCookie()

    let courses: Course[] = []

    let statusCode;
    // eslint-disable-next-line prefer-const
    [statusCode, cookie] = await login("15104410023", "Zrc_20050905", cookie)

    if (statusCode !== "登录成功") {
        throw new Error("登录失败")
    }

    console.log("登录成功");

    [courses, cookie] = await getCourseList(cookie)
    courses = courses.slice(3, 6)

    courses = await courses.reduce(async (prevRes, item: Course) => {
        const prev = await prevRes

        const specialValue = await retryRequests(() => getSpecialValue(item, cookie))
        await sleep(500)
        return [...prev, { ...item, specialValue }]
    }, Promise.resolve([] as Course[]))

    console.log("初始化完成")

    // let testCourse = courses.pop() as Course

    // [testCourse] = await initCourseInfo(testCourse, info.cookie)
    
    courses = await courses.reduce(async (prevRes, item: Course) => {
        const res = await prevRes
        const [newItem] = await initCourseInfo(item, cookie)
        sleep(500)
        return [...res, newItem]
    }, Promise.resolve([] as Course[]))
    
    console.log(courses)
}

try {
    main()
} catch (error) {
    console.log(error)
}
