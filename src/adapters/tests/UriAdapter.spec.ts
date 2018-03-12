import { factory, ISdk } from 'gooddata';
import { charts } from '../../converters/tests/fixtures/VisObj.fixtures';
import { UriAdapter } from '../UriAdapter';

const sdk = factory();

describe('UriAdapter', () => {
    const projectId = 'FoodMartDemo';
    const uri = '/gdc/md/FoodMartDemo/1';
    const uri2 = '/gdc/md/FoodMartDemo/2';

    function createDummySDK(): ISdk {
        const visualizationObject = {
            visualizationObject: {
                content: charts.simpleMeasure
            }
        };
        sdk.clone = () => sdk; // disable clone for spyOn to work

        jest.spyOn(sdk.xhr, 'get')
            .mockImplementation(() => Promise.resolve(visualizationObject));

        return sdk;
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should fetch visualization object when creating data source', () => {
        const dummySDK = createDummySDK();
        const adapter = new UriAdapter(dummySDK, projectId);
        return adapter.createDataSource({ uri }).then(() => {
            expect(dummySDK.xhr.get).toBeCalledWith(uri);
        });
    });

    it('should handle fail of vis. obj. fetch', () => {
        const dummySDK = createDummySDK();
        const adapter = new UriAdapter(dummySDK, projectId);
        dummySDK.xhr.get = jest.fn(() => Promise.reject('invalid URI'));
        return adapter.createDataSource({ uri }).catch((error) => {
            expect(error).toBe('invalid URI');
        });
    });

    it('should request visualization object for consecutive createDataSource call only when uri changes', () => {
        const dummySDK = createDummySDK();
        const adapter = new UriAdapter(dummySDK, projectId);
        return adapter.createDataSource({ uri }).then(() => {
            expect(dummySDK.xhr.get).toHaveBeenCalledTimes(1);
            return adapter.createDataSource({ uri }).then(() => {
                expect(dummySDK.xhr.get).toHaveBeenCalledTimes(1);
                return adapter.createDataSource({ uri: uri2 }).then(() => {
                    expect(dummySDK.xhr.get).toHaveBeenCalledTimes(2);
                });
            });
        });
    });
});
