export interface IRunningProcess {
    stdout: NodeJS.ReadableStream | null;
    stderr: NodeJS.ReadableStream | null;
    kill(signal: string): void;
    // Allow the process to be awaited like a Promise
    then: Promise<any>['then'];
    catch: Promise<any>['catch'];
    // Allow other properties for specific implementations (like pid, exitCode, etc.)
    [key: string]: any;
}