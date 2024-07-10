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

export const INFO = (message: string) => {
    console.log(`INFO: ${message}`)
}

export const WARN = (message: string) => {
    console.log(`WARN: ${message}`)
}

export const ERROR = (message: string) => {
    console.log(`ERROR: ${message}`)
}

export const retryRequests = async <T>(maxTryTimes: number, func: (...args: any[]) => Promise<T>, args: any[], exceptCode: number[]): Promise<T> => {
    let attempts = 0
    let res:T
    while (attempts <= maxTryTimes) {
        try {
            res = await func(...args)
            return res
        } catch (error) {
            attempts += 1
            if (axios.isAxiosError(error) && exceptCode.includes(error.response?.status as number)) {
                console.warn(`${func.name} 第 ${attempts} 次尝试失败`)
            } else {
                console.error((error as Error).message)
                throw new Error("出现未知错误，强制停止执行")
            }
        }
    }
    throw new Error("达到最大重试次数")
}

// export const sleepTaskList = async (ms: number) => {
//     return 
// }
