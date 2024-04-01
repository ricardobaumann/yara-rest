const prisma = require("../db/prisma");

/**
 * List warehouses
 * @returns {Prisma.PrismaPromise<GetResult<Prisma.$WarehousePayload<DefaultArgs>, Prisma.WarehouseFindManyArgs<DefaultArgs>, "findMany">>}
 */
const listWarehouses = ()=> {
    return prisma.warehouse.findMany();
}

module.exports = listWarehouses;