const { Injectable } = require('@nestjs/common');
const { PolicyEngine } = require('./policy.engine');
const { InterviewerService } = require('./interviewer.service');
const { EvaluatorService } = require('./evaluator.service');
const { AnalystService } = require('./analyst.service');

/**
 * Orchestrator Service - The main controller/brain of the interview system
 * Coordinates between interviewer, evaluator, and analyst agents
 */
@Injectable()
class OrchestratorService {
    constructor(
        policyEngine,
        interviewerService,
        evaluatorService,
        analystService,
    ) {
        this.policyEngine = policyEngine;
        this.interviewer = interviewerService;
        this.evaluator = evaluatorService;
        this.analyst = analystService;
    }

    /**
     * Process a complete answer cycle
     * 1. Evaluate the answer
     * 2. Update session memory
     * 3. Decide next action
     * 4. Get next question or end session
     */
    async processAnswerCycle(sessionState, answer, question) {
        // Step 1: Evaluate the answer
        const evaluation = await this.evaluator.evaluate(answer, question);

        // Step 2: Update session state with evaluation
        const updatedState = this.updateSessionState(sessionState, evaluation);

        // Step 3: Decide next action
        const decision = this.policyEngine.decide({
            lastScore: evaluation.score,
            followUpDepth: updatedState.followUpDepth,
            consecutiveLowScores: updatedState.consecutiveLowScores,
            questionsAsked: updatedState.questionCount,
            missingCorePoints: evaluation.missing,
            wrongClaims: evaluation.wrongClaims,
        });

        // Step 4: Execute decision
        let nextQuestion = null;
        let shouldEnd = false;

        switch (decision.action) {
            case 'follow_up':
                nextQuestion = await this.interviewer.generateFollowUp(
                    question,
                    evaluation,
                    decision.focusPoints,
                );
                updatedState.followUpDepth++;
                break;

            case 'increase_difficulty':
                updatedState.difficulty = this.policyEngine.adjustDifficulty(
                    updatedState.difficulty,
                    decision.action,
                );
                nextQuestion = await this.interviewer.selectQuestion(updatedState);
                updatedState.followUpDepth = 0;
                break;

            case 'switch_topic':
                updatedState.currentTopic = null;
                updatedState.consecutiveLowScores = 0;
                nextQuestion = await this.interviewer.selectQuestion(updatedState);
                updatedState.followUpDepth = 0;
                break;

            case 'end_session':
                shouldEnd = true;
                break;

            default:
                nextQuestion = await this.interviewer.selectQuestion(updatedState);
                updatedState.followUpDepth = 0;
        }

        // Step 5: Track patterns (async, for analytics)
        this.analyst.trackAnswer(sessionState.userId, evaluation, question)
            .catch((err) => console.error('Pattern tracking failed:', err));

        return {
            evaluation,
            decision,
            nextQuestion,
            shouldEnd,
            updatedState,
        };
    }

    /**
     * Generate final session report
     */
    async generateReport(sessionId, events) {
        return this.analyst.generateSessionReport(sessionId, events);
    }

    /**
     * Generate personalized study roadmap
     */
    async generateRoadmap(userId) {
        return this.analyst.generateRoadmap(userId);
    }

    /**
     * Update session state after evaluation
     */
    updateSessionState(state, evaluation) {
        const updatedState = { ...state };

        updatedState.lastEvaluation = {
            score: evaluation.score,
            covered: evaluation.covered,
            missing: evaluation.missing,
            wrongClaims: evaluation.wrongClaims,
        };

        // Track consecutive low scores
        if (evaluation.score < 4) {
            updatedState.consecutiveLowScores = (updatedState.consecutiveLowScores || 0) + 1;
        } else {
            updatedState.consecutiveLowScores = 0;
        }

        updatedState.questionCount = (updatedState.questionCount || 0) + 1;

        return updatedState;
    }
}

module.exports = { OrchestratorService };
