import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

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

            break;

        case "POST":
            body = await createProduct(event);

            break;

        case "DELETE":
            body = await deleteProduct(event.pathParameters.id);

            break;

        default:
            throw new Error(`Unsupported route: "${event.httpMethod}"`);
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
    console.log("getProduct");

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ id: productId })
        };

        const { Item } = await ddbClient.send(new GetItemCommand(params));

        console.log(Item);

        return Item ? unmarshall(Item) : {};
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getAllProducts = async() => {
    console.log("getAllProducts");

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME
        };

        const { Items } = await ddbClient.send(new ScanCommand(params));

        console.log(Items);

        return Items ? Items.map((item) => unmarshall(item)) : {};
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const createProduct = async(event) => {
    console.log(`createProduct function. event: "${event}"`);

    try {
        const productRequest = JSON.parse(event.body);

        const productId = uuidv4();
        productRequest.id = productId;

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(productRequest || {})
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));

        console.log(createResult);

        return createResult;
    } catch (error) {
        console.error(error);

        throw error;
    }
};

const deleteProduct = async(productId) => {
    console.log(`deleteProduct function. productId: "${productId}"`);

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ id: productId })
        };

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));

        console.log(deleteResult);

        return deleteResult;
    } catch (error) {
        console.error(error);

        throw error;
    }
}