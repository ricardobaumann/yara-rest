var express = require('express');
var router = express.Router();
const prisma = require("../db/prisma");

/* GET users listing. */
router.get('/', async function (req, res, next) {
  await prisma.warehouse.findMany()
      .then(data => {
        res.json(data);
      })
});

module.exports = router;
