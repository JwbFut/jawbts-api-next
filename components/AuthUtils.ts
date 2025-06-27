import * as jose from "jose"
import { Jwk, RefTokenType } from "@/components/database/dbTypes";
import { Op, Transaction } from "sequelize";
import { ErrorHandler } from "./ErrorHandler";

export const jwks = jose.createRemoteJWKSet(new URL(process.env.ORIGIN_URL + "/auth/keys"));

export class AuthUtils {
    static chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    static generateState(ref_tokens: RefTokenType[]) {
        let state: string;
        while (true) {
            state = this.generateRandomString(10);
            if (!ref_tokens.some((v) => v.state_c == state)) break;
        }
        return state;
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

    static async checkLogin(request: Request, additional_scope: string[] = []) {
        const auth = request.headers.get("Authorization");
        if (!auth) return ErrorHandler.needLogin();
        if (!auth.startsWith("Bearer ")) return ErrorHandler.invalidToken();

        const username_raw = await this.checkToken(auth.substring(7), additional_scope);
        if (username_raw instanceof Response) return username_raw;
        const username = username_raw.username;

        if (!username) return ErrorHandler.invalidToken();
        if (typeof username === "string") return { username: username };
        if (Array.isArray(username) && username.length == 1) return { username: username[0] };
        return ErrorHandler.invalidToken();
    }

    static async checkToken(token: string, additional_scope: string[] = []) {
        try {
            const { payload } = await jose.jwtVerify(token, jwks, {
                issuer: 'jawbts-api'
            });
            if (!payload.scope) return ErrorHandler.invalidToken();
            if (!(payload.scope instanceof Array)) return ErrorHandler.invalidToken();
            for (const scope of additional_scope) {
                if (!payload.scope.includes(scope)) return ErrorHandler.invalidToken();
            }
            return payload.scope.includes("api") ? { username: payload.aud } : ErrorHandler.invalidToken();
        } catch (err) {
            if ((err as Error).message === '"exp" claim timestamp check failed') {
                return ErrorHandler.tokenExpired();
            }
            return ErrorHandler.invalidToken();
        }
    }

    /**
     * 直接写到数据库里面去
     * @param cre_time 创建时间
     */
    static async generateJwk(cre_time: Date = new Date(), t: Transaction) {
        const { publicKey, privateKey } =
            await jose.generateKeyPair("RS256", { modulusLength: 4096, extractable: true });
        let [pri_jwk, pub_jwk] =
            await Promise.all([jose.exportPKCS8(privateKey), jose.exportJWK(publicKey)]);
        pri_jwk = pri_jwk.trim().replace(/\n/g, "\\n");

        if (!pub_jwk.n) throw Error("pub_jwk.n is undefined.");

        let jwks_in_db;
        try {
            jwks_in_db = await Jwk.findAll({
                attributes: ["kid"],
            });
        } catch (e) {
            return ErrorHandler.databaseError();
        }

        let kid: string;
        while (true) {
            kid = AuthUtils.generateRandomString(8);
            if (!jwks_in_db.some((v) => v.kid == kid)) break;
        }

        const jwk = await Jwk.create({
            n: pub_jwk.n,
            pri_key: pri_jwk,
            cre_time: cre_time,
            kid: kid,
        }, { transaction: t });
    }

    /**
     * 注意, private key在里面
     * @returns all available jwks (promise)
     */
    static getAvailableJwks() {
        let date = new Date();
        date.setDate(date.getDate() - 7 * 4);
        date.setHours(date.getHours() - 1);
        return Jwk.findAll({
            attributes: ["n", "pri_key", "cre_time", "kid"],
            where: {
                cre_time: {
                    [Op.gt]: date,
                },
            },
        })
    }

    /**
     * 注意, private key在里面
     * @throws db operation errors
     * @returns a random jwk
     */
    static async getRandomAvailableJwk() {
        let available_jwks = await AuthUtils.getAvailableJwks();
        return available_jwks[Math.round(Math.random() * (available_jwks.length - 1))];
    }

    /**
     * @throws db operation errors
     */
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