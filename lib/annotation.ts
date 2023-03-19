import { type CoreTypeAnnotations, ensureArray } from "core-types"
import { StringValueNode } from "graphql"

import { Context } from "./types.js"


/**
 * Turns annotations into Markdown comments, which is the standard GraphQL
 * comment format.
 */
export function stringifyAnnotations(
	node: CoreTypeAnnotations,
	ctx: Context
): string
{
	const { description, examples, default: _default, comment } = node;
	const exampleArray = ensureArray( examples );
	const fullComment =
		[
			description,
			...( examples == undefined ? [ ] : [
				formatExamples( exampleArray, ctx )
			] ),
			...( _default === undefined ? [ ] : [
				formatDefault( _default, ctx )
			] ),
			...( ctx.options.includeComment ? [ comment ] : [ ] ),
		]
		.filter( v => v )
		.join( "\n\n" )
		.trim( );

	return fullComment;
}

function enquoteCode( code: string, ctx: Context )
{
	if ( code.includes( "`" ) )
		return code;

	if ( code.includes( "\n" ) )
		return "```\n" + code + "\n```";
	else
		return "`" + code + "`";
}

function formatExamples( examples: Array< string >, ctx: Context ): string
{
	const lines =
		examples.map( example =>
			"# example\n" + indent( enquoteCode( example, ctx ) )
		)
		.join( "\n" )
		.trim( );

	return lines;
}

function formatDefault( _default: string, ctx: Context ): string
{
	return `# default\n${indent( enquoteCode( _default, ctx ) )}`;
}

function indent( text: string ): string
{
	return text
		.split( "\n" )
		.map( line => `    ${line}` )
		.join( "\n" );
}

export function parseDescription(
	descriptionText: StringValueNode | string | undefined
)
: CoreTypeAnnotations
{
	descriptionText =
		( descriptionText && typeof descriptionText === 'object' )
		? parseString( descriptionText )
		: descriptionText;

	if ( !descriptionText )
		return { };

	const description = [ ] as Array< string >;
	const examples = [ ] as Array< Array< string > >;
	const _default = [ ] as Array< string >;

	let where: 'description' | 'examples' | 'default' = 'description';

	descriptionText
		.split( "\n" )
		.forEach( line =>
		{
			if ( line.match( /^#+\s*example$/ ) )
			{
				where = 'examples';
				examples.push( [ ] );
				return;
			}
			else if ( line.match( /^#+\s*default$/ ) )
			{
				where = 'default';
				return;
			}
			else if ( where === 'examples' )
				examples[ examples.length - 1 ].push( line );
			else if ( where === 'default' )
				_default.push( line );
			else // 'description'
				description.push( line );
		} );

	return {
		...(
			description.length === 0 ? { } :
			{ description: joinUnindentedBlock( description ).trim( ) }
		),
		...(
			examples.length === 0
			? { }
			: examples.length === 1
			? { examples: joinUnindentedBlock( examples[ 0 ] ) }
			:
			{
				examples: examples
					.map( example => joinUnindentedBlock( example ) )
			}
		),
		...(
			_default.length === 0 ? { } :
			{ default: joinUnindentedBlock( _default ) }
		),
	};
}

function joinUnindentedBlock( lines: Array< string > ): string
{
	return unindentEqual( lines ).join( "\n" );
}

export function unindentEqual( lines: Array< string > ): Array< string >
{
	if ( lines.length === 0 || lines[ 0 ].length === 0 )
		return lines;

	const char = lines[ 0 ].charAt( 0 );

	if ( char !== ' ' && char !== '\t' )
		return lines;

	const re = new RegExp( `^(${char}+)` );
	const initial = ( lines[ 0 ].match( re ) as RegExpMatchArray )[ 1 ].length;
	const indent = lines.reduce(
		( prev, cur ) =>
		{
			const m = cur.match( re );
			if ( !m || m[ 1 ].length === 0 )
				return 0;
			return Math.min( prev, m[ 1 ].length );
		},
		initial
	);

	return lines.map( line => line.slice( indent ) );
}

export function parseString( str: StringValueNode | undefined )
: string | undefined
{
	return str?.value;
}
