const { Injectable } = require('@nestjs/common');

/**
 * Report Generator - Creates detailed session reports
 */
@Injectable()
class ReportGenerator {
    generate(session) {
        const events = session.events || [];

        // Calculate overall score
        const scores = events.map((e) => e.score).filter((s) => s > 0);
        const overallScore = scores.length
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0;

        // Generate topic breakdown
        const topicBreakdown = this.generateTopicBreakdown(events);

        // Identify strengths and weaknesses
        const { strengths, weaknesses } = this.identifyStrengthsWeaknesses(topicBreakdown);

        // Generate recommendations
        const recommendations = this.generateRecommendations(weaknesses, events);

        // Detailed analysis
        const detailedAnalysis = this.generateDetailedAnalysis(events);

        return {
            overallScore,
            topicBreakdown,
            strengths,
            weaknesses,
            recommendations,
            detailedAnalysis,
        };
    }

    generateTopicBreakdown(events) {
        const breakdown = {};

        for (const event of events) {
            const topic = event.question?.topic || 'unknown';

            if (!breakdown[topic]) {
                breakdown[topic] = {
                    scores: [],
                    questions: 0,
                    correct: 0,
                };
            }

            breakdown[topic].scores.push(event.score);
            breakdown[topic].questions++;
            if (event.score >= 6) {
                breakdown[topic].correct++;
            }
        }

        // Calculate averages
        for (const topic of Object.keys(breakdown)) {
            const data = breakdown[topic];
            data.average = data.scores.length
                ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
                : 0;
            delete data.scores;
        }

        return breakdown;
    }

    identifyStrengthsWeaknesses(topicBreakdown) {
        const strengths = [];
        const weaknesses = [];

        for (const [topic, data] of Object.entries(topicBreakdown)) {
            if (data.average >= 7) {
                strengths.push(topic);
            } else if (data.average < 5) {
                weaknesses.push(topic);
            }
        }

        return { strengths, weaknesses };
    }

    generateRecommendations(weaknesses, events) {
        const recommendations = [];

        // Topic-based recommendations
        for (const topic of weaknesses) {
            recommendations.push(`Review fundamentals of ${topic}`);
            recommendations.push(`Practice more problems on ${topic}`);
        }

        // Pattern-based recommendations
        const allMissing = events.flatMap((e) => e.evaluation?.missing || []);
        const commonMissing = this.findCommonItems(allMissing);

        for (const item of commonMissing.slice(0, 3)) {
            recommendations.push(`Focus on understanding: ${item}`);
        }

        if (recommendations.length === 0) {
            recommendations.push('Great job! Keep practicing to maintain your skills.');
        }

        return [...new Set(recommendations)].slice(0, 8);
    }

    generateDetailedAnalysis(events) {
        return events.map((event, index) => ({
            questionNumber: index + 1,
            topic: event.question?.topic,
            score: event.score,
            covered: event.evaluation?.covered || [],
            missing: event.evaluation?.missing || [],
            feedback: event.feedback,
        }));
    }

    findCommonItems(items) {
        const counts = {};
        for (const item of items) {
            counts[item] = (counts[item] || 0) + 1;
        }

        return Object.entries(counts)
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .map(([item]) => item);
    }
}

module.exports = { ReportGenerator };
