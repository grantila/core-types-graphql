import { getBreakingChanges, getDangerousChanges } from './schema'


describe( "schema", ( ) =>
{
	it( "getBreakingChanges", ( ) =>
	{
		const breaking = getBreakingChanges(
			"union Foo = String",
			"union Foo = Int"
		);
		expect( breaking ).toStrictEqual( [ {
			type: "TYPE_REMOVED_FROM_UNION",
			description: "String was removed from union type Foo.",
		} ] );
	} );

	it( "getDangerousChanges", ( ) =>
	{
		const dangerous = getDangerousChanges(
			"union Foo = String",
			"union Foo = String | Int"
		);
		expect( dangerous ).toStrictEqual( [ {
			description: "Int was added to union type Foo.",
			type: "TYPE_ADDED_TO_UNION",
		} ] );
	} );
} );
