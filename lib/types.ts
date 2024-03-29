import type { NodeType, WarnFunction } from 'core-types'
import type { TypeDefinitionNode } from 'graphql'


export type NameGeneratorTestFunction = ( name: string ) => boolean;

export type NameGeneratorFunction =
	( baseName: string, nameHint: string, test: NameGeneratorTestFunction ) =>
		string;

export type InternalNameGeneratorFunction =
	( baseName: string, nameHint: string ) => string;

export interface CoreTypesToGraphqlOptions
{
	warn?: WarnFunction;

	/**
	 * The filename to be written to. This is a hint, no file will be written
	 * by the conversion function.
	 */
	filename?: string;

	/**
	 * The name of the source file from which the core-types comes.
	 */
	sourceFilename?: string;

	/**
	 * The name of the package using this package.
	 */
	userPackage?: string;

	/**
	 * The url to the package using this package.
	 */
	userPackageUrl?: string;

	/**
	 * Optional custom type used for null
	 */
	nullTypeName?: string | null;

	/**
	 * A function for generating names. GraphQL doesn't support inline objects
	 * or union types, so these must be constructed as separate types.
	 */
	nameGenerator?: NameGeneratorFunction;

	/**
	 * What to do when detecting an unsupported type
	 *
	 *  - `ignore`: Ignore (skip) type
	 *  - `warn`: Ignore type, but warn (default)
	 *  - `error`: Throw an error
	 */
	unsupported?: 'ignore' | 'warn' | 'error';

	/**
	 * Includes a header comment about the auto-generated file
	 */
	includeComment?: boolean;
}

export interface GraphqlToCoreTypesOptions
{
	warn?: WarnFunction;

	/**
	 * What to do when detecting an unsupported type
	 *
	 *  - `ignore`: Ignore (skip) type (default)
	 *  - `warn`: Ignore type, but warn
	 *  - `error`: Throw an error
	 */
	unsupported?: 'ignore' | 'warn' | 'error';
}

export interface NameMapItem
{
	node: NodeType;
	gqlType?: TypeDefinitionNode;
}

export interface Context
{
	options: Required<
		Omit<
			CoreTypesToGraphqlOptions,
			'filename' | 'sourceFilename' | 'userPackage' | 'userPackageUrl'
		>
	>;
	nameMap: Map< string, NameMapItem >;
	nameGenerator: InternalNameGeneratorFunction;
}
