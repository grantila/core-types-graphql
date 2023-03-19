import { gqlLocationsToCoreTypesLocation } from './utils.js'


describe( "utils", ( ) =>
{
	describe( "gqlLocationsToCoreTypesLocation", ( ) =>
	{
		const source = `
		this is
		source code
		`;

		it( "should handle locations", ( ) =>
		{
			const loc = gqlLocationsToCoreTypesLocation(
				source,
				[ { column: 4, line: 3 } ]
			);

			expect( loc ).toEqual( {
				start: {
					offset: 13,
					line: 3,
					column: 4,
				},
			} );
		} );

		it( "should handle empty input", ( ) =>
		{
			const loc = gqlLocationsToCoreTypesLocation( source, [ ] );

			expect( loc ).toEqual( { } );
		} );
	} );
} );
