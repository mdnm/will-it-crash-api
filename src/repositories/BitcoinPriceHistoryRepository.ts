import dynamodb from 'aws-sdk/clients/dynamodb';
import axios from 'axios';
import BitcoinPriceData from '../models/BitcoinPriceData';
import IBitcoinPriceHistoryRepository from './IBitcoinPriceHistoryRepository';

export default class BitcoinPriceHistoryRepository implements IBitcoinPriceHistoryRepository {
    private dynamodbClient: dynamodb.DocumentClient;
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.dynamodbClient = new dynamodb.DocumentClient();
    }

    async getPastPriceTimestampPair({ price, timestamp }: BitcoinPriceData) {
        const { Item } = await this.dynamodbClient
            .get({
                TableName: this.tableName,
                Key: {
                    price,
                    timestamp,
                },
            })
            .promise();

        if (!Item) {
            return null;
        }

        return new BitcoinPriceData({
            price: Item.price,
            timestamp: Item.timestamp,
        });
    }

    async getCurrentPriceTimestampPair() {
        const { data } = await axios.get<{ last_price: number; timestamp: number }>(
            'https://api.bitfinex.com/v1/pubticker/btcusd',
        );

        return new BitcoinPriceData({
            price: Number(data.last_price),
            timestamp: Number(data.timestamp),
        });
    }

    async createPriceTimestampPair({ price, timestamp }: BitcoinPriceData): Promise<void> {
        await this.dynamodbClient
            .put({
                TableName: this.tableName,
                Item: {
                    price,
                    timestamp,
                },
            })
            .promise();
    }
}
