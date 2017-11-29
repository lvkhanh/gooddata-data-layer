import { AFM } from '@gooddata/typings';
import {
    appendFilters,
    hasMetricDateFilters,
    isAfmExecutable,
    normalizeAfm,
    isDateFilter,
    isAttributeFilter,
    ALL_TIME_GRANULARITY
} from '../AfmUtils';
import {
    Granularities
 } from '../../constants/granularities';
import {
    afmWithMetricDateFilter,
    afmWithoutMetricDateFilters
} from '../../fixtures/Afm.fixtures';

describe('hasMetricDateFilters', () => {
    it('TRUE if contains at least one metric date filter', () => {
        const result = hasMetricDateFilters(afmWithMetricDateFilter);
        expect(result).toEqual(true);
    });

    it('FALSE if does not contain any metric date filter', () => {
        const result = hasMetricDateFilters(afmWithoutMetricDateFilters);
        expect(result).toEqual(false);
    });
});

describe('isDateFilter', () => {
    it('should return true for valid date filter', () => {
        const relativeDateFilter: AFM.IRelativeDateFilter = {
            relativeDateFilter: {
                dataSet: {
                    identifier: 'filter'
                },
                from: 1,
                to: 2,
                granularity: Granularities.YEAR
            }
        };
        expect(isDateFilter(relativeDateFilter)).toEqual(true);

        const absoluteDateFilter: AFM.IAbsoluteDateFilter = {
            absoluteDateFilter: {
                dataSet: {
                    identifier: 'filter'
                },
                from: '2001-01-01',
                to: '2001-02-02'
            }
        };
        expect(isDateFilter(absoluteDateFilter)).toEqual(true);
    });

    it('should return false for attribute filter', () => {
        const attributeFilter: AFM.IPositiveAttributeFilter = {
            positiveAttributeFilter: {
                displayForm: {
                    identifier: 'filter'
                },
                in: ['1', '2']
            }
        };
        expect(isDateFilter(attributeFilter)).toEqual(false);
    });
});

describe('isAttributeFilter', () => {
    it('should return true for valid attribute filter', () => {
        const positiveAttributeFilter: AFM.IPositiveAttributeFilter = {
            positiveAttributeFilter: {
                displayForm: {
                    identifier: 'filter'
                },
                in: ['1', '2']
            }
        };
        expect(isAttributeFilter(positiveAttributeFilter)).toEqual(true);

        const negativeAttributeFilter: AFM.INegativeAttributeFilter = {
            negativeAttributeFilter: {
                displayForm: {
                    identifier: 'filter'
                },
                notIn: ['1', '2']
            }
        };
        expect(isAttributeFilter(negativeAttributeFilter)).toEqual(true);
    });

    it('should return false for attribute filter', () => {
        const absoluteDateFilter: AFM.IAbsoluteDateFilter = {
            absoluteDateFilter: {
                dataSet: {
                    identifier: 'filter'
                },
                from: '2001-01-01',
                to: '2001-02-02'
            }
        };
        expect(isAttributeFilter(absoluteDateFilter)).toEqual(false);
    });
});

describe('normalizeAfm', () => {
    it('should add optional arrays - empty', () => {
        const afm: AFM.IAfm = {};
        expect(normalizeAfm(afm)).toEqual({
            measures: [],
            attributes: [],
            filters: []
        });
    });

    it('should add optional arrays - measures & filters', () => {
        const expectedAfm: AFM.IAfm = {
            attributes: [
                {
                    localIdentifier: 'a1',
                    displayForm: {
                        identifier: 'a1'
                    }
                }
            ],
            measures: [],
            filters: []
        };
        expect(normalizeAfm({
            attributes: [
                {
                    localIdentifier: 'a1',
                    displayForm: {
                        identifier: 'a1'
                    }
                }
            ]
        })).toEqual(expectedAfm);
    });

    it('should add optional arrays - attributes & filters', () => {
        const expectedAfm: AFM.IAfm = {
            measures: [
                {
                    localIdentifier: 'm1',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm1'
                            }
                        }
                    }
                }
            ],
            attributes: [],
            filters: []
        };
        expect(normalizeAfm({
            measures: [
                {
                    localIdentifier: 'm1',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm1'
                            }
                        }
                    }
                }
            ]
        })).toEqual(expectedAfm);
    });

    it('should add optional arrays - attributes & measures', () => {
        const expectedAfm: AFM.IAfm = {
            attributes: [],
            measures: [],
            filters: [
                {
                    relativeDateFilter: {
                        dataSet: {
                            identifier: '1'
                        },
                        from: 0,
                        to: 1,
                        granularity: Granularities.YEAR
                    }
                }
            ]
        };
        expect(normalizeAfm({
            filters: [
                {
                    relativeDateFilter: {
                        dataSet: {
                            identifier: '1'
                        },
                        from: 0,
                        to: 1,
                        granularity: Granularities.YEAR
                    }
                }
            ]
        })).toEqual(expectedAfm);
    });
});

