import {
	TypeNode,
	ListTypeNode,
	NamedTypeNode,
	NameNode,
	NonNullTypeNode,
	StringValueNode,
	UnionTypeDefinitionNode,
} from 'graphql'


export function gqlNameNode( name: string ): NameNode
{
	return { kind: 'Name', value: name };
}

export interface UnionTypeOptions
{
	name: NameNode;
	description?: StringValueNode;
	types: Array< NamedTypeNode >;
}

export function gqlUnionType( { name, description, types }: UnionTypeOptions )
: UnionTypeDefinitionNode
{
	return {
		kind: 'UnionTypeDefinition',
		name,
		...( description ? { description } : { } ),
		types,
	};
}

export function gqlNamedTypeNode( name: string ): NamedTypeNode
{
	return { kind: 'NamedType', name: gqlNameNode( name ) };
}

export function gqlListTypeNode( type: TypeNode ): ListTypeNode
{
	return { kind: 'ListType', type };
}

export function gqlMaybeRequiredNode(
	type: NamedTypeNode | ListTypeNode,
	required: boolean
)
: NonNullTypeNode | NamedTypeNode | ListTypeNode
{
	return !required ? type : { kind: 'NonNullType', type };
}

export function gqlStripRequired(
	type: NonNullTypeNode | NamedTypeNode | ListTypeNode
)
: NamedTypeNode | ListTypeNode
{
	return isRequired( type ) ? type.type : type;
}

export function isRequired(
	type: NonNullTypeNode | NamedTypeNode | ListTypeNode
)
: type is NonNullTypeNode
{
	return type.kind === 'NonNullType';
}
