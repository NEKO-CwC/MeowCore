import axios from "axios"

export function sleep(ms: number) {
    return new Promise((resolve) => { setTimeout(resolve, ms) })
}

export const asyncUpdate = async <T>(raw: T[], func: (item: T) => Promise<T>, delay = 200000): Promise<T[]> => {
    const res: T[] = []
    
    do {
        const reject: T[] = []
        const updatedItems = await Promise.allSettled(raw.map(func))

        // eslint-disable-next-line no-loop-func
        updatedItems.forEach((item: PromiseSettledResult<T>, index: number) => {
            if (item.status === "fulfilled") {
                res.push(item.value)
            } else {
                console.log(item.reason)
                reject.push(raw[index])
            }
        })
        raw = reject
        
        sleep(delay)
    }
    while (raw.length !== 0)

    return res
}

export const defaultErrorDeal = (error: any, attempt: number, cause: any) => {
    if (axios.isAxiosError(error) && [400, 404].indexOf(error.response?.status as number) !== -1) {
        console.log(`正在重试第${attempt}次`)
        // eslint-disable-next-line no-return-assign
        return attempt += 1
    } 
    throw new Error("未知错误", { cause })
}

export const retryRequests = async <T>(
    callback: () => Promise<T> | T,
    errorDeal: (error: any, attempt: number, cause: any) => number = defaultErrorDeal,
    maxTryTimes = 10,
    delay = 500,
): Promise<T> => {
    let attempt = 0
    while (attempt < maxTryTimes) {
        try {
            return await callback()
        } catch (error) {
            attempt = errorDeal(error, attempt)
        }
        await sleep(delay)
    }
    throw new Error("达到最大重试次数")
}

// export const sleepTaskList = async (ms: number) => {
//     return 
// }
