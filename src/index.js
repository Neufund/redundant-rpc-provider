const Subprovider = require('web3-provider-engine/subproviders/subprovider.js')

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * @param array - array to be shuffled
 * @return shuffled array
 */
function randomShuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/**
 * Redundant RPC provider
 */
class RedundantRPCSubprovider extends Subprovider {
    /**
     * Create a provider
     * @param {Array.<string>} endpoints - RPC endpoints.
     * @param {Subprovider} RpcSubprovider - RPC Subprovider
     */
    constructor(endpoints, RpcSubprovider) {
        super(endpoints, RpcSubprovider);
        this.RPCs = endpoints.map((endpoint)=> {
            return new RpcSubprovider({
                rpcUrl: endpoint,
            });
        });
    }

    /**
     * Handles RPC request
     * @param payload - payload
     * @param next
     * @param end - callback
     */
    handleRequest(payload, next, end) {
        if (payload.method === "eth_sendRawTransaction") {
            // We want to send transactions to all to speed up propagation and omit censoring
            this._multiCastFirstSuccess(payload, next, end);
        } else {
            // Randomly shuffle RPCs to balance the load
            let RPCs = randomShuffle(this.RPCs.slice());
            this._uniCastFirstSuccess(RPCs, payload, next, end);
        }
    }

    /**
     * Returns callback for multiple use
     * which resolves on first success, or fails with last error
     * @param callback
     * @return {function(*=, *=)}
     * @private
     */
    _firstSuccess(callback) {
        let tries = 0; // Number of tries
        let succeeded = false; // Did we get any successful response
        return (err, data)=> {
            if (err) {
                ++tries;
                // All RPCs failed
                if (tries === this.RPCs.length) callback(err);
            } else {
                if (!succeeded) {
                    succeeded = true;
                    callback(undefined, data);
                }
            }
        }
    }

    /**
     * Sends to all RPCs and waits for first success
     * @param payload - payload
     * @param next
     * @param end - callback
     * @private
     */
    _multiCastFirstSuccess(payload, next, end) {
        let cb = this._firstSuccess(end);
        this.RPCs.map((RPC)=>RPC.handleRequest(payload, next, cb))
    }

    /**
     * Sends to a single RPC, but uses consequent ones if it fails
     * @param RPCs - list of RPCs
     * @param payload - payload
     * @param next
     * @param end - callback
     * @private
     */
    _uniCastFirstSuccess(RPCs, payload, next, end) {
        let RPC = RPCs.shift();
        RPC.handleRequest(payload, next, (err, data)=> {
            if (err) {
                if (RPCs.length !== 0) {
                    // Try next RPC
                    this._uniCastFirstSuccess(RPCs, payload, next, end)
                } else {
                    // All RPCs failed
                    end(err);
                }
            } else {
                // Success
                end(undefined, data);
            }
        })
    }

}

export default RedundantRPCSubprovider;