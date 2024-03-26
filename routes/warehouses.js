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
    await createTransaction(req.body, req.params.id)
        .then(value => {
            res.json(value);
        }).catch(reason => {
            res.status(reason.code).json({message: reason.message});
        })
});
module.exports = router;
