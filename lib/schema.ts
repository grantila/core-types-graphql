import {
	findBreakingChanges,
	findDangerousChanges,
	buildSchema,
} from 'graphql'

export function getBreakingChanges( from: string, to: string )
{
	return findBreakingChanges( buildSchema( from ), buildSchema( to ) );
}

export function getDangerousChanges( from: string, to: string )
{
	return findDangerousChanges( buildSchema( from ), buildSchema( to ) );
}
