import {IStorage} from './IStorage';

export class MemStorage implements IStorage{
    private storage: Map<number,any> = new Map<number, any>()

    async deleteBlockAt(height: number): Promise<void> {
        this.storage.delete(height)
    }

    async deleteBlocksBelow(height: number): Promise<void> {
        for(let h of this.storage.keys()){
            if (h < height){
                await this.deleteBlockAt(h)
            }
        }
    }

    async getBlockAt(height: number): Promise<any> {
        this.storage.get(height)
    }

    async getLastHeightAndSig(): Promise<{ lastHeight: number; lastSig: string }> {
        const max = Math.max(...Array.from(this.storage.keys()));
        if (max === -Infinity) return {lastHeight: undefined, lastSig: undefined};
        return {lastHeight: max, lastSig: this.storage.get(max).signature};
    }

    async saveBlock(block: any): Promise<void> {
        this.storage.set(block.height, block)
    }

}