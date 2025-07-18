import { User } from "./database/dbTypes";

export async function getEmailAddress(username: string) {
    const res = await User.findOne({
        where: {
            username: username
        },
        attributes: ["email"]
    });

    if (!res) throw new Error("User not found");

    if (!res.email.verified) return null;

    return res.email.email;
}

export function ipinfoEmailBody(ip: string, ip_info: string) {
    return `Please login and check it. Security is really important. The IP address is ${ip}.
Geo location info: ${ip_info}`
}