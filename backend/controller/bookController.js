

import { fromEnv } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

import dotenv from "dotenv";
 
dotenv.config()

const clickMap = new Map()

const getBooks = async (req, res) => {
  
  if (process.env.NODE_ENV == 'production'){
    var client = new DynamoDBClient({ 
      region: process.env.AWS_REGION, 
    });
  }else{
    var client = new DynamoDBClient({ 
      region: process.env.AWS_REGION, 
      credentials: fromEnv() 
    });
  }

  const docClient = DynamoDBDocumentClient.from(client);
  const command = new ScanCommand({
    TableName: "tb_books",
  });

  const response = await docClient.send(command);

  const books = [];
  for (var i in response.Items) {
    books.push(response.Items[i]);
  }

  res.contentType = 'application/json';
  console.log(books);
  res.json(books);

  return res;

};

async function clickRegister(bookId, docClient) {
  if (clickMap.has(bookId)) {
    let clickerCount = clickMap.get(bookId) + 1
    console.log(clickerCount)
    clickMap.set(bookId, clickerCount)

  }
  else {
    clickMap.set(bookId, 1)
  }

  let updatedCommand = new PutCommand({
    Item: {
      visit: crypto.randomUUID(),
      bookId: bookId,
      timestamp:new Date().toISOString()
    },
    TableName: "tb_visits",
  })
  const response = await docClient.send(updatedCommand)

}

const getBooksById = async (req, res) => {
  if (process.env.NODE_ENV == 'production'){
    var client = new DynamoDBClient({ 
      region: process.env.AWS_REGION, 
    });
  }else{
    var client = new DynamoDBClient({ 
      region: process.env.AWS_REGION, 
      credentials: fromEnv() 
    });
  }

  const docClient = DynamoDBDocumentClient.from(client);

  const command = new GetCommand({
    TableName: "tb_books",
    Key: {
      id: req.params.id,
    },
  });

  clickRegister(req.params.id, docClient)
  const response = await docClient.send(command);
  console.log(response.Item);
  res.json(response.Item)
  console.log([...clickMap.entries()])
  return res;
};

export { getBooksById, getBooks }