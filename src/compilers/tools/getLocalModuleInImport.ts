import type IGetModuleInImports from '#/compilers/interfaces/IResolvedImportModule';
import getTypeSymbolText from '#/compilers/tools/getTypeSymbolText';
import type IBaseOption from '#/configs/interfaces/IBaseOption';
import appendPostfixHash from '#/tools/appendPostfixHash';
import getHash from '#/tools/getHash';
import { replaceSepToPosix } from 'my-node-fp';
import path from 'path';
import type { SourceFile, TypeReferenceNode } from 'ts-morph';

interface IGetLocalModuleInImports {
  sourceFile: SourceFile;
  option: Pick<IBaseOption, 'output'>;
  typeReferenceNodes: TypeReferenceNode[];
}

export default function getLocalModuleInImports({
  sourceFile,
  option,
  typeReferenceNodes,
}: IGetLocalModuleInImports): IGetModuleInImports[] {
  const typeAliases = sourceFile.getTypeAliases();
  const interfaces = sourceFile.getInterfaces();
  const classes = sourceFile.getClasses();

  const typeNames = typeReferenceNodes.map((typeReferenceNode) => typeReferenceNode.getTypeName().getText());

  const moduleSourceFilePath = sourceFile.getFilePath().toString();
  const relativeFilePath = replaceSepToPosix(path.relative(option.output, moduleSourceFilePath));
  const moduleHash = getHash(relativeFilePath);

  const matchedTypeAliases = typeAliases.filter((typeAlias) => typeNames.includes(typeAlias.getName()));
  const matchAndExportedInTypeAliases = matchedTypeAliases.filter((typeAlias) => typeAlias.isExported());

  const matchedInterfaces = interfaces.filter((interfaceNode) => typeNames.includes(interfaceNode.getName()));
  const matchAndExportedInterfaces = matchedInterfaces.filter((interfaceNode) => interfaceNode.isExported());

  const matchedClasses = classes.filter((classNode) => {
    const name = classNode.getName();
    return name != null && typeNames.includes(name);
  });
  const matchAndExportedClasses = matchedClasses.filter((classNode) => classNode.isExported());

  // local export는 default export 일 수 없다. default export는 route handler function 전용으로
  // 제한되어 있기 때문이다
  const importCodeBases = [
    matchAndExportedInTypeAliases.map((typeAlias) => {
      const moduleName = getTypeSymbolText(typeAlias.getType(), (node) =>
        node.getType().getSymbolOrThrow().getEscapedName(),
      );

      return {
        isExternalLibraryImport: false,
        hash: moduleHash,
        importAt: moduleSourceFilePath,
        exportFrom: moduleSourceFilePath,
        importDeclarations: [
          {
            isDefaultExport: false,
            importModuleNameFrom: moduleName,
            importModuleNameTo: appendPostfixHash(moduleName, moduleHash),
            isPureType: true,
          },
        ],
      } satisfies IGetModuleInImports;
    }),
    matchAndExportedInterfaces.map((interfaceNode) => {
      const moduleName = getTypeSymbolText(interfaceNode.getType(), (node) =>
        node.getType().getSymbolOrThrow().getEscapedName(),
      );

      return {
        isExternalLibraryImport: false,
        hash: moduleHash,
        importAt: moduleSourceFilePath,
        exportFrom: moduleSourceFilePath,
        importDeclarations: [
          {
            isDefaultExport: false,
            importModuleNameFrom: moduleName,
            importModuleNameTo: appendPostfixHash(moduleName, moduleHash),
            isPureType: true,
          },
        ],
      } satisfies IGetModuleInImports;
    }),

    matchAndExportedClasses.map((classNode) => {
      const moduleName = getTypeSymbolText(classNode.getType(), (node) =>
        node.getType().getSymbolOrThrow().getEscapedName(),
      );

      return {
        isExternalLibraryImport: false,
        hash: moduleHash,
        importAt: moduleSourceFilePath,
        exportFrom: moduleSourceFilePath,
        importDeclarations: [
          {
            isDefaultExport: false,
            importModuleNameFrom: moduleName,
            importModuleNameTo: appendPostfixHash(moduleName, moduleHash),
            isPureType: true,
          },
        ],
      } satisfies IGetModuleInImports;
    }),
  ].flat();

  return importCodeBases;
}