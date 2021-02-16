import {
	NodeDocument,
	ArrayType,
	BooleanType,
	CoreTypesErrorMeta,
	IntegerType,
	NamedType,
	NodeType,
	NumberType,
	ObjectProperty,
	OrType,
	RefType,
	StringType,
	UnsupportedError,
	ConversionResult,
	throwRelatedError,
} from 'core-types'
import {
	DocumentNode,
	FieldDefinitionNode,
	ListTypeNode,
	NamedTypeNode,
	NameNode,
	UnionTypeDefinitionNode,
	parse,
	GraphQLError,
} from 'graphql'
import { parseDescription } from './annotation'
import { gqlStripRequired, isRequired } from './gql-utils'
import { GraphqlToCoreTypesOptions } from './types'
import { gqlLocationsToCoreTypesLocation } from './utils'


export function getGraphqlAst( source: string )
: DocumentNode
{
	return parse( source );
}

export function convertGraphqlToCoreTypes(
	source: string,
	options?: GraphqlToCoreTypesOptions,
)
: ConversionResult< NodeDocument >
{
	const {
		warn = ( message: string ) => console.warn( message ),
		unsupported = 'ignore',
	} = options ?? { };

	let document: DocumentNode;
	try
	{
		document = getGraphqlAst( source );
	}
	catch ( err )
	{
		if ( err instanceof GraphQLError )
			throwRelatedError(
				err,
				{
					source,
					loc: gqlLocationsToCoreTypesLocation(
						source,
						err.locations ?? [ ]
					)
				}
			);
		throw err;
	}

	if ( document.kind !== 'Document' )
		throw new UnsupportedError(
			`Invalid document type "${document.kind}"`,
			{
				blob: document,
				path: [ ],
				loc: document.loc,
			}
		);

	const notConvertedTypes: Array< string > = [ ];

	const types = document.definitions
	.map( ( definition ): NamedType< NodeType > | undefined =>
	{
		if ( definition.kind === 'UnionTypeDefinition' )
		{
			if ( !definition.types?.length )
			{
				notConvertedTypes.push( definition.name.value );
				return;
			}

			else if ( definition.types.length === 1 )
			{
				return {
					...parseCommonFields( definition ),
					...parseType( definition.types[ 0 ] ),
				};
			}

			else // Multiple types in union => or-type
				return {
					...parseCommonFields( definition ),
					type: 'or',
					or: definition.types.map( type => parseType( type ) ),
				};
		}
		else if ( definition.kind === 'ObjectTypeDefinition' )
		{
			const fields = definition.fields ?? [ ];
			return {
				...parseCommonFields( definition ),
				type: 'object',
				additionalProperties: false,
				properties: Object.fromEntries(
					fields.map( field => parseObjectField( field ) )
				)
			};
		}
		else
		{
			if ( unsupported === 'ignore' )
			{
				const name = ( definition as any )?.name?.value;
				if ( name )
					notConvertedTypes.push( name );
				return;
			}

			const message = `GraphQL kind ${definition.kind} not supported`;
			const meta: CoreTypesErrorMeta = {
				blob: definition,
				source,
				loc: definition.loc,
			};

			if ( unsupported === 'warn' )
				warn( message, meta );
			else
				throw new UnsupportedError( message, meta );
		}
	} )
	.filter( < T >( t: T ): t is NonNullable< T > => !!t );

	return {
		data: { version: 1, types },
		convertedTypes: types.map( ( { name } ) => name ),
		notConvertedTypes,
	};
}

function parseCommonFields(
	type: Pick< UnionTypeDefinitionNode, 'description' | 'loc' | 'name' >
)
: Omit< NamedType< NodeType >, 'type' >
{
	return {
		name: parseName( type.name ),
		...parseCommonFieldsWithoutName( type ),
	};
}

function parseCommonFieldsWithoutName(
	type: Pick< UnionTypeDefinitionNode, 'description' | 'loc' >
)
: Omit< NamedType< NodeType >, 'type' | 'name' >
{
	return {
		...parseDescription( type.description ),
		...( type.loc ? { loc: type.loc } : { } ),
	};
}

function parseName( name: NameNode ): string
{
	return name.value;
}

function parseFieldType( field: NamedTypeNode | ListTypeNode )
:
	| ArrayType
	| BooleanType
	| IntegerType
	| NumberType
	| StringType
	| RefType
	| OrType
{
	if ( field.kind === 'ListType' )
		return {
			type: 'array',
			elementType:
				isRequired( field.type )
				? parseFieldType( field.type.type )
				: {
					type: "or",
					or: [
						{ type: 'null' },
						parseFieldType( field.type ),
					]
				},
			...parseCommonFieldsWithoutName( field ),
		};
	else
		return parseType( field );
}

function parseObjectField( field: FieldDefinitionNode )
: [ string, ObjectProperty ]
{
	return [
		parseName( field.name ),
		{
			node: {
				...parseFieldType( gqlStripRequired( field.type ) ),
				...parseCommonFieldsWithoutName( field ),
			},
			required: isRequired( field.type ),
		}
	];
}

function parseType( type: NamedTypeNode )
: BooleanType | IntegerType | NumberType | StringType | RefType
{
	const name = parseName( type.name );
	if ( name === 'Boolean' )
		return { type: 'boolean' };
	else if ( name === 'Int' )
		return { type: 'integer' };
	else if ( name === 'Float' )
		return { type: 'number' };
	else if ( name === 'String' )
		return { type: 'string' };
	else
		return { type: 'ref', ref: name };
}
