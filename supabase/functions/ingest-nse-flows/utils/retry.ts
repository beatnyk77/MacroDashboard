export async function retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000,
    backoffFactor: number = 2
): Promise<T> {
    let attempt = 0
    while (attempt < retries) {
        try {
            return await fn()
        } catch (error) {
            attempt++
            if (attempt >= retries) {
                throw error
            }

            console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`, error)
            await new Promise((resolve) => setTimeout(resolve, delayMs))
            delayMs *= backoffFactor
        }
    }
    throw new Error('Unreachable')
}
