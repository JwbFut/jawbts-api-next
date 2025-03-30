"server only"

import { Sequelize } from "sequelize";

if (typeof process.env.POSTGRES_URL !== "string") {
    throw new Error("POSTGRES_URL environment variable not set");
}

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: "postgres",
    dialectModule: require("pg"),
});

export default sequelize;