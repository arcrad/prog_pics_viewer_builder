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
	isDraft?: number; //boolean
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
	includedInExport: number; //boolean
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
		/*
 		this.version(39).stores({
			entries: '++id, draft, date, weight, notes, marks',
			settings: 'key, value'
		});
		*/
		this.version(40).stores({
			entries: '++id, isDraft, date, weight, notes, marks',
			settings: 'key, value'
		}).upgrade( txn => {
			return txn.table('entries').toCollection().modify( entry => {
				entry.isDraft = entry.draft ? 1 : 0;
			});
		});
		this.version(41).stores({
			entries: '++id, isDraft, date, weight, notes, marks, includedInExport',
			settings: 'key, value'
		}).upgrade( txn => {
			return txn.table('entries').toCollection().modify( entry => {
				entry.includedInExport = entry.includeInExport ? 1 : 0;
			});
		});
		this.version(42).stores({
			entries: '++id, isDraft, date, weight, notes, marks, includedInExport',
			settings: 'key, value'
		}).upgrade( txn => {
			return txn.table('entries').toCollection().modify( entry => {
				delete entry.draft;
				delete entry.includeInExport;
			});
		});
	}
}

export const db = new TypedDexie();
