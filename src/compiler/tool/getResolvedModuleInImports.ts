import type IGetModuleInImports from '#compiler/interface/IGetModuleInImports';
import type IConfig from '#config/interface/IConfig';
import appendPostfixHash from '#tool/appendPostfixHash';
import getHash from '#tool/getHash';
import { atOrUndefined } from 'my-easy-fp';
import { replaceSepToPosix } from 'my-node-fp';
import * as path from 'path';
import type { ImportClause, SourceFile, TypeReferenceNode } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

interface IGetResolvedModuleParam {
  source: SourceFile;
  option: IConfig;
  typeReferenceNodes: TypeReferenceNode[];
}

function getNamedBindingName(bindings: ReturnType<ImportClause['getNamedBindings']>) {
  if (bindings == null) {
    return [];
  }

  // namespace import에 대한 내용을 정리해야한다
  if (bindings.getKind() === SyntaxKind.NamespaceImport) {
    // const namespaceImport = bindings.asKindOrThrow(SyntaxKind.NamespaceImport);
    return [];
  }

  const namedImports = bindings.asKindOrThrow(SyntaxKind.NamedImports);
  const names = namedImports.getElements().map((element) => element.getName());
  return names;
}

export default function getResolvedModuleInImports({
  source,
  option,
  typeReferenceNodes,
}: IGetResolvedModuleParam): IGetModuleInImports[] {
  const typeNames = typeReferenceNodes.map((node) => node.getTypeName());
  const textTypeNames = typeNames.map((typeName) => typeName.getText());

  const importDeclarations = source.getImportDeclarations().filter((importDeclaration) => {
    const moduleSourceFile = importDeclaration.getModuleSpecifierSourceFile();

    if (moduleSourceFile == null) {
      return false;
    }

    return moduleSourceFile.isFromExternalLibrary() === false;
  });

  const fullTypeNameWithImportDeclarations = textTypeNames
    .map((textTypeName) => importDeclarations.map((importDeclaration) => ({ textTypeName, importDeclaration })))
    .flat();

  const typeNameWithImportDeclarations = fullTypeNameWithImportDeclarations.filter((typeNameWithImportDeclaration) => {
    const { textTypeName, importDeclaration } = typeNameWithImportDeclaration;
    const importClause = importDeclaration.getImportClauseOrThrow();
    const defaultImport = importClause.getDefaultImport();

    const namedBindings =
      defaultImport != null
        ? [defaultImport.getText(), ...getNamedBindingName(importClause.getNamedBindings())]
        : getNamedBindingName(importClause.getNamedBindings());

    return namedBindings.find((namedBinding) => namedBinding === textTypeName) != null;
  });

  const nonDedupeResolutions = typeNameWithImportDeclarations.map<IGetModuleInImports>(
    (typeNameWithImportDeclaration) => {
      const importClause = typeNameWithImportDeclaration.importDeclaration.getImportClauseOrThrow();
      const defaultImport = importClause.getDefaultImport();
      const sourceFilePath = typeNameWithImportDeclaration.importDeclaration.getSourceFile().getFilePath();
      const moduleSourceFile = typeNameWithImportDeclaration.importDeclaration.getModuleSpecifierSourceFileOrThrow();
      const moduleSourceFilePath = moduleSourceFile.getFilePath();
      const declarationMap = moduleSourceFile.getExportedDeclarations();

      const relativeFilePath = replaceSepToPosix(path.relative(option.output, moduleSourceFilePath));
      const moduleHash = getHash(relativeFilePath);

      // default import 인 경우
      // 생각 좀 해봤는데 이 경우 filename + hash로 처리하는게 더 효율적인 것 같다(handler 일 때처럼)
      // 이건 여러파일에 동일한 이름으로 export 한 뒤 이름만 바꿔서 사용하는 그런 경우도 있을 것 같아서
      // 오류 방지 차원에서 filename + hash로 처리한다
      if (defaultImport != null) {
        const baseFilename = path.basename(relativeFilePath, '.ts');
        const defaultImportModuleType = atOrUndefined(declarationMap.get('default') ?? [], 0);

        return {
          isExternalLibraryImport: false,
          hash: moduleHash,
          importAt: sourceFilePath,
          exportFrom: moduleSourceFilePath,
          importDeclarations: [
            {
              isDefaultExport: true,
              importModuleNameFrom: defaultImport.getText(),
              importModuleNameTo: appendPostfixHash(baseFilename, moduleHash),
              isPureType:
                defaultImportModuleType == null
                  ? false
                  : defaultImportModuleType.getKind() === SyntaxKind.TypeAliasDeclaration ||
                    defaultImportModuleType.getKind() === SyntaxKind.ClassDeclaration ||
                    defaultImportModuleType.getKind() === SyntaxKind.InterfaceDeclaration,
            },
          ],
        };
      }

      const importModuleType = atOrUndefined(declarationMap.get(typeNameWithImportDeclaration.textTypeName) ?? [], 0);

      return {
        isExternalLibraryImport: false,
        importAt: sourceFilePath,
        exportFrom: moduleSourceFilePath,
        hash: moduleHash,
        importDeclarations: [
          {
            isDefaultExport: false,
            importModuleNameTo: typeNameWithImportDeclaration.textTypeName,
            importModuleNameFrom: typeNameWithImportDeclaration.textTypeName,
            isPureType:
              importModuleType == null
                ? false
                : importModuleType.getKind() === SyntaxKind.TypeAliasDeclaration ||
                  importModuleType.getKind() === SyntaxKind.ClassDeclaration ||
                  importModuleType.getKind() === SyntaxKind.InterfaceDeclaration,
          },
        ],
      };
    },
  );

  const resolutionRecord = nonDedupeResolutions.reduce<Record<string, IGetModuleInImports>>((aggregation, current) => {
    if (aggregation[current.exportFrom] != null) {
      const concatedImportDeclarations: IGetModuleInImports['importDeclarations'] = [
        ...current.importDeclarations,
        ...aggregation[current.exportFrom].importDeclarations,
      ];

      concatedImportDeclarations.sort((left, right) => {
        if (left.isDefaultExport) {
          return 1;
        }

        if (right.isDefaultExport) {
          return -1;
        }

        return left.importModuleNameTo.localeCompare(right.importModuleNameTo);
      });

      return {
        ...aggregation,
        [current.exportFrom]: {
          ...aggregation[current.exportFrom],
          importDeclarations: concatedImportDeclarations,
        },
      };
    }

    return { ...aggregation, [current.exportFrom]: current };
  }, {});

  const resolutions = Object.values(resolutionRecord);

  return resolutions;
}
