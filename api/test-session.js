// Test script for session flow
const API = 'http://localhost:3001/api';

async function testSessionFlow() {
    console.log('🧪 Testing Session Flow\n');

    try {
        // 1. Start session
        console.log('1. Starting session...');
        const startRes = await fetch(`${API}/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: 'DSA', difficulty: 'Medium' }),
        });
        const startData = await startRes.json();

        if (!startData.success) {
            console.error('❌ Failed to start session:', startData.error);
            return;
        }

        const sessionId = startData.data.sessionId;
        const question = startData.data.currentQuestion;

        console.log(`   ✅ Session ID: ${sessionId}`);
        console.log(`   ✅ First Question: "${question.text.substring(0, 80)}..."\n`);

        // 2. Submit answer
        console.log('2. Submitting answer...');
        const answerRes = await fetch(`${API}/session/${sessionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionId: question.id,
                answer: 'A heap is a complete binary tree where each node has a value greater than or equal to (max-heap) or less than or equal to (min-heap) its children. The root contains the maximum or minimum element. Heaps are used to implement priority queues. The time complexity for insertion and deletion is O(log n).',
                responseTimeMs: 45000,
            }),
        });
        const answerData = await answerRes.json();

        if (!answerData.success) {
            console.error('❌ Failed to submit answer:', answerData.error);
            return;
        }

        console.log(`   ✅ Score: ${answerData.data.score}/100`);
        console.log(`   ✅ Feedback: ${answerData.data.feedback}`);
        console.log(`   ✅ Points Covered: ${answerData.data.pointsCovered.length}`);
        console.log(`   ✅ Points Missed: ${answerData.data.pointsMissed.length}\n`);

        // 3. Get next question
        console.log('3. Getting next question...');
        const nextRes = await fetch(`${API}/session/${sessionId}/question`);
        const nextData = await nextRes.json();

        if (nextData.success && nextData.data.question) {
            console.log(`   ✅ Next Question: "${nextData.data.question.text.substring(0, 80)}..."\n`);
        } else {
            console.log(`   ⚠️ No more questions or session complete\n`);
        }

        // 4. End session
        console.log('4. Ending session...');
        const endRes = await fetch(`${API}/session/${sessionId}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const endData = await endRes.json();

        if (!endData.success) {
            console.error('❌ Failed to end session:', endData.error);
            return;
        }

        console.log(`   ✅ Status: ${endData.data.status}`);
        console.log(`   ✅ Questions Answered: ${endData.data.questionsAnswered}`);
        console.log(`   ✅ Average Score: ${endData.data.averageScore}\n`);

        // 5. Get session details
        console.log('5. Getting session details...');
        const detailRes = await fetch(`${API}/session/${sessionId}`);
        const detailData = await detailRes.json();

        console.log(`   ✅ Session has ${detailData.data.events.length} events recorded\n`);

        console.log('✅ Session flow test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSessionFlow();
