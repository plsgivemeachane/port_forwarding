export default class ExitHandler {
    constructor() {
        return this
    }

    // Intialize exit handler
    private exitHandler(options: any, exitCode: number) {
        if (options.cleanup) this.cleanUp();
        if (exitCode || exitCode === 0) this.exit();
        if (options.exit) process.exit();
    }

    private cleanUp() {
        // TODO Clean up
    }

    private exit() {
        // TODO Exit
    }

    public setup() {
        // do something when app is closing
        process.on('exit', this.exitHandler.bind(null,{cleanup:true}));
        // catches ctrl+c event
        process.on('SIGINT', this.exitHandler.bind(null, {exit:true}));
        // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR1', this.exitHandler.bind(null, {exit:true}));
        process.on('SIGUSR2', this.exitHandler.bind(null, {exit:true}));
        // catches uncaught exceptions
        process.on('uncaughtException', this.exitHandler.bind(null, {exit:true}));

    }
}
