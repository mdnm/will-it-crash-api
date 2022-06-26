import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import BitcoinPriceData from '../models/BitcoinPriceData';
import IBitcoinPriceHistoryRepository from '../repositories/IBitcoinPriceHistoryRepository';
import { HttpError, isHttpError } from '../utils/http-error';
import CheckGuessServiceBody from './CheckGuessServiceBody';

export class CheckGuessService {
    private bitcoinPriceHistoryRepository: IBitcoinPriceHistoryRepository;

    constructor(bitcoinPriceHistoryRepository: IBitcoinPriceHistoryRepository) {
        this.bitcoinPriceHistoryRepository = bitcoinPriceHistoryRepository;
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
            if (event.httpMethod !== 'POST') {
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

            response = {
                statusCode: 200,
                body: JSON.stringify({
                    guessedCorrectly,
                    currentBtcPrice: currentBtcPriceData.price,
                    newTimestamp: currentBtcPriceData.timestamp,
                }),
            };

            await this.bitcoinPriceHistoryRepository.createPriceTimestampPair(currentBtcPriceData);
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
