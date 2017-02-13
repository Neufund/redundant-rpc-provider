class MockRPC {
    constructor(opts) {
        this.url = opts.rpcUrl;
        this.payload = undefined;
    }

    handleRequest(payload, next, end) {
        this.payload = payload;
        if (this.url === "fails") {
            end("Failure");
            return;
        }
        if (this.url !== "forever") {
            end(undefined, "OK");
        }

    }

    used() {
        return this.payload !== undefined;
    }
}

export default MockRPC;