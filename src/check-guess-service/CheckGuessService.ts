import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import BitcoinPriceData from '../models/BitcoinPriceData';
import IBitcoinPriceHistoryRepository from '../repositories/IBitcoinPriceHistoryRepository';
import IGuessesRepository from '../repositories/IGuessesRepository';
import { HttpError, isHttpError } from '../utils/http-error';
import CheckGuessServiceBody from './CheckGuessServiceBody';

export class CheckGuessService {
    private bitcoinPriceHistoryRepository: IBitcoinPriceHistoryRepository;
    private guessesRepository: IGuessesRepository;
    private allowedHttpMethods: string[];

    constructor(guessesRepository: IGuessesRepository, bitcoinPriceHistoryRepository: IBitcoinPriceHistoryRepository) {
        this.guessesRepository = guessesRepository;
        this.bitcoinPriceHistoryRepository = bitcoinPriceHistoryRepository;
        this.allowedHttpMethods = ['GET', 'OPTIONS', 'POST'];
    }

    private parseEventBodyOrFail(event: APIGatewayProxyEvent) {
        if (!event.body) {
            throw { statusCode: 400, message: `the request body is empty` };
        }

        const requestBody = new CheckGuessServiceBody(JSON.parse(event.body));
        if (!requestBody.isValid()) {
            throw {
                statusCode: 422,
                message: `the request body is invalid, make sure you've sent all fields and with the correct types`,
            };
        }
        return requestBody;
    }

    /**
     *
     * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
     * @param {Object} event - API Gateway Lambda Proxy Input Format
     *
     * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
     * @returns {Object} object - API Gateway Lambda Proxy Output Format
     *
     */
    async execute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        console.info('Received: ', event);
        let response: APIGatewayProxyResult;

        try {
            if (!this.allowedHttpMethods.includes(event.httpMethod)) {
                throw {
                    statusCode: 405,
                    message: `checkGuessService only accept POST method, you tried: ${event.httpMethod}`,
                };
            }

            const requestBody = this.parseEventBodyOrFail(event);

            const lastBtcPriceData = await this.getLastBitcoinPriceDataOrFail(
                requestBody.btcPrice,
                requestBody.lastGuessTimestamp,
            );
            const currentBtcPriceData = await this.bitcoinPriceHistoryRepository.getCurrentPriceTimestampPair();

            const guessedCorrectly = this.getGuessAnswer(currentBtcPriceData, lastBtcPriceData, requestBody.guess);
            await this.guessesRepository.createGuess({
                playerId: requestBody.playerId,
                correctGuess: guessedCorrectly,
            });
            const playerGuesses = await this.guessesRepository.getPlayerGuesses(requestBody.playerId);
            const newScore = playerGuesses?.guesses.reduce((finalScore, correctGuess) => {
                if (correctGuess) return finalScore + 1;

                return finalScore - 1;
            }, 0);

            await this.bitcoinPriceHistoryRepository.createPriceTimestampPair(currentBtcPriceData);

            response = {
                statusCode: 200,
                body: JSON.stringify({
                    guessedCorrectly,
                    newScore,
                    currentBtcPrice: currentBtcPriceData.price,
                    newTimestamp: currentBtcPriceData.timestamp,
                }),
            };
        } catch (err: HttpError | any) {
            if (isHttpError(err)) {
                response = {
                    statusCode: err.statusCode,
                    body: JSON.stringify(err.message),
                };
            } else {
                response = {
                    statusCode: 500,
                    body: JSON.stringify(err.message),
                };
            }
        }

        console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
        response.headers = {
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            'Access-Control-Allow-Credentials': true,
            'Content-Type': 'application/json',
        };
        return response;
    }

    private async getLastBitcoinPriceDataOrFail(requestPrice: number, requestTimestamp: number) {
        const lastBtcPriceData = await this.bitcoinPriceHistoryRepository.getPastPriceTimestampPair({
            price: requestPrice,
            timestamp: requestTimestamp,
        });
        if (!lastBtcPriceData) {
            throw { statusCode: 400, message: 'invalid bitcoin price and timestamp pair' };
        }

        return lastBtcPriceData;
    }

    private getGuessAnswer(
        currentBtcPriceData: BitcoinPriceData,
        lastBtcPriceData: BitcoinPriceData,
        guess: 'yes' | 'no',
    ) {
        const priceCrashed = currentBtcPriceData.price < lastBtcPriceData.price;

        return (guess === 'yes' && priceCrashed) || (guess === 'no' && !priceCrashed);
    }
}
