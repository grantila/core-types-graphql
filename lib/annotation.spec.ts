import { unindentEqual } from './annotation.js'


describe( "annotation", ( ) =>
{
	it( "unindentEqual with tabs", ( ) =>
	{
		const ct = unindentEqual( [
			"		{",
			"			foo: 'bar'",
			"		}",
		] );
		expect( ct ).toStrictEqual( [
			"{",
			"	foo: 'bar'",
			"}",
		] );
	} );

	it( "unindentEqual with spaces", ( ) =>
	{
		const ct = unindentEqual( [
			"    {",
			"      foo: 'bar'",
			"    }",
		] );
		expect( ct ).toStrictEqual( [
			"{",
			"  foo: 'bar'",
			"}",
		] );
	} );
} );
