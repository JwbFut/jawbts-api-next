import { ResponseUtils } from "@/components/ResponseUtils"

export const dynamic = 'force-dynamic';

const stuffs: { [key: string]: any } = {
    noglerr: {
        lowestSafeVersion: "1.0.7",
        // checkUrl: "https://baidu.com",
        branches: {
            "fabric-1.17.x": {
                latestVersion: "1.0.7",
                downloadUrl: "https://github.com/winsrewu/NoGLErr/releases/tag/1.0.7"
            }
        }
    }
};

export async function GET(
    request: Request,
    { params }: { params: { stuff: string } }
) {
    const stuff = params.stuff;
    if (stuffs[stuff] == undefined) {
        return ResponseUtils.notFound(stuff);
    }
    return ResponseUtils.successJson(stuffs[stuff]);
}