var assert = require('assert');
import RedundantRPCProvider from '../src/index';
import MockRPC from './mockRPC';

describe('redundant-subprovider', function () {
    describe('Transaction multi-casting', function () {
        it('should send transaction to all RPCs', function (done) {
            let rpc = new RedundantRPCProvider([
                "url_1",
                "url_2",
                "forever"
            ], MockRPC);
            rpc.handleRequest({method: "eth_sendRawTransaction"}, undefined, (err, data)=> {
                assert.equal(data, "OK");
                setTimeout(()=> {
                    assert.ok(rpc.RPCs.every((rpc)=> rpc.used()));
                    done();
                }, 0);
            })
        });
        it('should not wait for all RPCs to respond', function (done) {
            let rpc = new RedundantRPCProvider([
                "url_1",
                "url_2",
                "forever"
            ], MockRPC);
            rpc.handleRequest({method: "eth_sendRawTransaction"}, undefined, (err, data)=> {
                assert.equal(data, "OK");
                done();
            })
        });
    });
    describe('Data fetching fail over', function () {
        it('should use next RPC if one fails', function (done) {
            let rpc = new RedundantRPCProvider([
                "url_1",
                "fails",
                "fails"
            ], MockRPC);
            rpc.handleRequest({method: "eth_getBalance"}, undefined, (err, data)=> {
                assert.equal(data, "OK");
                done();
            })
        });
        it('should fail if all RPCs fail', function (done) {
            let rpc = new RedundantRPCProvider([
                "fails",
                "fails",
                "fails"
            ], MockRPC);
            rpc.handleRequest({method: "eth_getBalance"}, undefined, (err, data)=> {
                assert.equal(err, "Failure");
                done();
            })
        });
    })
});