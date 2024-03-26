const prisma = require("../db/prisma");

class BusinessError extends Error{
    constructor(message,code) {
        super(message);
        this.code = code;
    }
}

const createTransaction = async(transactions, id)=> {
    return prisma.transaction.createMany({
        data: transactions.map(item => {
            return  {
                warehouse_id: id,
                batch_id: crypto.randomUUID().toString(),
                id: crypto.randomUUID().toString(),
                ...item
            }
        })
    }).catch(reason => {
        let message = reason.message.toString();
        console.log(message);
        if (message.endsWith("Foreign key constraint failed on the field: `Transaction_warehouse_id_fkey (index)`")) {
            throw new BusinessError("INVALID_WAREHOUSE",400);
        } else {
            throw new BusinessError("UNKNOWN_ERROR",500);
        }
    });
}
module.exports = createTransaction;