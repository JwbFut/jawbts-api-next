import { ResponseUtils } from "@/components/ResponseUtils";

const availableStuff = ["noglerr"]

export function GET() {
    return ResponseUtils.successJson({"availableStuff": availableStuff});
}