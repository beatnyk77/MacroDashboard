export class Logger {
    private runId: string;

    constructor(runId: string) {
        this.runId = runId;
    }

    async log(metric: string, status: string, count: number, message: string, duration?: number) {
        console.log(`[${this.runId}] [${metric}] [${status}] count=${count} ${message} ${duration ? `duration=${duration}ms` : ''}`);
        // Optional: add code here to log to a database table if needed
    }
}
