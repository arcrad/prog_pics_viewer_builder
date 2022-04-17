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
	marks?: MarkCollection;
}

export class TypedDexie extends Dexie {
	entries!: Table<Entry>;

	constructor() {
		super('db');
		this.version(3).stores({
			entries: '++id, date, weight, notes, image, marks'
		});
	}
}

export const db = new TypedDexie();
