var express = require('express');
var router = express.Router();
const prisma = require("../db/prisma");
const createTransaction = require("../service/transactions")
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({ extended: false });

/* GET users listing. */
router.get('/', async function (req, res, next) {
  await prisma.warehouse.findMany()
      .then(data => {
        res.json(data);
      })
});

router.post("/:id/transactions",parseUrlencoded, async function(req, res, next){
    const result = await prisma.transaction.createMany({
        data: req.body.map(item => {
            return  {
                warehouse_id: req.params.id,
                batch_id: crypto.randomUUID().toString(),
                id: crypto.randomUUID().toString(),
                ...item
            }
        })
    });
    res.json(result);
});
module.exports = router;
