import { spawn, ChildProcess } from 'child_process';
import Observer from './Observer';

export class Terminal {
    private process: ChildProcess | null = null;
    private observer = new Observer<string>();

    constructor() {
    }

    // Create a new terminal process
    public createTerminal(shell: string = process.platform === 'win32' ? 'cmd.exe' : 'bash'): void {
        try {
            this.process = spawn(shell, [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                // shell: true,
                detached: true
            });

            this.process.stdout?.on('data', (data: Buffer) => {
                const output = data.toString();
                this.notify(output);
            });

            this.process.stderr?.on('data', (data: Buffer) => {
                const error = data.toString();
                this.notify(`Error: ${error}`);
            });

            this.process.on('error', (error: Error) => {
                this.notify(`Process Error: ${error.message}`);
            });

            this.process.on('exit', (code: number | null) => {
                this.notify(`Process exited with code ${code == null ? 0 : code}`);
            });
        } catch (error) {
            this.notify(`Failed to create terminal: ${error}`);
        }
    }

    // Send commands to the terminal
    public interact(command: string): void {
        if (!this.process || !this.process.stdin) {
            this.notify('Terminal process not initialized');
            return;
        }

        try {
            this.process.stdin.write(command + '\n');
        } catch (error) {
            this.notify(`Failed to send command: ${error}`);
        }
    }

    // Implement Subject interface methods
    public attach(observer: Function): void {
        this.observer.subscribe(observer);
    }

    public detach(observer: Function): void {
        this.observer.unsubscribe(observer);
    }

    public notify(data: string): void {
        this.observer.notify(data);
    }

    // Kill the terminal process
    public kill(): void {
        try {
            if (this.process) {
                this.process.kill();
                this.process = null;
                this.notify('Terminal process killed');
            }
        } catch (error) {
            this.notify(`Failed to kill terminal: ${error}`);
        }
    }

    // Check if terminal is running
    public isRunning(): boolean {
        return this.process !== null;
    }
}