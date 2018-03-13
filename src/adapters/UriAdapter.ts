// (C) 2007-2018 GoodData Corporation
import { AFM, Execution, VisualizationObject } from '@gooddata/typings';
import { ISdk } from 'gooddata';

import { IAdapter } from '../interfaces/Adapter';
import { IDataSource } from '../interfaces/DataSource';
import { ExecuteAfmAdapter } from './ExecuteAfmAdapter';
import { toAfmResultSpec } from '../converters/toAfmResultSpec';
import { appendFilters } from '../utils/AfmUtils';
import { IDataSourceParams } from '../interfaces/DataSourceParams';
import { name as pkgName, version as pkgVersion } from '../../package.json';

function defaultExecuteAdapterFactory(
    sdk: ISdk,
    projectId: string
): IAdapter<Execution.IExecutionResponses> {
    return new ExecuteAfmAdapter(sdk, projectId);
}

export class UriAdapter implements IAdapter<Execution.IExecutionResponses> {
    private sdk: ISdk;
    private uri: string;
    private visualizationObject: VisualizationObject.IVisualizationObjectResponse;

    constructor(
        sdk: ISdk,
        private projectId: string,
        private executeAdapterFactory: any = defaultExecuteAdapterFactory
    ) {
        this.sdk = sdk.clone();
        this.sdk.config.setJsPackage(pkgName, pkgVersion);
    }

    public createDataSource(sourceParams: IDataSourceParams): Promise<IDataSource<any>> {
        return this.fetchVisualizationObject(sourceParams.uri)
            .then((visualizationObject) => {
                const content = visualizationObject.visualizationObject.content;
                const { afm, resultSpec } = toAfmResultSpec(content);
                const afmWithAttributeFilters: AFM.IAfm = appendFilters(
                    afm,
                    sourceParams.attributeFilters || [],
                    sourceParams.dateFilter
                );
                const executeAdapter = this.executeAdapterFactory(this.sdk, this.projectId);
                const execution: AFM.IExecution = {
                    execution: {
                        afm: afmWithAttributeFilters,
                        resultSpec
                    }
                };
                return executeAdapter.createDataSource(execution);
            });
    }

    private fetchVisualizationObject(uri: string) {
        if (uri === this.uri) {
            return Promise.resolve(this.visualizationObject);
        }
        return this.sdk.xhr.get<VisualizationObject.IVisualizationObjectResponse>(uri).then((visObject) => {
            this.uri = uri;
            return this.visualizationObject = visObject;
        });
    }
}
