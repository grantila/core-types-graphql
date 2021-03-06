Object.fromEntries ??= require( 'fromentries' );

export type {
	CoreTypesToGraphqlOptions,
	GraphqlToCoreTypesOptions,
	NameGeneratorFunction,
} from './lib/types'
export {
	convertCoreTypesToGraphql,
	convertCoreTypesToGraphqlAst,
} from './lib/core-types-to-graphql'
export {
	convertGraphqlToCoreTypes,
	getGraphqlAst,
} from './lib/graphql-to-core-types'
export {
	getBreakingChanges,
	getDangerousChanges,
} from './lib/schema'
