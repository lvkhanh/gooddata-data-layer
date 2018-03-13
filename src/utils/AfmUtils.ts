// (C) 2007-2018 GoodData Corporation
import flatMap = require('lodash/flatMap');
import compact = require('lodash/compact');
import { AFM } from '@gooddata/typings';

export const ALL_TIME_GRANULARITY = 'ALL_TIME_GRANULARITY';

export function unwrapSimpleMeasure(item: AFM.IMeasure): AFM.ISimpleMeasure {
    return (item.definition as AFM.ISimpleMeasureDefinition).measure;
}

export function unwrapPoPMeasure(item: AFM.IMeasure): AFM.IPopMeasure {
    return (item.definition as AFM.IPopMeasureDefinition).popMeasure;
}

export function normalizeAfm(afm: AFM.IAfm): AFM.IAfm {
    return {
        attributes: afm.attributes || [],
        measures: afm.measures || [],
        filters: afm.filters || [],
        nativeTotals: afm.nativeTotals || []
    };
}

export const isPoP = (item: AFM.IMeasure): boolean => {
    return !!unwrapPoPMeasure(item);
};

export function isAttributeFilter(filter: AFM.FilterItem): filter is AFM.AttributeFilterItem {
    return !!(filter as AFM.IPositiveAttributeFilter).positiveAttributeFilter ||
        !!(filter as AFM.INegativeAttributeFilter).negativeAttributeFilter;
}

export function isDateFilter(filter: AFM.CompatibilityFilter): filter is AFM.DateFilterItem {
    return !!(filter as AFM.IAbsoluteDateFilter).absoluteDateFilter ||
        !!(filter as AFM.IRelativeDateFilter).relativeDateFilter;
}

export function hasMetricDateFilters(normalizedAfm: AFM.IAfm): boolean {
    return normalizedAfm.measures.some((measure: AFM.IMeasure) => {
        if (!isPoP(measure)) {
            const filters: AFM.FilterItem[] = unwrapSimpleMeasure(measure).filters;
            return filters && filters.some(isDateFilter);
        }
        return false;
    });
}

export function getGlobalDateFilters(normalizedAfm: AFM.IAfm): AFM.DateFilterItem[] {
    return normalizedAfm.filters.filter(isDateFilter);
}

export const hasFilters = (measure: AFM.ISimpleMeasure): boolean => {
    return measure.filters && measure.filters.length > 0;
};

export function getMeasureDateFilters(normalizedAfm: AFM.IAfm): AFM.DateFilterItem[] {
    return flatMap(normalizedAfm.measures, (item: AFM.IMeasure) => {
        const measure = unwrapSimpleMeasure(item);
        if (!measure || !hasFilters(measure)) {
            return [];
        }
        return measure.filters.filter(isDateFilter);
    });
}

export function hasGlobalDateFilter(afm: AFM.IAfm): boolean {
    return afm.filters.some(isDateFilter);
}

function isDateFilterRelative(filter: AFM.DateFilterItem): filter is AFM.IRelativeDateFilter {
    return filter && !!(filter as AFM.IRelativeDateFilter).relativeDateFilter;
}

function isDateFilterAbsolute(filter: AFM.DateFilterItem): filter is AFM.IAbsoluteDateFilter {
    return filter && !!(filter as AFM.IAbsoluteDateFilter).absoluteDateFilter;
}

export function getId(obj: AFM.ObjQualifier) {
    if ((obj as AFM.IObjUriQualifier).uri) {
        return (obj as AFM.IObjUriQualifier).uri;
    }
    if ((obj as AFM.IObjIdentifierQualifier).identifier) {
        return (obj as AFM.IObjIdentifierQualifier).identifier;
    }
    return null;
}

function getDateFilterDateDataSet(filter: AFM.DateFilterItem): AFM.ObjQualifier {
    if (isDateFilterRelative(filter)) {
        return filter.relativeDateFilter.dataSet;
    }
    if (isDateFilterAbsolute(filter)) {
        return filter.absoluteDateFilter.dataSet;
    }
    return null;
}

export function dateFiltersDataSetsMatch(f1: AFM.DateFilterItem, f2: AFM.DateFilterItem) {
    const d1 = getDateFilterDateDataSet(f1);
    const d2 = getDateFilterDateDataSet(f2);
    return getId(d1) === getId(d2);
}

function isDateFilterAllTime(dateFilter: AFM.DateFilterItem): boolean {
    if (isDateFilterRelative(dateFilter)) {
        return dateFilter.relativeDateFilter.granularity === ALL_TIME_GRANULARITY;
    }
    return false;
}

/**
 * Append attribute filters and date filter to afm
 *
 * Date filter handling:
 *      - Override if date filter has the same id
 *      - Add if date filter if date filter id is different
 *
 * Attribute filter handling:
 *      - Add all
 */
export function appendFilters(
    afm: AFM.IAfm,
    attributeFilters: AFM.AttributeFilterItem[],
    dateFilter: AFM.DateFilterItem = null
): AFM.IAfm {
    const normalizedAfm = normalizeAfm(afm);
    const dateFilters: AFM.DateFilterItem[] = !isDateFilterAllTime(dateFilter) ? [dateFilter] : [];
    const afmDateFilter: AFM.DateFilterItem = normalizedAfm.filters.filter(isDateFilter)[0];

    // all-time selected, need to delete date filter from filters
    let afmFilters = normalizedAfm.filters || [];
    if (isDateFilterAllTime(dateFilter)) {
        afmFilters = afmFilters.filter((filter: AFM.FilterItem) => {
            if (isDateFilter(filter)) {
                return !dateFiltersDataSetsMatch(filter, dateFilter);
            }
            return true;
        });
    }

    if (
        (afmDateFilter && dateFilter && !dateFiltersDataSetsMatch(afmDateFilter, dateFilter))
        || (afmDateFilter && !dateFilter)
    ) {
        dateFilters.push(afmDateFilter);
    }

    const afmAttributeFilters = afmFilters.filter(filter => !isDateFilter(filter));

    const filters = compact([
        ...afmAttributeFilters,
        ...attributeFilters,
        ...dateFilters
    ]);

    return {
        ...normalizedAfm,
        filters
    };
}

export function isAfmExecutable(afm: AFM.IAfm) {
    const normalizedAfm = normalizeAfm(afm);
    return normalizedAfm.measures.length > 0 || normalizedAfm.attributes.length > 0;
}
