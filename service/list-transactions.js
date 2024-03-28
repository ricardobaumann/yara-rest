const prisma = require("../db/prisma");

const listTransactions = (warehouseId)=> {
    return prisma.transaction.findMany({
        where: {
            warehouse_id: warehouseId
        }
    });
}

module.exports = listTransactions;