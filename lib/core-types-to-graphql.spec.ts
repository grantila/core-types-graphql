import { NamedType, NodeDocument, UnsupportedError } from 'core-types'
import { convertCoreTypesToGraphql } from './core-types-to-graphql'


const wrapDocument = ( types: Array< NamedType > ): NodeDocument =>
	( { version: 1, types } );

describe( "graphql-to-core-types", ( ) =>
{
	it( "Object type", ( ) =>
	{
		const schema = convertCoreTypesToGraphql( wrapDocument( [
			{
				name: 'Foo',
				type: 'object',
				description: "This is a foo",
				examples: "{ req: 'the foo', opt: 4 }",
				additionalProperties: false,
				properties: {
					req: {
						node: { type: 'string', description: 'required...' },
						required: true
					},
					opt: {
						node: { type: 'integer', examples: [ "5", "8" ] },
						required: false
					},
					optarr: {
						node: {
							type: 'array',
							description: 'optional array...',
							elementType: { type: 'string' }
						},
						required: false
					},
					decimal: { node: { type: 'number' }, required: false },
					someref: {
						node: { type: 'ref', ref: 'UserBlob' },
						required: true,
					},
				},
			}
		] ) );
		expect( schema ).toMatchSnapshot( );
	} );

	describe( "header comment", ( ) =>
	{
		// filename?: string,
		// sourceFilename?: string,

		it( "User package", ( ) =>
		{
			const schema = convertCoreTypesToGraphql( wrapDocument( [
				{
					name: 'Foo',
					type: 'string',
				}
			] ), { userPackage: 'foo' } );
			expect( schema ).toMatchSnapshot( );
		} );

		it( "User package url", ( ) =>
		{
			const schema = convertCoreTypesToGraphql( wrapDocument( [
				{
					name: 'Foo',
					type: 'string',
				}
			] ), { userPackageUrl: 'foo.com' } );
			expect( schema ).toMatchSnapshot( );
		} );

		it( "Filename", ( ) =>
		{
			const schema = convertCoreTypesToGraphql( wrapDocument( [
				{
					name: 'Foo',
					type: 'string',
				}
			] ), { filename: 'out.gql' } );
			expect( schema ).toMatchSnapshot( );
		} );

		it( "Source filename", ( ) =>
		{
			const schema = convertCoreTypesToGraphql( wrapDocument( [
				{
					name: 'Foo',
					type: 'string',
				}
			] ), { sourceFilename: 'infile.ts' } );
			expect( schema ).toMatchSnapshot( );
		} );

		it( "Everything", ( ) =>
		{
			const schema = convertCoreTypesToGraphql( wrapDocument( [
				{
					name: 'Foo',
					type: 'string',
				}
			] ), {
				userPackage: 'foo',
				userPackageUrl: 'foo.com',
				filename: 'out.gql',
				sourceFilename: 'infile.ts',
			} );
			expect( schema ).toMatchSnapshot( );
		} );
	} );

	it( "throw on null type", ( ) =>
	{
		const convert = ( ) => convertCoreTypesToGraphql(
			wrapDocument( [
				{ name: 'Nullish', type: 'null', loc: { start: 17, end: 42 } }
			] ),
			{
				unsupported: 'error',
			}
		);

		expect( convert ).toThrowError( UnsupportedError );

		try
		{
			convert( );
		}
		catch ( err )
		{
			const { blob } = err as UnsupportedError;
			expect( blob.loc ).toStrictEqual( { start: 17, end: 42 } );
		}
	} );

	it( "used in readme", ( ) =>
	{
		const graphql = convertCoreTypesToGraphql( wrapDocument( [
			{
				name: 'User',
				title: 'User type',
				description:
					'This type holds the user information, such as name',
				type: 'object',
				properties: {
					name: {
						node: { type: 'string', title: 'The real name' },
						required: true
					},
				},
				additionalProperties: false,
			},
			{
				name: 'ChatLine',
				title: 'A chat line',
				type: 'object',
				properties: {
					user: {
						node: { type: 'ref', ref: 'User' }, required: true
					},
					line: { node: { type: 'string' }, required: true },
				},
				additionalProperties: false,
			},
		] ) );

		expect( graphql ).toMatchSnapshot( );
	} );
} );
