import readline from 'readline';
import Observer from './Observer';
import { CommandHandler } from './CommandHandler';
import { logger } from './winston';

export default class InputHelper {
    private rl: readline.Interface;
    private observer = new Observer<string>();
    private isListening: boolean = false;
    private prompt: string = '> ';
    private commandHandler: CommandHandler;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        this.commandHandler = new CommandHandler();
    }

    /**
     * Start listening for input
     */
    public startListening(): void {
        if (this.isListening) return;
        this.isListening = true;
        
        logger.info('Command System Ready. Available commands:');
        logger.info('open <tcp/udp/http/https> [port]  - Open a port');
        logger.info('close <tcp/udp/http/https> [port] - Close a port');
        logger.info('Note: http uses port 80 and https uses port 443 by default');
        
        this.promptInput();
    }

    /**
     * Stop listening for input
     */
    public stopListening(): void {
        this.isListening = false;
        this.rl.close();
    }

    /**
     * Set the prompt string
     */
    public setPrompt(prompt: string): void {
        this.prompt = prompt;
    }

    /**
     * Subscribe to input events
     */
    public onInput(callback: (input: string) => void): void {
        this.observer.subscribe(callback);
    }

    /**
     * Unsubscribe from input events
     */
    public offInput(callback: (input: string) => void): void {
        this.observer.unsubscribe(callback);
    }

    private promptInput(): void {
        if (!this.isListening) return;

        this.rl.question(this.prompt, (input: string) => {
            if (input.trim()) {
                this.observer.notify(input);
                this.commandHandler.handleCommand(input);
            }
            this.promptInput(); // Continue listening
        });
    }
}