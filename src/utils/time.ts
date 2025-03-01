import moment, { Duration, Moment } from 'moment'

/**
 * Custom error class for issues related to time range validation.
 *
 * @class TimeRangeError
 * @extends Error
 */
export class TimeRangeError extends Error {
	/**
	 * Creates a new TimeRangeError instance.
	 *
	 * @param {string} message - A descriptive error message.
	 */
	constructor(message: string) {
		super(message)
		this.name = 'TimeRangeError'
	}
}

/**
 * Validates that a given time range is valid and does not exceed the allowed maximum duration.
 *
 * This function performs the following checks:
 * - Ensures both `since` and `until` are valid Moment objects.
 * - Verifies that the time difference between `since` and `until` is less than the specified `maxDuration`
 *   (defaults to 1 month if not provided).
 *
 * @param {Moment} since - The starting time of the range.
 * @param {Moment} until - The ending time of the range.
 * @param {Object} [options] - Optional configuration.
 * @param {Duration} [options.maxDuration] - The maximum allowed duration between `since` and `until`. Defaults to 1 month.
 * @returns {{ since: Moment; until: Moment }} An object containing the validated start and end times.
 * @throws {TimeRangeError} If either date is invalid or if the time difference exceeds the allowed maximum.
 */
export function validateTimeRange(
	since: Moment,
	until: Moment,
	options?: {
		maxDuration: Duration
	},
): { since: Moment; until: Moment } {
	const maxDuration = options?.maxDuration || moment.duration(1, 'month')

	if (!since.isValid() || !until.isValid()) {
		throw new TimeRangeError("Invalid 'since' or 'until' date provided")
	}

	if (until.diff(since, 'seconds', true) > maxDuration.asSeconds()) {
		throw new TimeRangeError(
			`The difference between 'since' and 'until' must be less than ${maxDuration.humanize()}`,
		)
	}

	return { since, until }
}

/**
 * Infers missing time range boundaries based on a maximum duration.
 *
 * If `until` or `since` is not provided, the function infers their values as follows:
 *
 * - For a missing `until`:
 *   - If `since` is provided and maxDuration is finite, `until` is set to `since` plus maxDuration.
 *   - If `since` is provided and maxDuration is infinite, `until` defaults to the current moment.
 *   - If neither is provided, `until` defaults to the current moment.
 *
 * - For a missing `since`:
 *   - If maxDuration is finite, `since` is set to `until` minus maxDuration.
 *   - If maxDuration is infinite, `since` defaults to the Unix epoch (moment(0)).
 *
 * @param {Moment} [since] - The optional starting time of the range.
 * @param {Moment} [until] - The optional ending time of the range.
 * @param {Object} [options] - Optional configuration.
 * @param {Duration} [options.maxDuration] - The duration used to calculate missing values. Defaults to 1 month.
 * @returns {{ since: Moment; until: Moment }} An object containing the fully determined start and end times.
 */
export function fulfillTimeRange(
	since?: Moment,
	until?: Moment,
	options?: {
		maxDuration: Duration
	},
): { since: Moment; until: Moment } {
	const maxDuration = options?.maxDuration || moment.duration(1, 'month')
	const isInfinite = !isFinite(maxDuration.asSeconds())

	let untilFulfilled: Moment
	if (until) {
		untilFulfilled = until
	} else if (since) {
		untilFulfilled = isInfinite ? moment() : since.clone().add(maxDuration)
	} else {
		untilFulfilled = moment()
	}

	let sinceFulfilled: Moment
	if (since) {
		sinceFulfilled = since
	} else {
		sinceFulfilled = isInfinite
			? moment(0)
			: untilFulfilled.clone().subtract(maxDuration)
	}

	return {
		until: untilFulfilled,
		since: sinceFulfilled,
	}
}
