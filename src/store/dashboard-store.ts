import { makeAutoObservable } from "mobx";

type BlockType = {
  title: string;
  grains: string;
  view: string;
};

class DashboardStore {
  blocks: BlockType[];
  isCardFullScreen: boolean;

  constructor() {
    makeAutoObservable(this);
    this.isCardFullScreen = false;

    this.blocks = this.loadFromLocalStorage();
  }

  loadFromLocalStorage(): BlockType[] {
    const savedBlocks = localStorage.getItem("savedBlocks");
    if (savedBlocks) {
      return JSON.parse(savedBlocks);
    }
    return [
      { title: "cpu", grains: "cpu_model", view: "table" },
      { title: "osfullname", grains: "osfullname", view: "table" },
      { title: "boardname", grains: "boardname", view: "table" },
      { title: "kernel", grains: "kernel", view: "table" },
      { title: "saltversion", grains: "saltversion", view: "table" },
      { title: "pythonversion", grains: "pythonversion", view: "table" },
    ];
  }

  saveToLocalStorage() {
    localStorage.setItem("savedBlocks", JSON.stringify(this.blocks));
  }

  updateGrains(index: number, newGrains: string) {
    this.blocks[index].grains = newGrains;
    this.saveToLocalStorage();
  }

  updateView(index: number, newView: string) {
    this.blocks[index].view = newView;
    this.saveToLocalStorage();
  }

  addBlock(newBlock: BlockType) {
    this.blocks.push(newBlock);
    this.saveToLocalStorage();
  }

  removeBlock(index: number) {
    this.blocks.splice(index, 1);
    this.saveToLocalStorage();
  }
}

export const dashboardStore = new DashboardStore();
