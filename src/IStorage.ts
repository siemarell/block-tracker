export interface IStorage {
    getLastHeightAndSig(): Promise<{ lastHeight: number, lastSig: string }>;

    getBlockAt(height: number): Promise<any>;

    saveBlock(block: any): Promise<void>;

    deleteBlockAt(height: number): Promise<void>;

    deleteBlocksBelow(height: number): Promise<void>;

}