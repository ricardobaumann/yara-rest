var express = require('express');
var router = express.Router();
const createTransaction = require("../service/create-transactions")
const listWarehouses = require("../service/list-warehouses")
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({ extended: false });
const { body, validationResult} = require("express-validator");

router.get('/', async function (req, res, next) {
  await listWarehouses()
      .then(data => {
        res.json(data);
      })
});

router.post("/:id/transactions",
    body().isArray().notEmpty(),
    body("*.product_id").exists().notEmpty().isString(),
    body("*.amount").exists().isNumeric(),
    body("*.hazardous").exists().isBoolean(),
    body("*.sizePerUnit").exists().isInt(),
    parseUrlencoded,
    async function(req, res, next){
    let transactionsBody = req.body;
    console.log(`Body: ${JSON.stringify(transactionsBody)}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let array = errors.array();
        console.log(`Errors: ${JSON.stringify(array)}`)
        return res.status(422)
            .json({errors: array})
    }
        await createTransaction(transactionsBody, req.params.id)
        .then(() => {
            res.json();
        }).catch(reason => {
            console.log(`Failed ${reason.message}`);
            res.status(reason.code).json({message: reason.message});
        })
});

module.exports = router;
