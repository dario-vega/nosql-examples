const fdk=require('@fnproject/fdk');
const process = require('process');
const NoSQLClient = require('oracle-nosqldb').NoSQLClient;
const Region = require('oracle-nosqldb').Region;
const ServiceType = require('oracle-nosqldb').ServiceType;
const url = require('url');

let client;
let lim = 15;

process.on('exit', function(code) {
  if (client) {
     console.log("\close client  on exit");
     client.close();
  }
  return code;
});

fdk.handle(async function(input, ctx){

  let ticketNo;
  let confNo;
  let endPoint;

  // Reading parameters from standard input for TEST purposes
  if (input && input.endPoint)
    endPoint = input.endPoint;
  if (input && input.ticketNo)
    ticketNo = input.ticketNo;
  if (input && input.confNo)
    confNo = input.confNo;

  // Reading parameters sent by the httpGateway
  let hctx = ctx.httpGateway
  if (hctx  && hctx.requestURL) {
        var adr = hctx.requestURL;
        var q = url.parse(adr, true);
        endPoint = q.pathname.split('/')[2]
        ticketNo = q.query.ticketNo
        confNo = q.query.confNo
  }


  if ( !client ) {
    client = createClientResource();
  }

  let rows;
  if (endPoint == "getBagInfoByTicketNumber") {
     rows = await getBagInfoByTicketNumber(ticketNo);
  }
  else if (endPoint == "getPassengersAffectedByFlight") {
     const statementQry1 = `SELECT d.ticketNo as ticketNo, d.fullName as fullName, d.contactPhone as contactInfo, size(d.bagInfo) as numBags FROM demo d WHERE d.bagInfo.flightLegs.flightNo =ANY 'BM715'`
     rows = {'message': endPoint + " under construction." , "sql" : statementQry1, "index" : "bagInfo.flightLegs.flightNo"}
  }
  else if ((endPoint == "getByConfirmationCode") && (confNo)) {
     rows = await getByConfirmationCode(confNo);
  }
  else if ((endPoint == "getByConfirmationCode") && !(confNo)) {
     rows = {'message': endPoint + " missing parameter confNo"}
     hctx.statusCode=500;
  }  
  else {
     rows = {'message': endPoint + " not managed"}
     hctx.statusCode=500;
  }

  //if (client) {
  //         client.close();
  //}

  return rows;
  return process.version;


}, {});

async function getBagInfoByTicketNumber (ticketNo) {
  const statementQry1 = `SELECT * FROM demo LIMIT ${lim}`;

  if (ticketNo)
     return executePreparedQuery(
       'DECLARE $ticketNo STRING; SELECT * FROM demo WHERE ticketNo = $ticketNo',
       { $ticketNo: String(ticketNo) }
     );
  else
     return executeQuery(statementQry1);
}

async function getByConfirmationCode (confNo) {
  return executePreparedQuery(
    'DECLARE $confNo STRING; SELECT * FROM demo WHERE confNo = $confNo',
    { $confNo: String(confNo) }
  );
}


async function executeQuery (statement) {
  const rows = [];
  let cnt ;
  let res;
  try {
    do {
       res = await client.query(statement, { continuationKey:cnt});
       rows.push.apply(rows, res.rows);
       cnt = res.continuationKey;
    } while(res.continuationKey != null);
  }
  catch(err) {
        return err;
  }
  return rows;
}

async function executePreparedQuery (statement, bindings) {
  const rows = [];
  try {
    const preparedStmt = await client.prepare(statement);
    preparedStmt.bindings = bindings;
    for await(const res of client.queryIterable(preparedStmt)) {
       rows.push.apply(rows, res.rows);
    }
  }
  catch(err) {
        return err;
  }
  return rows;
}

function createClientResource() {
  return  new NoSQLClient({
    region: process.env.NOSQL_REGION,
    compartment:process.env.NOSQL_COMPARTMENT_ID,
    auth: {
        iam: {
            useResourcePrincipal: true
        }
    }
  });
}
