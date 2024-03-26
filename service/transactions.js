const prisma = require("../db/prisma");

const createTransaction = async(transactions, id)=> {
    const batchId = crypto.randomUUID().toString();
    return prisma.transaction.create({
        data: {
            warehouse_id: id,
            batch_id: batchId,
            hazardous: true,
            product_id: crypto.randomUUID().toString(),
            id: crypto.randomUUID().toString()
        }
    })
    /*
    return prisma.$transaction(
        transactions.map(transaction => {
            return prisma.transaction.create({
                data: {
                    warehouse_id: id,
                    batch_id: batchId,
                    hazardous: transaction['hazardous'],
                    product_id: transaction['product_id'],
                    id: crypto.randomUUID().toString()
                }
            })
        })
    )
     */
}
module.exports = createTransaction;