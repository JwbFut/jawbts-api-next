## Jawbts Api
基于next.js框架的api, 应当被部署在vercel的serverless服务上.

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