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

class RedundantRPCSubprovider extends Subprovider {
    constructor(endpoints, RpcSubprovider) {
        super(endpoints, RpcSubprovider);
        this.RPCs = endpoints.map((endpoint)=> {
            return new RpcSubprovider({
                rpcUrl: endpoint,
            });
        });
    }

    handleRequest(payload, next, end) {
        if (payload.method === "eth_sendRawTransaction") {
            this._multiCastFirstSuccess(payload, next, end);
        } else {
            let RPCs = randomShuffle(this.RPCs.slice());
            this._uniCastFirstSuccess(RPCs, payload, next, end);
        }
    }

    _firstSuccess(callback) {
        let tries = 0;
        let succeeded = false;
        return (err, data)=> {
            if (err) {
                ++tries;
                if (tries === this.RPCs.length) callback(err);
            } else {
                if (!succeeded) {
                    succeeded = true;
                    callback(undefined, data);
                }
            }
        }
    }

    _multiCastFirstSuccess(payload, next, end) {
        let cb = this._firstSuccess(end);
        this.RPCs.map((RPC)=>RPC.handleRequest(payload, next, cb))
    }

    _uniCastFirstSuccess(RPCs, payload, next, end) {
        let RPC = RPCs.shift();
        RPC.handleRequest(payload, next, (err, data)=> {
            if (err) {
                if (RPCs.length !== 0) {
                    this._uniCastFirstSuccess(RPCs, payload, next, end)
                } else {
                    end(err);
                }
            } else {
                end(undefined, data);
            }
        })
    }

}

export default RedundantRPCSubprovider;