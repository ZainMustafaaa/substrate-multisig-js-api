// Import the API & Provider and some utility functions
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const wsProvider = new WsProvider('ws://127.0.0.1:9944');
const bigInt = require('big-integer');
const { stringToU8a, u8aToHex } = require('@polkadot/util');

const { blake2AsHex } = require('@polkadot/util-crypto');

async function main() {
    // Create the API and wait until ready
    const api = await ApiPromise.create({
        wsProvider,
        types: {
            "Address": "AccountId",
            "LookupSource": "AccountId",
            "PeerId": "(Vec<u8>)"
        }
    });

    const keyring = new Keyring({
        type: 'sr25519',
        ss58Format: 42,
    });

    try {

        let bodyData = {
            multisigAddress: "5ETdJ5RGDZt65ZvEqFM4n2TLUTJxcoCeaeAJGGaiYfX7fxSH",
            toAddress: "5DyLzjfdJRiNthvVqUK8xEnsHiMrA2m8bgZekKXZoUPYk8HD", // Dave
            amount: bigInt(1).multiply(10 ** 18),
            threshold: 2,
            signatories: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // BOB and Charlie
            callHash: '0x5706e0b6e77a86ae9ca3ddfb6a20a9b5b4883b9c5d024b00a946a118c482afe0',
            timepoint: {
                height: 23020,
                index: 1
            }
        }

        // 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty, BOB
        // 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY , ALICE
        // 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y, Charlie

        let multisig = await api.query.multisig.multisigs(bodyData.multisigAddress, bodyData.callHash);
        const timepoint = multisig.unwrap().when.toJSON();
        
        console.log(timepoint);
        // return;
        // info = info.toJSON();

        // THIS FLOW IS FOR FIRST APPROVAL

        const message = await api.tx.balances.transferKeepAlive(bodyData.toAddress, bodyData.amount)

        const newPair = keyring.addFromUri("//Bob//stash");
        // console.log(info.value.when.toJSON().toString());
        // return;
        const blockHash = await new Promise(async (resolve, reject) => {
            await api.tx.multisig.asMulti(bodyData.threshold, bodyData.signatories.split(','), timepoint,
                bodyData.callHash,
                true,
                171665000
                )
                .signAndSend(newPair, ({
                    status
                }) => {
                    if (status.isInBlock) {
                        resolve(status.asInBlock.toHex());
                    }
                });
        })


        // console.log("info : ", info)
        console.log('BLOCK HASH : ', blockHash)

    } catch (e) {
        console.info('Exception ::', e.message);
    }
}

main().catch(console.error);
