import path from "path"
import {
    getCourseList, login,
    initCourseInfo,
    getSpecialValue,
    initUser,
    loadUserInfo,
    dumpUserInfo,
} from "./College"
import { Course } from "./College/interface"
import { ensureFileExist, sleep } from "./util/index"

// process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//     // 不退出程序
//     // process.exit(1); // 如果需要退出程序，可以取消注释这行
// });

const main = async (name: string) => {
    let userName: string
    let phone: string
    let pwd: string
    if (name === "NEKO") {
        userName = "NEKO"
        phone = "15104410023"
        pwd = "Zrc_20050905"
    } else if (name === "JS") {
        userName = "JS"
        phone = "13019209939"
        pwd = "1111dada"
    } else {
        throw new Error("未找到用户")
    }
    const userContentPath = `./data/${userName}.json`
    await ensureFileExist(userContentPath)
    const localUserInfo = await loadUserInfo(userContentPath)
    console.log(Object.keys(localUserInfo).length)
    const user = Object.keys(localUserInfo).length !== 0 ? localUserInfo : await initUser(
        userName,
        path.join(process.cwd(), `./data/${userName}.json`), 
    )

    console.log(user.config.mode)

    let statusCode: string
    // eslint-disable-next-line prefer-const
    [statusCode, user.xxt.cookie] = await login(phone, pwd, user)

    if (statusCode !== "登录成功") {
        throw new Error("登录失败")
    }

    console.log("登录成功");

    [user.xxt.courses, user.xxt.cookie] = await getCourseList(user)
    console.log("🚀 ~ main ~ user.xxt.courses:", user.xxt.courses)
    user.xxt.courses = await user.xxt.courses.reduce(async (prevRes, item: Course) => {
        const prev = await prevRes

        const specialValue = await getSpecialValue(item, user)
        await sleep(100)
        item.specialValue = specialValue
        const [newItem] = await initCourseInfo(item, user)
        return [...prev, newItem]
    }, Promise.resolve([] as Course[]))

    console.log("初始化完成")

    // let testCourse = courses.pop() as Course

    // [testCourse] = await initCourseInfo(testCourse, info.user.chaoxing.cookie)
    
    // user.xxt.courses = await user.xxt.courses.reduce(async (prevRes, item: Course) => {
    //     const res = await prevRes
    //     return [...res, newItem]
    // }, Promise.resolve([] as Course[]))

    await dumpUserInfo(userContentPath, user)
}

main("JS")
