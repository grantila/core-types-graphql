import {
	type ListTypeNode,
	type NamedTypeNode,
	type NameNode,
	type NonNullTypeNode,
	type StringValueNode,
	type TypeNode,
	type UnionTypeDefinitionNode,
	Kind,
} from 'graphql'


export function gqlNameNode( name: string ): NameNode
{
	return { kind: Kind.NAME, value: name };
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
		kind: Kind.UNION_TYPE_DEFINITION,
		name,
		...( description ? { description } : { } ),
		types,
	};
}

export function gqlNamedTypeNode( name: string ): NamedTypeNode
{
	return { kind: Kind.NAMED_TYPE, name: gqlNameNode( name ) };
}

export function gqlListTypeNode( type: TypeNode ): ListTypeNode
{
	return { kind: Kind.LIST_TYPE, type };
}

export function gqlMaybeRequiredNode(
	type: NamedTypeNode | ListTypeNode,
	required: boolean
)
: NonNullTypeNode | NamedTypeNode | ListTypeNode
{
	return !required ? type : { kind: Kind.NON_NULL_TYPE, type };
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
	return type.kind === Kind.NON_NULL_TYPE;
}
