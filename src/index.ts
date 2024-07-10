import {
    getCourseList, initCookie, login,
    initCourseInfo,
    getSpecialValue,
} from "./College"
import { Course, UserInfo } from "./College/type.ts"
import { asyncUpdate, retryRequests, sleep } from "./util/index.ts"
// import { asyncUpdate } from "./util/index.ts"

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error.stack)
})

const main = async () => {
    const info: UserInfo = {
        cookie: await initCookie(),
        specialValue: {
            
        },
    }

    let courses: Course[] = []

    let statusCode;
    // eslint-disable-next-line prefer-const
    [statusCode, info.cookie] = await login("15104410023", "Zrc_20050905", info.cookie)

    if (statusCode !== "登录成功") {
        throw new Error("登录失败")
    }

    console.log("登录成功");

    [courses, info.cookie] = await getCourseList(info.cookie)
    courses = courses.slice(3, 6)

    courses = await courses.reduce(async (prevRes, item: Course) => {
        const prev = await prevRes

        const specialValue = await retryRequests(10, getSpecialValue, [item, info.cookie], [400, 404])
        await sleep(500)
        return [...prev, { ...item, specialValue }]
    }, Promise.resolve([] as Course[]))

    console.log("初始化完成")

    // let testCourse = courses.pop() as Course

    // [testCourse] = await initCourseInfo(testCourse, info.cookie)
    
    courses = await courses.reduce(async (prevRes, item: Course) => {
        const res = await prevRes
        const [newItem] = await initCourseInfo(item, info.cookie)
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
