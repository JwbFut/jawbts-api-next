import { DataTypes, Model } from "sequelize";
import sequelize from "@/components/database/db";

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

export class User extends Model {
    declare id: number;
    declare username: string;
    declare avatar_url: string;
    declare description: string;
    declare ref_tokens: RefTokenType[];
    declare music_data: MusicDataType[];
    declare async_key: AsyncKeyType;
}

User.init({
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
    },
    username: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },
    avatar_url: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ref_tokens: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    music_data: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    async_key: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'users',
    timestamps: false,
});

export class Jwk extends Model {
    declare n: string;
    declare pri_key: string;
    declare cre_time: Date;
    declare kid: string;
}

Jwk.init({
    n: {
        type: DataTypes.STRING(683),
        allowNull: false
    },
    pri_key: {
        type: DataTypes.STRING(3322),
        allowNull: false
    },
    cre_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    kid: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true
    },
}, {
    sequelize,
    tableName: "jwks",
    timestamps: false,
});