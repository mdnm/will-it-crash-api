import { CheckGuessService } from '../../check-guess-service/CheckGuessService';
import CheckGuessServiceBody from '../../check-guess-service/CheckGuessServiceBody';
import InMemoryBitcoinPriceHistoryRepository from '../../repositories/InMemoryBitcoinPriceHistoryRepository';
import InMemoryGuessesRepository from '../../repositories/InMemoryGuessesRepository';
import eventFactory from '../utils/eventFactory';

type CheckGuessServiceBodyFields = Omit<CheckGuessServiceBody, 'isValid'>;

describe('Check Guess Service Unit tests', function () {
    let checkGuessService: CheckGuessService;
    let inMemoryGuessesRepository: InMemoryGuessesRepository;
    let inMemoryBitcoinPriceHistoryRepository: InMemoryBitcoinPriceHistoryRepository;

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();

        inMemoryGuessesRepository = new InMemoryGuessesRepository();
        inMemoryBitcoinPriceHistoryRepository = new InMemoryBitcoinPriceHistoryRepository();
        checkGuessService = new CheckGuessService(inMemoryGuessesRepository, inMemoryBitcoinPriceHistoryRepository);
    });

    it('should return status 405 given the method is not POST', async () => {
        const event = eventFactory({
            path: '/guess',
            method: 'DELETE',
            body: null,
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(405);
    });

    it('should return status 400 given the body was not sent', async () => {
        const event = eventFactory({
            path: '/guess',
            method: 'POST',
            body: null,
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(400);
    });

    it('should return status 422 given the body is missing required fields', async () => {
        const event = eventFactory({
            path: '/guess',
            method: 'POST',
            body: JSON.stringify({ banana: 'is good' }),
        });
        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(422);
    });

    it('should return status 422 given the body fields do not have the correct types', async () => {
        const event = eventFactory({
            path: '/guess',
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
            playerId: '1',
            guess: 'yes',
            btcPrice: 1,
            lastGuessTimestamp: Date.now(),
        };
        const event = eventFactory({
            path: '/guess',
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);

        expect(result.statusCode).toEqual(400);
    });

    it('should return status 200, add 1 to the score and return guessedCorrectly as true given the guess is yes and the price crashed', async () => {
        const body: CheckGuessServiceBodyFields = {
            playerId: '1',
            guess: 'yes',
            btcPrice: 1,
            lastGuessTimestamp: Date.now(),
        };

        inMemoryBitcoinPriceHistoryRepository.setAlwaysCrashPrices(true);
        inMemoryBitcoinPriceHistoryRepository.createPriceTimestampPair({
            price: body.btcPrice,
            timestamp: body.lastGuessTimestamp,
        });

        const event = eventFactory({
            path: '/guess',
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);
        const resultBody = JSON.parse(result.body);

        expect(result.statusCode).toEqual(200);
        expect(resultBody.guessedCorrectly).toEqual(true);
        expect(resultBody.newScore).toEqual(1);
    });

    it('should return status 200, add 1 to the score and return guessedCorrectly as true given the guess is no and the price rose', async () => {
        const body: CheckGuessServiceBodyFields = {
            playerId: '1',
            guess: 'no',
            btcPrice: 1,
            lastGuessTimestamp: Date.now(),
        };

        inMemoryBitcoinPriceHistoryRepository.setAlwaysCrashPrices(false);
        inMemoryBitcoinPriceHistoryRepository.createPriceTimestampPair({
            price: body.btcPrice,
            timestamp: body.lastGuessTimestamp,
        });

        const event = eventFactory({
            path: '/guess',
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);
        const resultBody = JSON.parse(result.body);

        expect(result.statusCode).toEqual(200);
        expect(resultBody.guessedCorrectly).toEqual(true);
        expect(resultBody.newScore).toEqual(1);
    });

    it('should return status 200, subtract 1 of the score and return guessedCorrectly as false given the guess is no and the price crashed', async () => {
        const body: CheckGuessServiceBodyFields = {
            playerId: '1',
            guess: 'no',
            btcPrice: 1,
            lastGuessTimestamp: Date.now(),
        };

        inMemoryBitcoinPriceHistoryRepository.setAlwaysCrashPrices(true);
        inMemoryBitcoinPriceHistoryRepository.createPriceTimestampPair({
            price: body.btcPrice,
            timestamp: body.lastGuessTimestamp,
        });

        const event = eventFactory({
            path: '/guess',
            method: 'POST',
            body: JSON.stringify(body),
        });

        const result = await checkGuessService.execute(event);
        const resultBody = JSON.parse(result.body);

        expect(result.statusCode).toEqual(200);
        expect(resultBody.guessedCorrectly).toEqual(false);
        expect(resultBody.newScore).toEqual(-1);
    });
});
