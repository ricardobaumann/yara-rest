
const prisma = require("../db/prisma");
import { expect, describe, it, beforeEach } from "vitest";
const request = require('supertest');

const app = require("../app")
const warehouseId = crypto.randomUUID().toString();
describe('GET warehouses', () => {

    beforeEach(async () => {
        await prisma.$transaction([
            prisma.transaction.deleteMany(),
            prisma.warehouse.deleteMany(),
            prisma.warehouse.create({
                data: {
                    id: warehouseId,
                    code: "ABC"
                }
            })
       ])
    })

    it("should list warehouses",async()=> {
        const response = await request(app).get("/warehouses");
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual([
            {
                id: warehouseId,
                code: "ABC"
            }
        ]);
    })

});

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
            })
        ])
    })

    it("should create transactions",async () => {
        const response = await request(app)
            .post(`/warehouses/${warehouseId}/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 100.5
                },
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 200.23
                }
            ]);
        expect(response.status).toBe(200);
        expect(await prisma.transaction.count()).toBe(2);
    })

    it("should validate warehouse id",async () => {
        const response = await request(app)
            .post(`/warehouses/foobar/transactions`)
            .send([
                {
                    product_id: crypto.randomUUID().toString(),
                    hazardous: true,
                    amount: 100.5
                }
            ]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: "INVALID_WAREHOUSE"
        });
    })
})