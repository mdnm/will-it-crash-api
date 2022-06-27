import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import crypto from 'crypto';
import IBitcoinPriceHistoryRepository from '../repositories/IBitcoinPriceHistoryRepository';
import IGuessesRepository from '../repositories/IGuessesRepository';
import { getCorsHeaders, HttpError, isHttpError } from '../utils/http';

export class LoadPlayerService {
    private guessesRepository: IGuessesRepository;
    private bitcoinPriceHistoryRepository: IBitcoinPriceHistoryRepository;

    constructor(guessesRepository: IGuessesRepository, bitcoinPriceHistoryRepository: IBitcoinPriceHistoryRepository) {
        this.guessesRepository = guessesRepository;
        this.bitcoinPriceHistoryRepository = bitcoinPriceHistoryRepository;
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
            if (event.httpMethod !== 'GET') {
                throw {
                    statusCode: 405,
                    message: `loadPlayerService only accept GET method, you tried: ${event.httpMethod}`,
                };
            }

            const playerId = crypto.randomUUID();
            const currentBtcPriceData = await this.bitcoinPriceHistoryRepository.getCurrentPriceTimestampPair();
            await this.bitcoinPriceHistoryRepository.createPriceTimestampPair(currentBtcPriceData);

            response = {
                statusCode: 200,
                body: JSON.stringify({
                    playerId,
                    btcPrice: currentBtcPriceData.price,
                    timestamp: currentBtcPriceData.timestamp,
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
        response.headers = getCorsHeaders();
        return response;
    }
}
