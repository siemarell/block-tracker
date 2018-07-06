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
        return this.storage.get(height)
    }

    async last() {
        const max = Math.max(...Array.from(this.storage.keys()));
        if (max === -Infinity) return undefined;
        return await this.getBlockAt(max)
    }

    async saveBlock(block: any): Promise<void> {
        this.storage.set(block.height, block)
    }

}