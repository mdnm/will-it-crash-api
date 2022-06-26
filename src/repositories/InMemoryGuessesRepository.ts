import Guess from '../models/Guess';
import IGuessesRepository, { CreateGuessParam } from './IGuessesRepository';

export default class InMemoryGuessesRepository implements IGuessesRepository {
    private guesses: Guess[];

    constructor() {
        this.guesses = [];
    }

    async getPlayerGuesses(playerId: string): Promise<Guess | null> {
        const playerGuesses = this.guesses.find((guess) => guess.playerId === playerId);

        return playerGuesses || null;
    }

    async createGuess(guessData: CreateGuessParam) {
        const playerGuesses = this.guesses.find((guess) => guess.playerId === guessData.playerId);
        if (!playerGuesses) {
            this.guesses.push({ playerId: guessData.playerId, guesses: [guessData.correctGuess] });
            return;
        }

        playerGuesses.guesses.push(guessData.correctGuess);
    }
}
