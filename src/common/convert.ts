/**
 * Helper function producing a localized display
 * date/time string from an epoch date string.
 *
 * @param value epoch date string in the form of
 * <seconds>.<nanos>.
 *
 * @returns a human readable localized string
 * representation of the date.
 */
export function displayEpochString(value: string): string {
	const [secondsAsString, nanosecondsAsString] = value.split('.');
	const seconds = parseInt(secondsAsString, 10);
	const nanoseconds = parseInt(nanosecondsAsString, 10);
	const date = new Date(seconds * 1000 + nanoseconds / 1000000.0);
	return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
