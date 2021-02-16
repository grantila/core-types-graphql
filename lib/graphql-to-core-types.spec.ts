import { convertGraphqlToCoreTypes } from './graphql-to-core-types'


describe( "graphql-to-core-types", ( ) =>
{
	it( "unions and objects", ( ) =>
	{
		const schema = `
		"Kind of a string"
		union Stringish = String

		"string or foo"
		union Bar = Stringish | Foo

		"""
		This is a foo

		fyi
		"""
		type Foo {
			"required prop"
			name: [Stringish!]!

			"""
			optional prop
			# example
				4
			# example
				{
					foo: 'bar'
				}
			# default
				42
			"""
			age: Int
			"The whiskey bar"
			bar: Bar!
		}`;
		const ct = convertGraphqlToCoreTypes( schema ).data.types;
		expect( ct ).toMatchSnapshot( );
	} );

	it( "enums", ( ) =>
	{
		const schema = `
		"Compression levels"
		enum CompressionLevel {
			None,
			Low,
			_2,
			_3,
			High,
		}`;
		const ct = convertGraphqlToCoreTypes( schema ).data.types;
		expect( ct ).toMatchSnapshot( );
	} );
} );
