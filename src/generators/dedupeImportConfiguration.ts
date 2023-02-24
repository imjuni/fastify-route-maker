import type IImportConfiguration from '#compilers/interfaces/IImportConfiguration';
import mergeImportConfiguration from '#generators/mergeImportConfiguration';

export default function dedupeImportConfiguration(configurations: IImportConfiguration[]): IImportConfiguration[] {
  const record = configurations.reduce<Record<string, IImportConfiguration>>((aggregation, importConfiguration) => {
    if (aggregation[importConfiguration.importFile] == null) {
      return { ...aggregation, [importConfiguration.importFile]: importConfiguration };
    }

    if (aggregation[importConfiguration.importFile] != null) {
      const merged = mergeImportConfiguration(aggregation[importConfiguration.importFile], importConfiguration);
      return { ...aggregation, [importConfiguration.importFile]: merged };
    }

    return aggregation;
  }, {});

  return Object.values(record);
}