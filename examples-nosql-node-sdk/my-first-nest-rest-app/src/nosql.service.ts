import { BadRequestException } from '@nestjs/common';
import { NoSQLClient, ServiceType, QueryResult, CapacityMode } from 'oracle-nosqldb';

const MAX_LIMIT = 100;
const SQL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ORDER_COLUMNS = new Set(['id']);

export class NoSQLService {

    connection: any;
    private static instance: NoSQLService;

    private constructor() {
        this.creatDbConnection();
    }

    static async initDb() {
        if (!this.instance) {
            this.instance = new NoSQLService();
        }
        return this.instance;
    }

    static getInstance() {
        return this.instance;
    }

    getConnection() {
        return this.connection;
    }

    static async findAll(tablename, params) {
      let rows = [];
      if (!SQL_IDENTIFIER.test(tablename))
         throw new BadRequestException('Invalid table name');

      let statement = `SELECT * FROM ${tablename}`;
      const orderby = this.getOrderByClause(params.orderby);
      if (orderby == null)
         throw new BadRequestException('Invalid orderby');

      const limit = this.parsePositiveInt(params.limit);
      const page = this.parsePage(params.page);

      if (orderby)
         statement = statement + orderby;
      if (limit)
         statement = statement + " LIMIT " + limit;
      if (page && limit)
         statement = statement + " OFFSET " + page*limit;

      for await(const res of this.getInstance().getConnection().queryIterable(statement)) {
        rows.push.apply(rows, res.rows);
      }
      return rows;
    }

    private static parsePositiveInt(value, defaultValue = undefined) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 1)
         return defaultValue;
      return Math.min(parsed, MAX_LIMIT);
    }

    private static parsePage(value) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 0)
         return 0;
      return parsed;
    }

    private static getOrderByClause(orderby) {
      if (!orderby)
         return '';

      const clauses = String(orderby).split(',').map((part) => {
         const match = part.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(ASC|DESC))?$/i);
         if (!match || !ORDER_COLUMNS.has(match[1]))
            return null;
         return match[1] + (match[2] ? ' ' + match[2].toUpperCase() : '');
      });

      if (clauses.some((clause) => clause == null))
         return null;

      return ' ORDER BY ' + clauses.join(', ');
    }

    static async findOne (tablename, id) {
        const result = await this.getInstance().getConnection().get(tablename, { id })
        if (result.row)
          return result.row;
        else
          return {}
    }

    static async create (tablename, record) {
        const result = await this.getInstance().getConnection().put(tablename, record );
        return { result: result};
    }

    static async update (tablename, id,  record) {
        const result = await this.getInstance().getConnection().putIfPresent(tablename, Object.assign(record, {id}) );
        return { result: result};
    }

    static async remove (tablename, id) {
        const result = await this.getInstance().getConnection().delete(tablename, { id });
        return { result: result};
    }

    static async createDbTable() {
       const createDDL = 'CREATE TABLE IF NOT EXISTS users (id String, info JSON , PRIMARY KEY (id))';
       // readUnits, writeUnits, storageGB using same values as for Always free
       let resTab = await this.getInstance().getConnection().tableDDL(createDDL, {
         tableLimits: {
            // mode: CapacityMode.ON_DEMAND,
            mode: CapacityMode.PROVISIONED,
            readUnits: 50,
            writeUnits: 50,
            storageGB: 25
         }
         , complete: true
       }) ;
       console.log('  Creating table %s', resTab.tableName);
       console.log('  Table state: %s', resTab.tableState.name);
    }

    private creatDbConnection() {
       switch(process.env.NOSQL_ServiceType) {
       case 'useInstancePrincipal':
           this.connection = new NoSQLClient({
               serviceType: ServiceType.CLOUD,
               region: process.env.NOSQL_REGION ,
               compartment:process.env.NOSQL_COMPID,
               auth: {
                 iam: {
                     useInstancePrincipal: true
                 }
               }
           });
           break;
       case 'useDelegationToken':
           this.connection = new NoSQLClient({
               serviceType: ServiceType.CLOUD,
               region: process.env.NOSQL_REGION ,
               compartment:process.env.NOSQL_COMPID,
               auth: {
                 iam: {
                     useInstancePrincipal: true,
                     delegationTokenProvider: process.env.OCI_DELEGATION_TOKEN_FILE
                 }
               }
           });
           break;
       default:
          // on-premise non-secure configuration or Cloud Simulator
          this.connection = new NoSQLClient({
               serviceType: ServiceType.KVSTORE,
               endpoint: process.env.NOSQL_ENDPOINT + ":" + process.env.NOSQL_PORT
           });
       }
    }

}
