import { ResponseUtils } from "@/components/ResponseUtils";

export const runtime = 'edge';

const availableStuff = ["noglerr"];

export function GET() {
    return ResponseUtils.successJson({"availableStuff": availableStuff});
}