import { sql } from "@vercel/postgres";
import { ResponseUtils } from "./ResponseUtils";

export class AuthUtils {
    static chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    static generateState() {
        return this.generateRandomString(15);
    }

    static generateToken() {
        return this.generateRandomString(20);
    }

    static stringToHashConversion(string: string) {
        for (var i = 0, hash = 0; i < string.length; i++)
            hash = Math.imul(31, hash) + string.charCodeAt(i) | 0;
        return hash.toString();
    }

    static generateRandomString(length: number) {
        let res = "";
        for (let i = 0; i < length; i++) {
            res += this.chars[Math.floor(Math.random() * this.chars.length)];
        }
        return res;
    }

    static async checkLogin(request: Request) {
        const auth = request.headers.get("Authorization");
        if (!auth) return ResponseUtils.needLogin();
        if (!auth.startsWith("customscheme ")) return ResponseUtils.badToken("Unsupported Token");

        return await this.checkToken(auth.substring(13))
    }

    static async checkToken(token: string) {
        const { rows } = await sql` SELECT id, EXTRACT(EPOCH FROM token_expire) AS TIMESTAMP
        FROM users WHERE token = ${AuthUtils.stringToHashConversion(token)}`;
        const id_ = rows.map((row) => {
            return row.id;
        });
        const token_expire_ = rows.map((row) => {
            return row.timestamp;
        });
        const id = id_[0];
        const token_expire = token_expire_[0];

        if (!id || !token_expire) {
            return ResponseUtils.badToken("Bad Token");
        }


        if ((Date.now() / 1000) > token_expire) {
            return ResponseUtils.badToken("Token Expired");
        }

        return { id: id, token_expire: token_expire };
    }
}