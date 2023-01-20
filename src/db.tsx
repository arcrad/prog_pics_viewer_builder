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
	height?: number;
	notes?: string;
	imageBlob?: UInt8Array; 
	imageNaturalWidth?: number;
	imageNaturalHeight?: number;
	thumbImageBlob?: UInt8Array;
	alignedImageBlob?: UInt8Array;
	marks?: MarkCollection;
	includeInExport?: boolean;
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
		this.version(39).stores({
			entries: '++id, draft, date, weight, notes, marks',
			settings: 'key, value'
		});
	}
}

export const db = new TypedDexie();