describe('AFM utils', () => {
    const af1: AFM.IPositiveAttributeFilter = {
        positiveAttributeFilter: {
            displayForm: {
                identifier: '1'
            },
            in: []
        }
    };
    const af2: AFM.IPositiveAttributeFilter = {
        positiveAttributeFilter: {
            displayForm: {
                identifier: '2'
            },
            in: []
        }
    };

    const df1: AFM.IRelativeDateFilter = {
        relativeDateFilter: {
            dataSet: {
                identifier: 'd1'
            },
            from: -1,
            to: -1,
            granularity: Granularities.YEAR
        }
    };
    const absoluteDateFilter: AFM.IAbsoluteDateFilter = {
        absoluteDateFilter: {
             dataSet: {
                 identifier: 'ab'
             },
             from: '2001-01-01',
             to: '2001-02-02'
        }
    };

    const df1AllTime: AFM.IRelativeDateFilter = {
        relativeDateFilter: {
            dataSet: {
                identifier: 'd1'
            },
            from: 0,
            to: 0,
            granularity: ALL_TIME_GRANULARITY
        }
    };

    describe('appendFilters', () => {
        it('should concatenate filters when all different', () => {
            const afm = {
                filters: [
                    af1
                ]
            };
            const attributeFilters = [af2];
            const dateFilter = df1;

            const enriched = appendFilters(afm, attributeFilters, dateFilter);
            expect(enriched.filters).toEqual([
                af1, af2, df1
            ]);
        });

        it('should override date filter if identifier is identical', () => {
            const afm = {
                filters: [
                    af1, df1
                ]
            };
            const attributeFilters: AFM.AttributeFilterItem[] = [];
            const dateFilter = df1;

            const enriched = appendFilters(afm, attributeFilters, dateFilter);
            expect(enriched.filters).toEqual([
                af1, df1
            ]);
        });

        it('should duplicate date filter if ID different', () => {
            const afm = {
                filters: [
                    df1
                ]
            };
            const attributeFilters: AFM.AttributeFilterItem[] = [];
            const dateFilter = absoluteDateFilter;

            const enriched = appendFilters(afm, attributeFilters, dateFilter);
            expect(enriched.filters).toEqual([
                df1, absoluteDateFilter
            ]);
        });

        it('should delete date filter from AFM if "All time" date filter requested', () => {
            const afm = {
                filters: [
                    df1
                ]
            };
            const attributeFilters: AFM.AttributeFilterItem[] = [];
            const dateFilter = df1AllTime;

            const enriched = appendFilters(afm, attributeFilters, dateFilter);
            expect(enriched.filters).toEqual([]);
        });

        it('should add date filter to empty afm filters', () => {
            const afm: AFM.IAfm = {
                filters: []
            };
            const enriched = appendFilters(afm, [], absoluteDateFilter);
            expect(enriched.filters).toEqual([absoluteDateFilter]);
        });
    });

    describe('isAfmExecutable', () => {
        it('should be false for only filters', () => {
            const afm = {
                filters: [
                    df1
                ]
            };

            expect(isAfmExecutable(afm)).toBeFalsy();
        });

        it('should be true for at least one measure', () => {
            const afm: AFM.IAfm = {
                measures: [
                    {
                        localIdentifier: 'm1',
                        definition: {
                            measure: {
                                item: {
                                    identifier: 'm1'
                                },
                                aggregation: 'count'
                            }
                        }
                    }
                ]
            };

            expect(isAfmExecutable(afm)).toBeTruthy();
        });

        it('should be true for at least one attribute', () => {
            const afm: AFM.IAfm = {
                attributes: [
                    {
                        localIdentifier: 'a1',
                        displayForm: {
                            uri: '/gdc/project/dsdf1'
                        }
                    }
                ]
            };

            expect(isAfmExecutable(afm)).toBeTruthy();
        });
    });
});
