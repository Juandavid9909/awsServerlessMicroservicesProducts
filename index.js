import { GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { ddbClient } from "./ddbClient";

exports.handler = async(event) => {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // TODO - switch case event.httpmethod to perform CRUD operations
    // with using ddbClient object

    switch (event.httpMethod) {
        case "GET":
            if (event.pathParameters != null) {
                body = await getProduct(event.pathParameters.id); // GET /product/1
            } else {
                body = await getAllProducts(); // GET /product
            }
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain"
        },
        body: `Hello from Product ! You've hit ${ event.path }\n`
    };
};

const getProduct = async(productId) => {
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ id: productId })
        };

        const { Item } = await ddbClient.send(new GetItemCommand(params));

        return Item ? unmarshall(Item) : {};
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getAllProducts = async() => {
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        };

        const { Items } = await ddbClient.send(new ScanCommand(params));

        return Items ? Items.map((item) => unmarshall(item)) : {};
    } catch (error) {
        console.error(error);
        throw error;
    }
};