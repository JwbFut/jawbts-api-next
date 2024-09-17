import crypto from 'crypto';

export class BiliBiliUtils {
    static mixinKeyEncTab = [
        46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
        33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
        61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
        36, 20, 34, 44, 52
    ];

    // 对 imgKey 和 subKey 进行字符顺序打乱编码
    static getMixinKey(str: string) {
        let res = "";
        this.mixinKeyEncTab.forEach((k) => {
            if (k >= str.length) return;
            res += str[k];
        });
        return res;
    }

    // 为请求参数进行 wbi 签名
    static async encWbi(params: string) {
        const mixin_key = this.getMixinKey(await this.getWbiKeys());
        const wbi_sign = this.md5(params + mixin_key) // 计算 w_rid 签名
        return params + '&w_rid=' + wbi_sign;
    }

    /**
     * 获得Wbi Keys, 缓存5min
     * @returns Wbi Keys
     */
    static async getWbiKeys() {
        // 注意, 缓存5分钟
        const res = await fetch('https://api.bilibili.com/x/web-interface/nav', { next: { revalidate: 300 } });
        const { data: { wbi_img: { img_url, sub_url } } } = await res.json()

        return img_url.slice(
            img_url.lastIndexOf('/') + 1,
            img_url.lastIndexOf('.')) +
            sub_url.slice(
                sub_url.lastIndexOf('/') + 1,
                sub_url.lastIndexOf('.')
            );
    }

    /**
     * md5摘要算法
     * @param str input
     * @returns md5
     */
    static md5(str: string) {
        const md5 = crypto.createHash('md5');
        return md5.update(str).digest('hex');
    }
}