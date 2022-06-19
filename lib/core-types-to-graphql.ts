import {
	ArrayType,
	CoreTypeAnnotations,
	NamedType,
	NodeType,
	TupleType,
	ObjectType,
	OrType,
	extractAnnotations,
	throwUnsupportedError,
	NodePath,
	isNonNullable,
	NodeDocument,
	UnsupportedError,
	ConversionResult,
} from 'core-types'
import {
	DefinitionNode,
	DocumentNode,
	FieldDefinitionNode,
	ListTypeNode,
	NamedTypeNode,
	ObjectTypeDefinitionNode,
	StringValueNode,
	TypeDefinitionNode,
	UnionTypeDefinitionNode,
	Kind,
	print,
} from 'graphql'
import {
	gqlNameNode,
	gqlNamedTypeNode,
	gqlUnionType,
	gqlListTypeNode,
	gqlMaybeRequiredNode,
} from './gql-utils'
import { stringifyAnnotations } from './annotation'
import type {
	Context,
	CoreTypesToGraphqlOptions,
	NameGeneratorTestFunction,
} from './types'


function defaultNameGenerator(
	baseName: string,
	nameHint: string,
	test: NameGeneratorTestFunction
)
: string
{
	let name: string = `${baseName}_${nameHint}`;
	let i = 1;
	while ( !test( name ) )
		name = `${baseName}_${nameHint}_${++i}`;
	return name;
}

function makePackageLine( userPackage?: string, userPackageUrl?: string )
{
	return !userPackage && !userPackageUrl
		? ''
		: userPackage && userPackageUrl
		? `${userPackage} (${userPackageUrl})`
		: userPackage
		? `${userPackage}`
		: `${userPackageUrl}`
}

function makeHeader(
	filename?: string,
	sourceFilename?: string,
	userPackage?: string,
	userPackageUrl?: string
)
: string
{
	const outfile = filename ? `The file ${filename}` : 'This file';
	const infile = sourceFilename ? ` from ${sourceFilename}` : '';
	const thisPackage = makePackageLine(
		'core-types-graphql',
		'https://github.com/grantila/core-types-graphql'
	);
	const thatPackage = makePackageLine( userPackage, userPackageUrl );

	return [
		`${outfile} was auto-generated${infile} using`,
		thisPackage,
		...( !thatPackage ? [ ] : [ "on behalf of", thatPackage ] ),
	]
	.map( line => `# ${line}` )
	.join( "\n" );
}

export function convertCoreTypesToGraphqlAst(
	doc: NodeDocument,
	options: CoreTypesToGraphqlOptions = { }
)
: ConversionResult< DocumentNode >
{
	if ( doc.version !== 1 )
		throw new UnsupportedError(
			`core-types version ${doc.version} is not supported`
		);

	const { types } = doc;

	const {
		warn = ( message: string ) => console.warn( message ),
		nullTypeName = null,
		nameGenerator = defaultNameGenerator,
		unsupported = 'warn',
		includeComment = false,
	} = options;

	const ctx: Context = {
		options: {
			warn,
			nullTypeName,
			nameGenerator,
			unsupported,
			includeComment,
		},
		nameMap: new Map( types.map( node => [ node.name, { node } ] ) ),
		nameGenerator: ( baseName: string, nameHint: string ) =>
			ctx.options.nameGenerator(
				baseName,
				nameHint,
				name => !ctx.nameMap.has( name )
			),
	};

	const convertedTypes: Array< string > = [ ];
	const notConvertedTypes: Array< string > = [ ];

	const definitions = types
		.map( ( node, index ): DefinitionNode | undefined =>
		{
			const convert = ( ): DefinitionNode | undefined =>
			{
				if (
					node.type === 'boolean'
					||
					node.type === 'number'
					||
					node.type === 'integer'
					||
					node.type === 'string'
				)
					return makeUnionType(
						{
							name: node.name,
							...extractAnnotations( node ),
							type: 'or',
							or: [ node ],
						},
						ctx
					);
				else if ( node.type === 'null' )
				{
					if ( nullTypeName )
						return gqlUnionTypeOfTypes(
							node,
							[ gqlNamedTypeNode( nullTypeName ) ],
							ctx
						);
					return handleUnsupported( ctx, node, [ index ] );
				}
				else if ( node.type === 'or' )
				{
					return makeUnionType( node, ctx );
				}
				else if ( node.type === 'object' )
					return makeObjectType( node, ctx );
				else
					return handleUnsupported( ctx, node, [ index ] );
			}

			const gqlNode = convert( );
			( gqlNode ? convertedTypes : notConvertedTypes ).push( node.name );
			return gqlNode;
		} )
		.filter( isNonNullable );

	return {
		data: {
			definitions,
			kind: Kind.DOCUMENT,
		},
		convertedTypes,
		notConvertedTypes,
	};
}

function handleUnsupported( ctx: Context, node: NodeType, path?: NodePath )
: undefined | never
{
	if ( ctx.options.unsupported === 'ignore' )
		return;

	const message = `Type '${node.type}' not supported`;
	try
	{
		throwUnsupportedError( message, node, path );
	}
	catch ( err )
	{
		if ( ctx.options.unsupported === 'error' )
			throw err;
		ctx.options.warn( message, err as UnsupportedError );
	}
}

