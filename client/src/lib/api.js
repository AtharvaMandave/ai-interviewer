const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        const token = localStorage.getItem('token');
        const headers = {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        // Only set JSON content type if it's not FormData
        const isFormData = (typeof FormData !== 'undefined' && options.body instanceof FormData);
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to API server. Make sure the backend is running on http://localhost:3001');
            }
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth API
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response.token) {
            localStorage.setItem('token', response.token);
            if (response.data) localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response;
    }

    async register(name, email, password) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (response.token) {
            localStorage.setItem('token', response.token);
            if (response.data) localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response;
    }

    async getMe() {
        return this.request('/auth/me');
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    // Questions API
    async getQuestions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/questions${query ? `?${query}` : ''}`);
    }

    async getQuestion(id) {
        return this.request(`/questions/${id}`);
    }

    async createQuestion(data) {
        return this.request('/questions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateQuestion(id, data) {
        return this.request(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteQuestion(id) {
        return this.request(`/questions/${id}`, {
            method: 'DELETE',
        });
    }

    async getQuestionStats() {
        return this.request('/questions/stats');
    }

    async getTopics(domain) {
        return this.request(`/questions/topics/${domain}`);
    }

    async bulkCreateQuestions(questions) {
        return this.request('/questions/bulk', {
            method: 'POST',
            body: JSON.stringify(questions),
        });
    }

    // Rubrics API
    async getRubric(questionId) {
        return this.request(`/rubrics/${questionId}`);
    }

    async createRubric(questionId, data) {
        return this.request(`/rubrics/${questionId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateRubric(questionId, data) {
        return this.request(`/rubrics/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async upsertRubric(questionId, data) {
        return this.request(`/rubrics/${questionId}/upsert`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteRubric(questionId) {
        return this.request(`/rubrics/${questionId}`, {
            method: 'DELETE',
        });
    }

    // ============= INTERVIEW API =============

    async startInterview(data) {
        return this.request('/interview/start', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSession(sessionId) {
        return this.request(`/interview/${sessionId}`);
    }

    async getNextQuestion(sessionId) {
        return this.request(`/interview/${sessionId}/question`);
    }

    async submitAnswer(sessionId, data) {
        return this.request(`/interview/${sessionId}/answer`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getHint(sessionId, attempt = 1) {
        return this.request(`/interview/${sessionId}/hint?attempt=${attempt}`);
    }

    async endInterview(sessionId) {
        return this.request(`/interview/${sessionId}/end`, {
            method: 'POST',
        });
    }

    async abandonInterview(sessionId, reason = '') {
        return this.request(`/interview/${sessionId}/abandon`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async getDomains() {
        return this.request('/interview/domains');
    }

    async getInterviewTopics(domain) {
        return this.request(`/interview/topics/${domain}`);
    }

    async getCompanies() {
        return this.request('/interview/companies');
    }

    async analyzeResume(resumeText) {
        return this.request('/interview/analyze-resume', {
            method: 'POST',
            body: JSON.stringify({ resumeText }),
        });
    }

    async parseResume(file) {
        const formData = new FormData();
        formData.append('resume', file);

        return this.request('/interview/parse-resume', {
            method: 'POST',
            body: formData,
        });
    }

    async generateFollowUp(sessionId, focusArea = null) {
        return this.request(`/interview/${sessionId}/follow-up`, {
            method: 'POST',
            body: JSON.stringify({ focusArea }),
        });
    }

    async generateInterviewPlan(resumeAnalysis, position) {
        return this.request('/interview/plan', {
            method: 'POST',
            body: JSON.stringify({ resumeAnalysis, position }),
        });
    }

    async generateHiringReport(sessionId) {
        return this.request(`/interview/${sessionId}/report`, {
            method: 'POST',
        });
    }

    // ============= AI API =============

    async getAIHealth() {
        return this.request('/ai/health');
    }

    async generateRubric(questionId, save = false) {
        return this.request(`/ai/rubric/generate?save=${save}`, {
            method: 'POST',
            body: JSON.stringify({ questionId }),
        });
    }

    async evaluateAnswer(questionId, answer) {
        return this.request('/ai/evaluate', {
            method: 'POST',
            body: JSON.stringify({ questionId, answer }),
        });
    }

    async hybridEvaluate(questionId, answer, sessionId = null) {
        return this.request('/ai/evaluate/hybrid', {
            method: 'POST',
            body: JSON.stringify({ questionId, answer, sessionId }),
        });
    }

    // ============= DASHBOARD API =============

    async getDashboardSummary(userId) {
        return this.request(`/dashboard/summary?userId=${userId}`);
    }

    async getDomainBreakdown(userId) {
        return this.request(`/dashboard/domains?userId=${userId}`);
    }

    async getSessionHistory(userId, limit = 20, offset = 0) {
        return this.request(`/dashboard/history?userId=${userId}&limit=${limit}&offset=${offset}`);
    }

    async getTrends(userId, days = 30) {
        return this.request(`/dashboard/trends?userId=${userId}&days=${days}`);
    }

    async getSkillData(userId, domain = null) {
        const url = domain
            ? `/dashboard/skills?userId=${userId}&domain=${domain}`
            : `/dashboard/skills?userId=${userId}`;
        return this.request(url);
    }

    async getMistakePatterns(userId) {
        return this.request(`/dashboard/mistakes?userId=${userId}`);
    }

    async resolveMistakePattern(userId, patternId) {
        return this.request(`/dashboard/mistakes/${patternId}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    }

    async getLeaderboard(domain = null, limit = 10) {
        const url = domain
            ? `/dashboard/leaderboard?domain=${domain}&limit=${limit}`
            : `/dashboard/leaderboard?limit=${limit}`;
        return this.request(url);
    }

    // ============= INTERVIEW CLARIFICATION =============

    async askClarification(sessionId, doubt) {
        return this.request(`/interview/${sessionId}/clarify`, {
            method: 'POST',
            body: JSON.stringify({ doubt }),
        });
    }
}

export const api = new ApiService();
export default api;
