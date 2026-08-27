export interface MotherFolder {
  id: string;
  name: string;
  color: string;
  amount: number;
}

export interface ChildFolder {
  id: string;
  name: string;
  motherFolderId: string;
}
