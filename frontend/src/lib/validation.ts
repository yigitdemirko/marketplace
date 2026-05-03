// Letters (any script — Turkish, Latin, etc.), spaces, hyphens, apostrophes only.
const NAME_REGEX = /^[\p{L}][\p{L}\s'-]*$/u

export function isValidName(value: string): boolean {
  return NAME_REGEX.test(value.trim())
}
