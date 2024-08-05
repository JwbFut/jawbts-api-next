import { createKysely } from '@vercel/postgres-kysely';

export const jaw_db = createKysely<Database>();

export interface Database {
    jwks: JwksTable;
    users: UsersTable;
}

export interface RefTokenType {
    state_c: string | null; // length: 15
    ref_token: string | null; // length: 20
    exp_time: Date | string | null;
    desc_c: string | null; // description
    scope: string[] | null;
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
}