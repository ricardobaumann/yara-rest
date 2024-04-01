# Warehouse REST Backend

Backend for warehouse and transactions management

## Endpoint

For API usage examples, check the [integration tests](api.integration.test.js)

## Architecture
The service stack includes:
* [express.js](https://expressjs.com/): NodeJS web framework
* [prisma.js](https://www.prisma.io/): ORM manager framework for JS
* [PostgreSQL DB](https://www.postgresql.org/): The best relation database in town

## Requirements
1. `npm`
2. `docker`
3. `docker-compose`
  
## Usage

To setup and run the service on your local, run

`chmod +x run_local.sh && ./run_local.sh`

