import dynamodb from 'aws-sdk/clients/dynamodb';
import Guess from '../models/Guess';
import IGuessesRepository from './IGuessesRepository';

export default class GuessesRepository implements IGuessesRepository {
    private dynamodbClient: dynamodb.DocumentClient;
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.dynamodbClient = new dynamodb.DocumentClient();
    }

    async getPlayerGuesses(playerId: string): Promise<Guess[]> {
        const { Items } = await this.dynamodbClient
            .query({
                TableName: this.tableName,
                KeyConditionExpression: 'playerId = :playerId',
                ExpressionAttributeValues: {
                    ':playerId': { S: playerId },
                },
            })
            .promise();

        if (!Items) {
            return [];
        }

        return Items.map(
            (item) =>
                new Guess({
                    playerId,
                    guessedCorrectly: Boolean(item.guessedCorrectly.S),
                }),
        );
    }

    async createGuess({ playerId, guessedCorrectly }: Guess): Promise<void> {
        this.dynamodbClient
            .put({
                TableName: this.tableName,
                Item: {
                    playerId,
                    guessedCorrectly,
                },
            })
            .promise();
    }
}
