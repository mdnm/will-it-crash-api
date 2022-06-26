import Guess from '../models/Guess';
import IGuessesRepository from './IGuessesRepository';

export default class InMemoryGuessesRepository implements IGuessesRepository {
    private guesses: Guess[];

    constructor() {
        this.guesses = [];
    }

    async getPlayerGuesses(playerId: string): Promise<Guess[]> {
        return this.guesses.filter((guess) => guess.playerId === playerId);
    }

    async createGuess(guessData: Guess): Promise<void> {
        this.guesses.push(guessData);
    }
}
