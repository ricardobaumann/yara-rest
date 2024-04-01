const prisma = require("../db/prisma");

/**
 * List transactions for a given warehouse id
 * @param warehouseId
 * @returns {Prisma.PrismaPromise<GetResult<Prisma.$TransactionPayload<DefaultArgs>, {where: {warehouse_id}}, "findMany">>}
 */
const listTransactions = (warehouseId)=> {
    return prisma.transaction.findMany({
        where: {
            warehouse_id: warehouseId
        }
    });
}

module.exports = listTransactions;