// (C) 2007-2018 GoodData Corporation
import get = require('lodash/get');
import isEmpty = require('lodash/isEmpty');
import isEqual = require('lodash/isEqual');
import { AFM } from '@gooddata/typings';

import { IAdapter } from './interfaces/Adapter';
import { IDataSource } from './interfaces/DataSource';
import { isAfmExecutable } from './utils/AfmUtils';
import { createSubject, ISubject } from './utils/async';

export type IDataSubscriber = (data: any) => void;
export type IErrorSubscriber = (error: any) => void;

export class DataTable<T> {
    private static getDefaultDimensionsForTable(afm: AFM.IAfm): AFM.IDimension[] {
        return [
            {
                itemIdentifiers: (afm.attributes || []).map(a => a.localIdentifier)
            },
            {
                itemIdentifiers: ['measureGroup']
            }
        ];
    }

    private adapter: IAdapter<T>;

    private dataSubscribers: IDataSubscriber[] = [];
    private errorSubscribers: IErrorSubscriber[] = [];

    private afm: AFM.IAfm;

    private dataSource: IDataSource<T>;

    private subject: ISubject<Promise<T>>;

    constructor(adapter: IAdapter<T>) {
        this.adapter = adapter;

        this.subject = createSubject(
            result => this.dataSubscribers.forEach(handler => handler(result)),
            error => this.errorSubscribers.forEach(handler => handler(error))
        );
    }

    public getData(afm: AFM.IAfm, resultSpec: AFM.IResultSpec = {}) {
        if (!isAfmExecutable(afm)) {
            return;
        }

        if (isEmpty(get(resultSpec, 'dimensions'))) {
            resultSpec.dimensions = DataTable.getDefaultDimensionsForTable(afm);
        }

        if (!isEqual(afm, this.afm)) {
            this.afm = afm;
            this.adapter.createDataSource(afm)
                .then((dataSource) => {
                    this.dataSource = dataSource;
                    this.fetchData(resultSpec);
                }, (error) => {
                    this.errorSubscribers.forEach(handler => handler(error));
                });
        } else if (this.dataSource) {
            this.fetchData(resultSpec);
        }
    }

    public onData(callback: IDataSubscriber) {
        this.dataSubscribers.push(callback);
        return this;
    }

    public onError(callback: IDataSubscriber) {
        this.errorSubscribers.push(callback);
        return this;
    }

    public resetDataSubscribers() {
        this.dataSubscribers = [];
        return this;
    }

    public resetErrorSubscribers() {
        this.errorSubscribers = [];
        return this;
    }

    private fetchData(resultSpec: AFM.IResultSpec) {
        this.subject.next(this.dataSource.getData(resultSpec));
    }
}
