import {Observable} from "rxjs/internal/Observable";
import {IWavesAPI} from '@waves/waves-api'
import {
    map,
    concatMap,
    filter,
    concatAll,
    exhaustMap, distinct, tap
} from "rxjs/operators";
import {interval, Observer, Subject, merge} from "rxjs";
import {Subscription} from "rxjs/internal/Subscription";
import {fromPromise} from "rxjs/internal-compatibility";
import {IStorage} from "./IStorage";


export class BlockTracker {
    public readonly blockData: Subject<any>;
    public readonly heightData: Observable<number>;
    private blockSubscription: Subscription;

    constructor(private wavesApi: IWavesAPI, private pollInterval: number, private storage: IStorage, private blockHistory: number = 50) {
        this.blockData = new Subject<any>();
        this.createNewBlockSubscription(this.blockObserver);
        this.heightData = this.blockData.pipe(
            map(block => block.height),
            distinct()
        );
        // Subscribe to block height. Delete old blocks
        this.heightData
            .pipe(filter(h => h % this.blockHistory === 0))
            .subscribe(h => {
                this.storage.deleteBlocksBelow(h - this.blockHistory).then();
            })
    }


    private createNewBlockSubscription(observer: Observer<any>) {
        if (this.blockSubscription) this.blockSubscription.unsubscribe();
        this.blockSubscription = interval(this.pollInterval)
            .pipe(
                exhaustMap(() => {
                    return fromPromise(this._getBlockHeightsToSync()).pipe(
                        concatAll(),
                        concatMap(h => this.wavesApi.API.Node.blocks.at(h)),
                        concatMap(block => this.processBlock(block)),
                        filter(block => block)
                    )
                }),
            ).subscribe(observer);
    }

    private processBlock = async (block: any): Promise<any> => {
        console.log(`Processing block at ${block.height} with signature ${block.signature}`);
        const blockInStorage = await this.storage.getBlockAt(block.height);
        if (blockInStorage && blockInStorage.signature === block.signature) {
            /*
              Quite often there are blocks, which have already been proceed. Maybe it is related to node caching
              requests or inconsistency in getting last block signature via node REST API
             */
            console.log(`Duplicate  ${block.signature}`);
            return
        }
        await this.storage.saveBlock(block);
        return block;
    };

    private _getBlockHeightsToSync = async () => {
        //ToDo: What if height, returned from node, is smaller than height, returned from storage
        let blocksToSync: Array<number> = [];

        const chainLast = await this.wavesApi.API.Node.blocks.last();
        const storageLast = await this.storage.last();

        console.log(`Last block: ${chainLast.signature} at ${chainLast.height}`)
        if (storageLast) console.log(`Last block in storage: ${storageLast.signature} at ${storageLast.height}`)
        //Todo: implement logic on empty storage or when height diff is too big
        if (!chainLast) {
            blocksToSync = []
        }
        else if (!storageLast) {
            blocksToSync = [chainLast.height]
        } else if (chainLast.signature !== storageLast.signature) {
            const heightToSync = await this.getHeightToSyncFrom(storageLast.height);
            blocksToSync = Array.from(Array(chainLast.height - heightToSync).keys())
                .map(x => x + heightToSync + 1)
        }
        console.log(
            `Current height: ${chainLast.height}, Blocks to sync: ${blocksToSync}`
        );
        return blocksToSync;
    };

    private blockObserver: Observer<any> = {
        closed: false,

        next: (block: any) => {
            this.blockData.next(block);
        },

        error: (err: any) => {
            console.log(err);
            console.log('Block polling error. Recreating polling subscription');
            this.createNewBlockSubscription(this.blockObserver);
        },

        complete: () => {
        }
    };

    getHeightToSyncFrom = async (lastHeight: number): Promise<number> => {
        const loop = async (height: number): Promise<number> => {
            const blockInStorage = await this.storage.getBlockAt(height);
            if (!blockInStorage) {
                return height; //reached bottom
            }

            const blockInChain = await this.wavesApi.API.Node.blocks.at(blockInStorage.height);
            if (blockInChain.signature === blockInStorage.signature) {
                return height
            }
            else return await loop(height - 1)
        };

        return await loop(lastHeight);
    }
}

