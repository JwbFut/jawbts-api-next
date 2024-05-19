export class ErrorUtils {
    static log(e: Error) {
        console.log("===Err===")
        console.log(new Date(Date.now()).toLocaleString());
        console.log((e as Error).message);
        console.log((e as Error).stack);
        console.log((e as Error).cause);
        console.log("===End===")
    }
}