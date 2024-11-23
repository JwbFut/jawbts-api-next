import { createKysely } from '@vercel/postgres-kysely';

export const jaw_db = createKysely<Database>();

export interface Database {
    jwks: JwksTable;
    users: UsersTable;
}

export interface RefTokenType {
    state_c: string | null;
    ref_token: string | null;
    exp_time: Date | string | null;
    desc_c: string | null;
    scope: string[] | null;
    otp_code: string | null;
}

export interface MusicDataType {
    title: string;
    author: string;
    inner_id: string;
    tags: string[];
    static_tags: string[];
    likes: number;
}

export interface AsyncKeyType {
    music_data: number;
}

export interface JwksTable {
    n: string;
    pri_key: string;
    cre_time: Date;
    kid: string;
}

export interface UsersTable {
    id: number;
    username: string;
    avatar_url: string;
    description: string;
    ref_tokens: RefTokenType[];
    music_data: MusicDataType[];
    async_key: AsyncKeyType;
}