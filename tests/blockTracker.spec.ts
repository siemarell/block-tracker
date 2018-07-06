import {create, MAINNET_CONFIG} from '@waves/waves-api';
import {expect, assert} from 'chai'
import {describe, before, it} from 'mocha';
import {BlockTracker} from "../src/blockTracker";
import {MemStorage} from "../src/memStorage";

describe('Node API', () => {
    const Waves = create(MAINNET_CONFIG)
    const tracker = new BlockTracker(Waves,5000,new MemStorage(), 20)

    it('Should track blocks', async () => {
        tracker.blockData.asObservable().subscribe(()=>{})
    });

});