function ensureEndingNewLine( text: string )
{
	if ( text.length && !text.endsWith( '\n' ) )
		return text + '\n';
	return text;
}

export function convertCoreTypesToGraphql(
	doc: NodeDocument,
	options: CoreTypesToGraphqlOptions = { }
)
: ConversionResult
{
	const {
		data: ast,
		convertedTypes,
		notConvertedTypes,
	} = convertCoreTypesToGraphqlAst( doc, options );

	const header =
		( options.includeComment ?? true )
		? makeHeader(
			options.filename,
			options.sourceFilename,
			options.userPackage,
			options.userPackageUrl
		)
		: undefined;

	return {
		data: ensureEndingNewLine(
			( header ? `${header}\n\n` : '' ) + print( ast )
		),
		convertedTypes,
		notConvertedTypes,
	};
}

function gqlUnionTypeOfTypes(
	node: NamedType< NodeType >,
	types: Array< NamedTypeNode >,
	ctx: Context
)
: UnionTypeDefinitionNode
{
	return gqlUnionType( { ...makeCommonTypeProperties( node, ctx ), types } );
}

function makeUnionType(
	node: NamedType< OrType >,
	ctx: Context
)
: UnionTypeDefinitionNode | undefined
{
	const types = node.or
		.map( ( or, index ) =>
			nodeToNamedType( or, node.name, `T${index}`, ctx )
		)
		.filter( isNonNullable );

	if ( types.length === 0 )
		return undefined;

	return gqlUnionTypeOfTypes( node, types, ctx );
}

function makeCommonTypeProperties( node: NamedType< NodeType >, ctx: Context )
: Pick< TypeDefinitionNode, 'name' | 'description' >
{
	return {
		name: gqlNameNode( node.name ),
		...makeCommonTypePropertiesWithoutName( node, ctx ),
	};
}

function makeCommonTypePropertiesWithoutName( node: NodeType, ctx: Context )
: Pick< TypeDefinitionNode, 'description' >
{
	const description = annotationToComment( node, ctx );
	return {
		...( description ? { description } : { } )
	};
}


function makeObjectType( node: NamedType< ObjectType >, ctx: Context )
: ObjectTypeDefinitionNode
{
	return {
		...makeCommonTypeProperties( node, ctx ),
		kind: Kind.OBJECT_TYPE_DEFINITION,
		fields: Object.entries( node.properties )
			.map(
				( [ name, { node: child, required } ] )
				: FieldDefinitionNode | undefined =>
				{
					const typeNode = nodeToNamedTypeOrList(
						child,
						node.name,
						name,
						ctx
					);
					if ( typeNode === undefined )
						return undefined;
					return {
						kind: Kind.FIELD_DEFINITION,
						...makeCommonTypePropertiesWithoutName( child, ctx ),
						name: gqlNameNode( name ),
						type: gqlMaybeRequiredNode( typeNode, required ),
					};
				}
			)
			.filter( isNonNullable ),
	};
}

function ensureArrayType( node: TupleType | ArrayType ): ArrayType
{
	return node.type === 'array'
		? node
		: {
			...node,
			type: 'array',
			elementType: { type: 'or', or: node.elementTypes },
		};
}

function nodeToNamedTypeOrList(
	node: NodeType,
	baseName: string,
	nameHint: string,
	ctx: Context
)
: NamedTypeNode | ListTypeNode | undefined
{
	if ( node.type === 'array' || node.type === 'tuple' )
	{
		const namedType = nodeToNamedTypeOrList(
			ensureArrayType( node ).elementType,
			baseName,
			nameHint,
			ctx
		);
		if ( namedType === undefined )
			return namedType;
		return gqlListTypeNode( gqlMaybeRequiredNode( namedType, true ) );
	}
	else
		return nodeToNamedType( node, baseName, nameHint, ctx );
}

function nodeToNamedType(
	node: NodeType,
	baseName: string,
	nameHint: string,
	ctx: Context
)
: NamedTypeNode | undefined
{
	const typeName =
		node.type === 'boolean'
		? 'Boolean'
		: node.type === 'integer'
		? 'Int'
		: node.type === 'number'
		? 'Float'
		: node.type === 'string'
		? 'String'
		: node.type === 'ref'
		? node.ref
		: makeNamedType( node, baseName, nameHint, ctx );

	return typeName === undefined ? typeName : gqlNamedTypeNode( typeName );
}

function makeNamedType(
	node: NodeType,
	baseName: string,
	nameHint: string,
	ctx: Context
)
: string | undefined
{
	if ( node.type !== 'object' )
		return handleUnsupported( ctx, node );

	const name = ctx.nameGenerator( baseName, nameHint );

	const gqlType = makeObjectType( { ...node, name }, ctx );

	ctx.nameMap.set( name, { node, gqlType } );

	return name;
}

function annotationToComment( node: CoreTypeAnnotations, ctx: Context )
: StringValueNode | undefined
{
	const comment = stringifyAnnotations( node, ctx );
	if ( !comment )
		return undefined;
	return {
		kind: Kind.STRING,
		value: comment,
		block: comment.includes( "\n" ),
	};
}
