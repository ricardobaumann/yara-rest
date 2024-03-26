const prisma = require("../db/prisma");

const initDB = async () => {
    return prisma.$transaction([
        prisma.transaction.deleteMany(),
        prisma.warehouse.deleteMany(),
        prisma.warehouse.create({
            data: {
                id: crypto.randomUUID().toString(),
                code: "ABC"
            }
        })
    ])
}

module.exports = initDB;