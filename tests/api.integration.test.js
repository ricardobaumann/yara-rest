
const prisma = require("../db/prisma");
import { expect, describe, it, beforeEach } from "vitest";
const request = require('supertest');

const app = require("../app")
const warehouseId = crypto.randomUUID().toString();
const hazardousWhId = crypto.randomUUID().toString();
const nonHazardousWh = crypto.randomUUID().toString();

describe('List warehouses', () => {

    beforeEach(async () => {
        await prisma.$transaction([
            prisma.transaction.deleteMany(),
            prisma.warehouse.deleteMany(),
            prisma.warehouse.create({
                data: {
                    id: warehouseId,
                    code: "ABC"
                }
            }),
            prisma.warehouse.create({
                data: {
                    id: hazardousWhId,
                    code: "FOO",
                    hazardous: true
                }
            })
       ]);
        expect(await prisma.warehouse.count()).toBe(2);
    })

    it("should list warehouses",async()=> {
        const response = await request(app).get("/warehouses");
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual([
            {
                id: warehouseId,
                code: "ABC",
                hazardous: null,
                capacity: 100,
                occupied: "0"
            },
            {
                id: hazardousWhId,
                code: "FOO",
                hazardous: true,
                capacity: 100,
                occupied: "0"
            }
        ]);
    })

});

describe("List transactions",()=> {
    let id = crypto.randomUUID().toString();
    let productId = crypto.randomUUID().toString();
    let batchId = crypto.randomUUID().toString();
    beforeEach(async () =>{
        await prisma.$transaction([
            prisma.transaction.deleteMany(),
            prisma.warehouse.deleteMany(),
            prisma.warehouse.create({
                data: {
                    id: warehouseId,
                    code: "ABC"
                }
            }),
            prisma.transaction.create({
                data: {
                    id: id,
                    hazardous: true,
                    product_id: productId,
                    warehouse_id: warehouseId,
                    batch_id: batchId,
                    amount: 10,
                    sizePerUnit: 1
                }
            })
        ]);
    })

    it("should return transactions from a warehouse",async () => {
        const response = await request(app)
            .get(`/warehouses/${warehouseId}/transactions`);
        expect(response.body).toStrictEqual([
            {
                id: id,
                hazardous: true,
                product_id: productId,
                warehouse_id: warehouseId,
                batch_id: batchId,
                amount: "10",
                sizePerUnit: 1
            }
        ]);
    })

    it("should return empty on empty warehouse",async () => {
        const response = await request(app)
            .get(`/warehouses/${nonHazardousWh}/transactions`);
        expect(response.body.length).toBe(0);
    })
})

describe("Create transactions",()=> {
    beforeEach(async () => {
        await prisma.$transaction([
            prisma.transaction.deleteMany(),
            prisma.warehouse.deleteMany(),
            prisma.warehouse.create({
                data: {
                    id: warehouseId,
                    code: "ABC"
                }
            }),
            prisma.warehouse.create({
                data: {
                    id: hazardousWhId,
                    code: "FOO",
                    hazardous: true
                }
            }),
            prisma.warehouse.create({
                data: {
                    id: nonHazardousWh,
                    code: "BAR",
                    hazardous: false
                }
            })
        ]);
        expect(await prisma.warehouse.count()).toBe(3);
    })

    it("should create transactions and flag warehouse accordingly",async () => {
        const response = await request(app)
            .post(`/warehouses/${warehouseId}/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 20,
                    sizePerUnit: 1
                },
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 30,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(200);
        expect(await prisma.transaction.count()).toBe(2);
        let warehouse = await prisma.warehouse.findUnique({where: {id: warehouseId}});
        expect(warehouse.occupied.toString()).toBe("50");
        expect(warehouse.hazardous).toBe(true);
    })

    it("should not allow non-hazardous products in a hazardous warehouse",async () => {
        const response = await request(app)
            .post(`/warehouses/${hazardousWhId}/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: false,
                    amount: 20,
                    sizePerUnit: 1
                },
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 20,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(400);
        expect(await prisma.transaction.count()).toBe(0);
        expect(response.body).toStrictEqual({
            message: "HAZARDOUS_MIX_NOT_ALLOWED"
        });
    })

    it("should not allow hazardous products in a non-hazardous warehouse",async () => {
        const response = await request(app)
            .post(`/warehouses/${nonHazardousWh}/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 10,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: "INVALID_HAZARDOUS_FLAG"
        });
        expect(await prisma.transaction.count()).toBe(0);
    })

    it("should not allow negative product amount",async () => {
        let productId = crypto.randomUUID().toString();
        await prisma.transaction.create({
            data: {
                product_id: productId,
                hazardous: false,
                amount: 20,
                id: crypto.randomUUID().toString(),
                batch_id: crypto.randomUUID().toString(),
                warehouse_id: nonHazardousWh
            }
        })
        const response = await request(app)
            .post(`/warehouses/${nonHazardousWh}/transactions`)
            .send([
                {
                    product_id: productId,
                    hazardous: false,
                    amount: -100.5,
                    sizePerUnit: 1
                },
                {
                    product_id: productId,
                    hazardous: false,
                    amount: -100.5,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: "INVALID_PRODUCT_AMOUNT"
        });
        expect(await prisma.transaction.count()).toBe(1);
    })

    it("should not allow negative product amount on empty warehouse",async () => {
        const response = await request(app)
            .post(`/warehouses/${nonHazardousWh}/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: false,
                    amount: -100.5,
                    sizePerUnit: 1
                },
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: false,
                    amount: -100.5,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: "INVALID_PRODUCT_AMOUNT"
        });
        expect(await prisma.transaction.count()).toBe(0);
    })

    it("should not allow more products than warehouse capacity",async () => {
        const response = await request(app)
            .post(`/warehouses/${nonHazardousWh}/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: false,
                    amount: 50,
                    sizePerUnit: 2
                },
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: false,
                    amount: 1,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: "WAREHOUSE_OVERFLOW"
        });
        expect(await prisma.transaction.count()).toBe(0);
    })

    it("should validate warehouse id",async () => {
        const response = await request(app)
            .post(`/warehouses/foobar/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 100.5,
                    sizePerUnit: 1
                }
            ]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: "INVALID_WAREHOUSE"
        });
    })

    it("should validate body attributes",async () => {
        const response = await request(app)
            .post(`/warehouses/${warehouseId}/transactions`)
            .send([
                {
                    product_id: "",
                }
            ]);
        expect(response.status).toBe(422);
        let errors = response.body.errors;
        expect(errors[0].path).toBe("[0].product_id");
        expect(errors[0].msg).toBe("Invalid value");

        expect(errors[1].path).toBe("[0].amount");
        expect(errors[1].msg).toBe("Invalid value");

        expect(errors[2].path).toBe("[0].amount");
        expect(errors[2].msg).toBe("Invalid value");

        expect(errors[3].path).toBe("[0].hazardous");
        expect(errors[3].msg).toBe("Invalid value");
    })


})