export interface IStorage {

    getBlockAt(height: number): Promise<any>;

    last():Promise<any>;

    saveBlock(block: any): Promise<void>;

    deleteBlockAt(height: number): Promise<void>;

    deleteBlocksBelow(height: number): Promise<void>;

}