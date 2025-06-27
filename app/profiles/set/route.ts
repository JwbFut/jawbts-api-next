import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    let formData;
    try {
        formData = await request.json();
    } catch (e) {
        return ErrorHandler.invalidFormData();
    }

    let description = formData["description"];
    let avatar_url = formData["avatar_url"];

    if (description) {
        description = description.toString();
        try {
            await sequelize.transaction(async (t) => {
                await sequelize.models.users.update({
                    description: description
                }, {
                    where: {
                        username: res.username
                    },
                    transaction: t
                });
            });
        } catch (e) {
            return ErrorHandler.databaseError();
        }
    }

    if (avatar_url) {
        avatar_url = avatar_url.toString();
        try {
            await sequelize.transaction(async (t) => {
                await sequelize.models.users.update({
                    avatar_url: avatar_url
                }, {
                    where: {
                        username: res.username
                    },
                    transaction: t
                });
            });
        } catch (e) {
            return ErrorHandler.databaseError();
        }
    }

    return ResponseUtils.success();
}