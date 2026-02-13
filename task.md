# Task List

## Phase 1: Resume Based Interview Implementation (Completed)
- [x] Backend: Update Session schema for `adaptiveMode`, `resumeContext`, `interviewPlan`.
- [x] Backend: Implement `LLMService.generateInterviewPlan`.
- [x] Backend: Implement `POST /api/interview/plan`.
- [x] Frontend: Create `ResumeBasedPage` with Plan Generation flow.
- [x] Frontend: Integrate `POST /api/interview/plan` API.

## Phase 2: Adaptive Interview Mode (Completed)
- [x] Backend: Update `POST /session/start` to accept `adaptiveMode`.
- [x] Backend: Update `GET /session/:id/question` for AI-generated questions.
- [x] Backend: Implement `LLMService.generateNextQuestion`.
- [x] Frontend: Add Adaptive Mode toggle to `TopicWisePage`.

## Phase 3: Reports & Analytics (Completed)
- [x] Backend: Implement `LLMService.generateHiringReport`.
- [x] Backend: Implement `POST /api/interview/:sessionId/report`.
- [x] Frontend: Update `ResumeBasedPage` to fetch AI Report on completion.
- [x] Frontend: Update `TopicWisePage` to fetch AI Report if Adaptive Mode is on.

## Phase 4: Refinement & Testing (Pending)
- [ ] Test entire flow end-to-end.
- [ ] Verify error handling for LLM timeouts.
- [ ] Optimize prompts for better question generation.
