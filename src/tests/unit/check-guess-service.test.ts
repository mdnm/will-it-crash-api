import { APIGatewayProxyEvent } from 'aws-lambda';
import { CheckGuessService } from '../../check-guess-service/CheckGuessService';
import CheckGuessServiceBody from '../../check-guess-service/CheckGuessServiceBody';
import InMemoryBitcoinPriceHistoryRepository from '../../repositories/InMemoryBitcoinPriceHistoryRepository';

type EventFactoryParams = { method: string; body: string | null };
function eventFactory({ method, body }: EventFactoryParams): APIGatewayProxyEvent {
    return {
        httpMethod: method,
        body,
        headers: {},
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: {},
        path: '/guess',
        pathParameters: {},
        queryStringParameters: {},
        requestContext: {
            accountId: '123456789012',
            apiId: '1234',
            authorizer: {},
            httpMethod: method,
            identity: {
                accessKey: '',
                accountId: '',
                apiKey: '',
                apiKeyId: '',
                caller: '',
                clientCert: {
                    clientCertPem: '',
                    issuerDN: '',
                    serialNumber: '',
                    subjectDN: '',
                    validity: { notAfter: '', notBefore: '' },
                },
                cognitoAuthenticationProvider: '',
                cognitoAuthenticationType: '',
                cognitoIdentityId: '',
                cognitoIdentityPoolId: '',
                principalOrgId: '',
                sourceIp: '',
                user: '',
                userAgent: '',
                userArn: '',
            },
            path: '/guess',
            protocol: 'HTTP/1.1',
            requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            requestTimeEpoch: 1428582896000,
            resourceId: '123456',
            resourcePath: '/guess',
            stage: 'testing',
        },
        resource: '',
        stageVariables: {},
    };
}

type CheckGuessServiceBodyFields = Omit<CheckGuessServiceBody, 'isValid'>;

describe('Check Guess Service Unit tests', function () {
    let checkGuessService: CheckGuessService;
    let inMemoryBitcoinPriceHistoryRepository: InMemoryBitcoinPriceHistoryRepository;

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();

        inMemoryBitcoinPriceHistoryRepository = new InMemoryBitcoinPriceHistoryRepository();
        checkGuessService = new CheckGuessService(inMemoryBitcoinPriceHistoryRepository);
    });

    it('should return status 405 given the method is not POST', async () => {
        const event = eventFactory({
            method: 'GET',
            body: null,
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(405);
    });

    it('should return status 400 given the body was not sent', async () => {
        const event = eventFactory({
            method: 'POST',
            body: null,
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(400);
    });

    it('should return status 422 given the body is missing required fields', async () => {
        const event = eventFactory({
            method: 'POST',
            body: JSON.stringify({ banana: 'is good' }),
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(422);
    });

    it('should return status 422 given the body fields do not have the correct types', async () => {
        const event = eventFactory({
            method: 'POST',
            body: JSON.stringify({
                id: 1,
                guess: 'maybe?',
                btcPrice: '1',
                lastGuessTimestamp: Date.now().toString(),
            }),
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(422);
    });

    it('should return status 400 given the no pair of price and timestamp was found', async () => {
        const body: CheckGuessServiceBodyFields = {
            id: '1',
            guess: 'yes',
            btcPrice: 1,
            lastGuessTimestamp: Date.now(),
        };
        const event = eventFactory({
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(400);
    });

    it('should return status 200 and guessedCorrectly as true given the guess is yes and the price crashed', async () => {
        const lastGuessTimestamp = Date.now();
        const btcPrice = 1;

        inMemoryBitcoinPriceHistoryRepository.setAlwaysCrashPrices(true);
        inMemoryBitcoinPriceHistoryRepository.createPriceTimestampPair({
            price: btcPrice,
            timestamp: lastGuessTimestamp,
        });

        const body: CheckGuessServiceBodyFields = {
            id: '1',
            guess: 'yes',
            btcPrice,
            lastGuessTimestamp,
        };
        const event = eventFactory({
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(200);
        expect(JSON.parse(result.body).guessedCorrectly).toEqual(true);
    });

    it('should return status 200 and guessedCorrectly as true given the guess is no and the price rose', async () => {
        const lastGuessTimestamp = Date.now();
        const btcPrice = 1;

        inMemoryBitcoinPriceHistoryRepository.setAlwaysCrashPrices(false);
        inMemoryBitcoinPriceHistoryRepository.createPriceTimestampPair({
            price: btcPrice,
            timestamp: lastGuessTimestamp,
        });

        const body: CheckGuessServiceBodyFields = {
            id: '1',
            guess: 'no',
            btcPrice,
            lastGuessTimestamp,
        };
        const event = eventFactory({
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(200);
        expect(JSON.parse(result.body).guessedCorrectly).toEqual(true);
    });
});
