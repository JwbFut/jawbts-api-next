import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils"

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const stuffs: { [key: string]: any } = {
    noglerr: {
        lowestSafeVersion: "1.0.8",
        // checkUrl: "https://baidu.com",
        branches: {
            "fabric-1.17.x": {
                latestVersion: "1.0.10",
                downloadUrl: "https://modrinth.com/mod/noglerr/versions#all-versions"
            },
            "fabric-1.21": {
                latestVersion: "1.0.10",
                downloadUrl: "https://modrinth.com/mod/noglerr/versions#all-versions"
            }
        }
    }
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ stuff: string }> }
) {
    const stuff = (await params).stuff;
    if (stuffs[stuff] == undefined) {
        return ErrorHandler.notFound();
    }
    return ResponseUtils.successJson(stuffs[stuff]);
}