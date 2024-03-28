const prisma = require("../db/prisma");
const {free} = require("yarn/lib/cli");

class BusinessError extends Error{
    constructor(message,code) {
        super(message);
        this.code = code;
    }
}

function sumByProduct(transactions) {
    let holder = {};

    transactions.forEach(function(d) {
        if (holder.hasOwnProperty(d.product_id)) {
            holder[d.product_id] = holder[d.product_id] + d.amount;
        } else {
            holder[d.product_id] = d.amount;
        }
    });

    let newObj = [];

    for (let prop in holder) {
        newObj.push({ product_id: prop, amount: holder[prop] });
    }
    return newObj;
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

async function validateAndUpdateHazardousFlag(transactions, id, tx, warehouse) {
    let batchFirstHazardous = transactions[0]['hazardous'];
    if (!(transactions.every(item => item['hazardous'] === batchFirstHazardous))) {
        throw new BusinessError("HAZARDOUS_MIX_NOT_ALLOWED", 400);
    }

    if (warehouse.hazardous !== null) {
        let hazNotMatches = batchFirstHazardous !== warehouse.hazardous;
        if (hazNotMatches) {
            throw new BusinessError("INVALID_HAZARDOUS_FLAG", 400);
        }
    } else {
        await tx.warehouse.update({
            where: {
                id: id
            },
            data: {
                hazardous: batchFirstHazardous
            }
        })
    }
}

function validateWarehouseCapacity(transactions, warehouse) {
    let initialValue = 0;
    let sum = transactions.reduce(
        (accumulator, currentValue) => accumulator + (parseInt(currentValue['sizePerUnit']) * parseFloat(currentValue['amount'])),
        initialValue
    );
    let freeCapacity = (warehouse.capacity - warehouse.occupied);
    console.log(`Warehouse free capacity: ${freeCapacity}`);
    if (freeCapacity < sum) {
        throw new BusinessError("WAREHOUSE_OVERFLOW", 400);
    }
    return (freeCapacity - sum);
}

const createTransaction = (transactions, id)=> {
    return prisma.$transaction(async tx => {
        let warehouse = await tx.warehouse.findUnique({where: {id: id}});
        if (warehouse == null) {
            throw new BusinessError("INVALID_WAREHOUSE", 400);
        }
        let newFreeCapacity = validateWarehouseCapacity(transactions, warehouse);
        await validateAndUpdateHazardousFlag(transactions, id, tx, warehouse);
        const batchId = crypto.randomUUID().toString();

        await validateProductAmount(transactions, id, tx);

        await tx.transaction.createMany({
            data: transactions
                .map(item => {
                return {
                    warehouse_id: id,
                    batch_id: batchId,
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

        await tx.warehouse.update({
            where: {
                id: id
            },
            data : {
              occupied: newFreeCapacity
            }
        });
    });
}
module.exports = createTransaction;