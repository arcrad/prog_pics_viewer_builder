import Dexie, { Table } from 'dexie';

export type MarkPoint = {
	x: number;
	y: number;
	style: string;
};

export type MarkCollection = {
	[key: string]: MarkPoint;
};

export type Entry = {
	id?: number;
	draft?: boolean;
	date: string;
	weight?: number;
	notes?: string;
	image?: string;
	imageBlob?: File; 
	imageNaturalWidth?: number;
	imageNaturalHeight?: number;
	thumbImageBlob?: Blob;
	alignedImageBlob?: Blob;
	marks?: MarkCollection;
};

export type Setting = {
	key?: string;
	value: any;
	visible?: boolean;
};
export class TypedDexie extends Dexie {
	entries!: Table<Entry>;
	settings!: Table<Setting>;

	constructor() {
		super('db');
		this.version(30).stores({
			entries: '++id, draft, date, weight, notes, marks',
			settings: 'key, value'
		});
	}
}

export const db = new TypedDexie();
