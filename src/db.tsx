import Dexie, { Table } from 'dexie';

export type MarkPoint = {
	x: number;
	y: number;
	style: string;
};

export type MarkCollection = {
	[key: string]: MarkPoint;
}
export type Entry = {
	id?: number;
	date: string;
	weight?: number;
	notes?: string;
	image?: string;
	alignedImage?: string;
	marks?: MarkCollection;
}

export class TypedDexie extends Dexie {
	entries!: Table<Entry>;

	constructor() {
		super('db');
		this.version(4).stores({
			entries: '++id, date, weight, notes, image, alignedImage, marks'
		});
	}
}

export const db = new TypedDexie();
