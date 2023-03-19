import type { LocationWithLineColumn } from 'core-types'


export interface GqlLocation
{
	line: number;
	column: number;
}

export function gqlLocationsToCoreTypesLocation(
	source: string,
	loc: ReadonlyArray< GqlLocation >
)
: LocationWithLineColumn
{
	if ( loc.length === 0 )
		return { };

	const firstLoc = loc[ 0 ];

	const offset = source
		.split( "\n" )
		.slice( 0, firstLoc.line )
		.map( ( line, index, arr ) =>
			( index === arr.length - 1 )
			? firstLoc.column
			: line.length
		)
		.reduce( ( prev, cur ) => prev + cur, 0 );

	return {
		start: {
			line: firstLoc.line,
			column: firstLoc.column,
			offset,
		},
	};
}
