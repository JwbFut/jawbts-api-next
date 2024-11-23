## Jawbts Api
自己写的小api罢了.  

## 部署相关

注意, 它需要联动前端, 也就是[Jawbts Website Next](https://github.com/winsrewu/jawbts-website-next/).  
请参照.env.example文件配置环境变量.  
关于api和api-domestic的区别, 因为这个服务我部署在vercel上面, 访问国内网站慢, 所以要第二个api, 也就是api-domestic, 也就是这个仓库的domestic分支. 它其实就是main的阉割版.  
注意, origin指的是你这个服务部署的url, 也就是你访问这个网站的url.  

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## SQL初始化
### jwks
```sql
CREATE TABLE jwks (
    n           CHAR(683)   NOT NULL,
    pri_key     CHAR(3322)  NOT NULL,
    cre_time    TIMESTAMPTZ NOT NULL,
    kid         CHAR(8)     NOT NULL PRIMARY KEY
);
```
### users
```sql
CREATE TABLE users (
    id          BIGINT      NOT NULL PRIMARY KEY,
    username    TEXT        NOT NULL UNIQUE,
    avatar_url  TEXT        NOT NULL,
    description TEXT        NOT NULL,
    ref_tokens  JSONB       NOT NULL,
    music_data  JSONB       NOT NULL,
    async_key   JSONB       NOT NULL
);
```
### 用户
```sql
INSERT INTO users (id, username, avatar_url, description, ref_tokens, music_data) VALUES (78122384,'winsrewu','https://avatars.githubusercontent.com/u/78122384?v=4','','[]', '[]');
```
注: 为了安全原因, avatar_url只支 https://avatars.githubusercontent.com/u/...  当然你用dataurl也不是不行  