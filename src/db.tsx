import Dexie, { Table } from 'dexie';

export type MarkPoint = {
	x: number;
	y: number;
};

export type Entry = {
	id?: number;
	date: string;
	weight?: number;
	notes?: string;
	image?: string;
	marks?: MarkPoint[];
}

export class TypedDexie extends Dexie {
	entries!: Table<Entry>;

	constructor() {
		super('db');
		this.version(2).stores({
			entries: '++id, date, weight, notes, image, marks'
		});
	}
}

export const db = new TypedDexie();
