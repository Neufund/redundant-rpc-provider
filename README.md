# redundant-rpc-provider [![Build Status](https://travis-ci.org/Neufund/redundant-rpc-provider.svg?branch=master)](https://travis-ci.org/Neufund/redundant-rpc-provider)
Redundant RPC provider for metamasks eth provider engine

##What it does?
* For transaction sending it pushes your transaction to all RPCs
but only waits for the first one to respond.
* For data-fetching calls it queries the random RPC and failovers to others if it's down

###API
```
new RedundantRPCSubprovider([
            url_1,
            url_2,
            ...
            url_n
        ],
        RpcSubprovider
)
```
      

####Example usage
```
const ProviderEngine = require('web3-provider-engine')
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const RedundantRPCSubprovider = require('redundant-rpc-provider')
const Web3 = require('web3')

var engine = new ProviderEngine();
var web3 = new Web3(engine);

// static results
engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true
}))

// cache layer
engine.addProvider(new CacheSubprovider())

// filters
engine.addProvider(new FilterSubprovider())

// pending nonce
engine.addProvider(new NonceSubprovider())

// vm
engine.addProvider(new VmSubprovider())

// data source
const INFURA_RPC = 'https://ropsten.infura.io/'
const MEW_RPC = 'https://api.myetherapi.com/rop'

engine.addProvider(
    new RedundantRPCSubprovider([
            INFURA_RPC,
            MEW_RPC
        ],
        RpcSubprovider
    )
)

// log new blocks
engine.on('block', function (block) {
    console.log('================================')
    console.log('BLOCK CHANGED:', '#' + block.number.toString('hex'), '0x' + block.hash.toString('hex'))
    console.log('================================')
})

// network connectivity error
engine.on('error', function (err) {
    // report connectivity errors
    console.error(err.stack)
})

// start polling for blocks
engine.start()
```