import type { ImportClause } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

export default function getNamedBindingName(bindings: ReturnType<ImportClause['getNamedBindings']>) {
  if (bindings == null) {
    return [];
  }

  // namespace import에 대한 내용을 정리해야한다
  if (bindings.getKind() === SyntaxKind.NamespaceImport) {
    // const namespaceImport = bindings.asKindOrThrow(tsm.SyntaxKind.NamespaceImport);
    return [];
  }

  const namedImports = bindings.asKindOrThrow(SyntaxKind.NamedImports);
  const names = namedImports.getElements().map((element) => {
    return element.getName();
  });

  return names;
}