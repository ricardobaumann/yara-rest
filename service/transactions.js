const prisma = require("../db/prisma");

class BusinessError extends Error{
    constructor(message,code) {
        super(message);
        this.code = code;
    }
}

function sumByProduct(transactions) {
    var holder = {};

    transactions.forEach(function(d) {
        if (holder.hasOwnProperty(d.product_id)) {
            holder[d.product_id] = holder[d.product_id] + d.amount;
        } else {
            holder[d.product_id] = d.amount;
        }
    });

    var obj2 = [];

    for (var prop in holder) {
        obj2.push({ product_id: prop, amount: holder[prop] });
    }
    return obj2;
}

async function validateProductAmount(transactions, id, tx) {
    let amountsPerProduct = sumByProduct(transactions);
    const dbAmountsPerProduct = await tx.transaction.groupBy({
        by: "product_id",
        where: {
            product_id: {
                in: amountsPerProduct.map(prod => prod.product_id)
            },
            warehouse_id: id
        },
        _sum: {
            amount: true
        }
    });
    amountsPerProduct.forEach(amountPerProd => {
        let dbAmountPerProd = dbAmountsPerProduct.find(dbProd => dbProd.product_id === amountPerProd.product_id);
        let dbAmount = dbAmountPerProd == null ? 0 : dbAmountPerProd['_sum'].amount;
        if ((parseFloat(dbAmount) + parseFloat(amountPerProd.amount)) < 0) {
            throw new BusinessError("INVALID_PRODUCT_AMOUNT", 400);
        }
    })
}

async function validateAndUpdateWh(transactions, id, tx) {
    let warehouse = await tx.warehouse.findUnique({where: {id: id}});
    if (warehouse == null) {
        throw new BusinessError("INVALID_WAREHOUSE", 400);
    }

    if (warehouse.hazardous !== null) {
        let hazNotMatches = transactions.some(item => item['hazardous'] !== warehouse.hazardous);
        if (hazNotMatches) {
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
    }
}

const createTransaction = (transactions, id)=> {
    return prisma.$transaction(async tx => {

        await validateAndUpdateWh(transactions, id, tx);

        await validateProductAmount(transactions, id, tx);

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