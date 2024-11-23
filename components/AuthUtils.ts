import { ResponseUtils } from "./ResponseUtils";
import { jaw_db, RefTokenType } from "@/app/Db";
import * as jose from "jose"

export const jwks = jose.createRemoteJWKSet(new URL(process.env.ORIGIN_URL + "/auth/keys"));

export class AuthUtils {
    static chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    static generateState() {
        return this.generateRandomString(15);
    }

    static generateToken() {
        return this.generateRandomString(100);
    }

    static async hash(string: string, salt: string = "") {
        return Buffer.from(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(string + salt))).toString("base64");
    }

    static generateRandomString(length: number) {
        let res = "";
        for (let i = 0; i < length; i++) {
            res += this.chars[crypto.getRandomValues(new Uint32Array(1))[0] % this.chars.length];
        }
        return res;
    }

    static async checkLogin(request: Request) {
        const auth = request.headers.get("Authorization");
        if (!auth) return ResponseUtils.needLogin();
        if (!auth.startsWith("Bearer ")) return ResponseUtils.badToken("Unsupported Token");

        return await this.checkToken(auth.substring(7))
    }

    static async checkToken(token: string) {
        try {
            const { payload } = await jose.jwtVerify(token, jwks, {
                issuer: 'jawbts-api'
            });
            if (!payload.scope) return ResponseUtils.badToken("Bad Token");;
            if (!(payload.scope instanceof Array)) return ResponseUtils.badToken("Bad Token");;
            return payload.scope.includes("api") ? { username: payload.aud } : ResponseUtils.badToken("Bad Token");;
        } catch(err) {
            if ((err as Error).message === '"exp" claim timestamp check failed') {
                return ResponseUtils.badToken("Token Expired");;
            }
            return ResponseUtils.badToken("Bad Token");;
        }
    }

    /**
     * 直接写到数据库里面去
     * @param cre_time 创建时间
     */
    static async generateJwk(cre_time: Date = new Date()) {
        const { publicKey, privateKey } =
            await jose.generateKeyPair("RS256", { modulusLength: 4096, extractable: true });
        let [pri_jwk, pub_jwk] =
            await Promise.all([jose.exportPKCS8(privateKey), jose.exportJWK(publicKey)]);
        pri_jwk = pri_jwk.trim().replace(/\n/g, "\\n");

        if (!pub_jwk.n) throw Error("pub_jwk.n is undefined.");

        let kid;
        let flag = false;
        while (!flag) {
            kid = AuthUtils.generateRandomString(8);
            try {
                await jaw_db
                    .insertInto("jwks")
                    .values({ n: pub_jwk.n, pri_key: pri_jwk, cre_time: cre_time, kid: kid })
                    .execute();
                flag = true;
            } catch (err) {
                if ((err as Error).message === 'duplicate key value violates unique constraint "jwks_pkey"') {
                    continue;
                }
                throw err;
            }
        }
    }

    /**
     * 注意, private key在里面
     * @returns all jwks (promise)
     */
    static getJwks() {
        return jaw_db
            .selectFrom("jwks")
            .selectAll()
            .execute();
    }

    /**
     * 注意, private key在里面
     * @returns all available jwks (promise)
     */
    static getAvailableJwks() {
        let date = new Date();
        date.setDate(date.getDate() - 7 * 4);
        date.setHours(date.getHours() - 1);
        return jaw_db
            .selectFrom("jwks")
            .selectAll()
            .where("cre_time", ">", date)
            .execute();
    }

    /**
     * 注意, private key在里面
     * @returns a random jwk
     */
    static async getRandomAvailableJwk() {
        let available_jwks = await AuthUtils.getAvailableJwks();
        return available_jwks[Math.round(Math.random() * (available_jwks.length - 1))];
    }

    static async getJwt(username: string, scope: string[]) {
        let jwk = await AuthUtils.getRandomAvailableJwk();
        const private_key = await jose.importPKCS8(jwk.pri_key.replaceAll(/\\n/g, "\n"), "RS256");
        return await new jose.SignJWT({ scope: scope })
            .setProtectedHeader({ alg: "RS256", kid: jwk.kid, typ: "JWT" })
            .setAudience(username)
            .setIssuedAt()
            .setIssuer("jawbts-api")
            .setExpirationTime("1d")
            .sign(private_key);
    }

    static removeExpireRefTokensFrom(ref_tokens: RefTokenType[]) {
        let cur_time = new Date();
        ref_tokens = ref_tokens.filter((v) => {
            if (!v.exp_time) return false;
            if (!(v.exp_time instanceof Date)) v.exp_time = new Date(Date.parse(v.exp_time));
            if (v.exp_time < cur_time) return false;
            return true;
        })
        return ref_tokens;
    }
}