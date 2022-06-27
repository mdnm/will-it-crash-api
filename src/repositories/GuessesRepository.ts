import dynamodb from 'aws-sdk/clients/dynamodb';
import Guess from '../models/Guess';
import IGuessesRepository, { CreateGuessParam } from './IGuessesRepository';

export default class GuessesRepository implements IGuessesRepository {
    private dynamodbClient: dynamodb.DocumentClient;
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.dynamodbClient = new dynamodb.DocumentClient();
    }

    async getPlayerGuesses(playerId: string) {
        const { Item } = await this.dynamodbClient
            .get({
                TableName: this.tableName,
                Key: {
                    playerId,
                },
            })
            .promise();

        if (!Item) {
            return null;
        }

        return new Guess({
            playerId,
            guesses: Item.guesses,
        });
    }

    async createGuess({ playerId, correctGuess }: CreateGuessParam) {
        await this.dynamodbClient
            .update({
                TableName: this.tableName,
                Key: {
                    playerId,
                },
                UpdateExpression: 'SET #guesses = list_append(if_not_exists(#guesses, :new_guess), :empty_list)',
                ExpressionAttributeNames: {
                    '#guesses': 'guesses',
                },
                ExpressionAttributeValues: {
                    ':new_guess': [correctGuess],
                    ':empty_list': [],
                },
            })
            .promise();
    }
}
