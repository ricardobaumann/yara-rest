const prisma = require("../db/prisma");

const listWarehouses = ()=> {
    return prisma.warehouse.findMany();
}

module.exports = listWarehouses;