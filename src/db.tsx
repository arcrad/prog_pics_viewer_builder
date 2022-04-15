import Dexie, { Table } from 'dexie';

export type Entry = {
	id?: number;
	date: string;
	weight: number;
	notes?: string;
	image: string;
}

export class TypedDexie extends Dexie {
	entries!: Table<Entry>;

	constructor() {
		super('db');
		this.version(1).stores({
			entries: '++id, date, weight, notes, image'
		});
	}
}

export const db = new TypedDexie();
