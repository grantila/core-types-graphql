import { convertGraphqlToCoreTypes } from './graphql-to-core-types.js'
import { convertCoreTypesToGraphql } from './core-types-to-graphql.js'


describe( "two-way", ( ) =>
{
	it( "Two-way graphql-to-core-types-to-graphql equality", ( ) =>
	{
		const schema = `
			"Kind of a string"
			union Stringish = String

			"string or foo"
			union Bar = Stringish | Foo

			"""
			# This is a foo

			fyi
			"""
			type Foo {
				"required prop"
				name: [Stringish!]!
				"""
				# optional prop

				# example
					\`4\`
				# example
				\`\`\`
					{
						foo: 'bar'
					}
				\`\`\`
				"""
				age: Int
			}
		`;
		const { data: ct } = convertGraphqlToCoreTypes( schema );
		const { data: gql } =
			convertCoreTypesToGraphql( ct, { includeComment: false } );

		expect( untab( )( gql.trim( ) ) )
			.toEqual( untab( )( schema.trim( ) ) );
	} );
} );

function untab( )
{
	const re = new RegExp( `^[\t ]+` );
	return ( text: string ): string =>
	{
		return text
			.split( "\n" )
			.map( line => line.replace( re, '' ) )
			.join( "\n" );
	};
}
