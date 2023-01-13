import type { ParameterDeclaration, TypeReferenceNode } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

export default function getTypeReferences(parameter: ParameterDeclaration, dedupe?: boolean) {
  const doDedupe = dedupe ?? true;

  const typeReferenceNodes = parameter
    .forEachDescendantAsArray()
    .filter((node) => {
      return node.getKind() === SyntaxKind.TypeReference;
    })
    .map((node) => node.asKindOrThrow(SyntaxKind.TypeReference));

  if (doDedupe === false) {
    return typeReferenceNodes;
  }

  const typeReferenceRecord = typeReferenceNodes.reduce<Record<string, TypeReferenceNode>>((aggregated, node) => {
    const type = node.getText();
    return aggregated[type] == null ? { ...aggregated, [type]: node } : { ...aggregated };
  }, {});

  const dedupedTypeReferenceNodes = Object.values(typeReferenceRecord);
  return dedupedTypeReferenceNodes;
}
