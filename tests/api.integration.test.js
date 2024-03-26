
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
                code: "ABC",
                hazardous: null
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