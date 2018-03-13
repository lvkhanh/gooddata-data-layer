// (C) 2007-2018 GoodData Corporation
import * as GoodData from 'gooddata';
import { AFM, Execution } from '@gooddata/typings';
import { IAdapter } from '../interfaces/Adapter';
import { IDataSource } from '../interfaces/DataSource';
import { DataSource } from '../dataSources/DataSource';
import { handleMeasureDateFilter } from '../helpers/filters';

export class ExecuteAfmAdapter implements IAdapter<Execution.IExecutionResponses> {
    constructor(private sdk: typeof GoodData, private projectId: string) {}

    public createDataSource(
        afm: AFM.IAfm,
        fingerprint?: string
    ): Promise<IDataSource<Execution.IExecutionResponses>> {
        const execFactory = (resultSpec: AFM.IResultSpec) => {
            const execution: AFM.IExecution = {
                execution: {
                    afm: handleMeasureDateFilter(afm),
                    resultSpec
                }
            };

            return this.sdk.execution.executeAfm(this.projectId, execution);
        };
        const dataSource = new DataSource<Execution.IExecutionResponses>(
            execFactory,
            afm,
            fingerprint
        );
        return Promise.resolve(dataSource);
    }
}
