const prisma = require("../db/prisma");

class BusinessError extends Error{
    constructor(message,code) {
        super(message);
        this.code = code;
    }
}

const createTransaction = (transactions, id)=> {
    return prisma.$transaction(async tx => {

        let warehouse = await tx.warehouse.findUnique({where: {id: id}});
        console.log(`Warehouse: ${warehouse == null}`)
        if (warehouse == null) {
            throw new BusinessError("INVALID_WAREHOUSE", 400);
        }

        if (warehouse.hazardous !== null) {
            let hazNotMatches = transactions.some(item => item['hazardous'] !== warehouse.hazardous);
            if(hazNotMatches) {
                throw new BusinessError("INVALID_HAZARDOUS_FLAG", 400);
            }
        } else {
            let whHazardous = transactions[0]['hazardous'];
            await tx.warehouse.update({
                where: {
                    id: id
                },
                data: {
                    hazardous: whHazardous
                }
            })
            warehouse = await tx.warehouse.findUnique({where: {id: id}});
        }

        await tx.transaction.createMany({
            data: transactions
                .map(item => {
                return {
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
                throw new BusinessError("INVALID_WAREHOUSE", 400);
            } else {
                throw new BusinessError("UNKNOWN_ERROR", 500);
            }
        })
    });
}
module.exports = createTransaction;