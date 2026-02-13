const { Injectable, BadRequestException } = require('@nestjs/common');

/**
 * Rubric Validator - Validates rubric structure
 * Rules from doc.txt:
 * - mustHave: 3-8 items
 * - goodToHave: 0-6 items
 * - redFlags: 0-8 items
 * - short phrases
 * - no duplicates
 */
@Injectable()
class RubricValidator {
    validate(rubric) {
        const errors = [];

        // Validate mustHave
        if (!rubric.mustHave || !Array.isArray(rubric.mustHave)) {
            errors.push('mustHave must be an array');
        } else {
            if (rubric.mustHave.length < 3) {
                errors.push('mustHave must have at least 3 items');
            }
            if (rubric.mustHave.length > 8) {
                errors.push('mustHave cannot have more than 8 items');
            }
            if (this.hasDuplicates(rubric.mustHave)) {
                errors.push('mustHave contains duplicates');
            }
            if (!this.areShortPhrases(rubric.mustHave)) {
                errors.push('mustHave items should be short phrases (max 100 chars)');
            }
        }

        // Validate goodToHave
        if (rubric.goodToHave) {
            if (!Array.isArray(rubric.goodToHave)) {
                errors.push('goodToHave must be an array');
            } else {
                if (rubric.goodToHave.length > 6) {
                    errors.push('goodToHave cannot have more than 6 items');
                }
                if (this.hasDuplicates(rubric.goodToHave)) {
                    errors.push('goodToHave contains duplicates');
                }
            }
        }

        // Validate redFlags
        if (rubric.redFlags) {
            if (!Array.isArray(rubric.redFlags)) {
                errors.push('redFlags must be an array');
            } else {
                if (rubric.redFlags.length > 8) {
                    errors.push('redFlags cannot have more than 8 items');
                }
                if (this.hasDuplicates(rubric.redFlags)) {
                    errors.push('redFlags contains duplicates');
                }
            }
        }

        // Check for cross-array duplicates
        const allItems = [
            ...(rubric.mustHave || []),
            ...(rubric.goodToHave || []),
            ...(rubric.redFlags || []),
        ];
        if (this.hasDuplicates(allItems)) {
            errors.push('Duplicate items found across mustHave, goodToHave, and redFlags');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    hasDuplicates(arr) {
        const lower = arr.map((s) => s.toLowerCase().trim());
        return new Set(lower).size !== lower.length;
    }

    areShortPhrases(arr) {
        return arr.every((s) => s.length <= 100);
    }

    sanitize(rubric) {
        return {
            mustHave: (rubric.mustHave || []).map((s) => s.trim()),
            goodToHave: (rubric.goodToHave || []).map((s) => s.trim()),
            redFlags: (rubric.redFlags || []).map((s) => s.trim()),
            idealAnswer: rubric.idealAnswer?.trim(),
            keywords: this.extractKeywords(rubric),
        };
    }

    extractKeywords(rubric) {
        const allItems = [
            ...(rubric.mustHave || []),
            ...(rubric.goodToHave || []),
        ];

        const keywords = new Set();
        for (const item of allItems) {
            const words = item.toLowerCase().split(/\s+/);
            for (const word of words) {
                if (word.length > 3) {
                    keywords.add(word);
                }
            }
        }

        return Array.from(keywords);
    }
}

module.exports = { RubricValidator };
