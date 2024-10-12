import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

import { ddbClient } from "./ddbClient";

exports.handler = async(event) => {
    console.log("request:", JSON.stringify(event, undefined, 2));

    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.queryStringParameters != null) {
                    body = await getProductsByCategory(event);
                } else if (event.pathParameters != null) {
                    body = await getProduct(event.pathParameters.id); // GET /product/1
                } else {
                    body = await getAllProducts(); // GET /product
                }

                break;

            case "POST":
                body = await createProduct(event);

                break;

            case "PUT":
                bodu = await updateProduct(event);

                break;

            case "DELETE":
                body = await deleteProduct(event.pathParameters.id);

                break;

            default:
                throw new Error(`Unsupported route: "${event.httpMethod}"`);
        }

        console.log(body);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body
            })
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: error.message,
                errorStack: error.stack
            })
        }
    }
};

const getProductsByCategory = async(event) => {
    console.log("getProductsByCategory");

    try {
        const productId = event.pathParameters.id;
        const category = event.queryStringParameters.category;

        const params = {
            KeyConditionExpression: "id = :productId",
            FilterExpression: "contains (category, :category)",
            ExpressionAttributeValues: {
                ":productId": { S: productId },
                "category": { S: category }
            },
            TableName: process.env.DYNAMODB_TABLE_NAME
        };

        const { Items } = await ddbClient.send(new QueryCommand(params));

        console.log(Items);

        return Items.map((item) => unmarshall(item));
    } catch (error) {
        console.error(error);
        throw e;
    }
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

const updateProduct = async(event) => {
        console.log(`updateProduct function. event: "${event}"`);

        try {
            const requestBody = JSON.parse(event.body);
            const objKeys = Object.keys(requestBody);

            const params = {
                    TableName: process.env.DYNAMODB_TABLE_NAME,
                    Key: marshall({ id: event.pathParameters.id }),
                    UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: requestBody[key]
            }), {}))
        };

        const updateResult = await ddbClient.send(new PutItemCommand(params));

        console.log(updateResult);

        return updateResult;
    } catch (error) {
        console.error(e);

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
};